use serde_json::Value;
use std::{
    collections::{HashMap, VecDeque},
    sync::{Arc, Mutex},
    time::Duration,
};
use tauri::{http, State};

const KUGOU_BASE_URL: &str = "https://m.kugou.com";
const BILIBILI_API_BASE_URL: &str = "https://api.bilibili.com";
const BILIBILI_REFERER: &str = "https://www.bilibili.com/";
const KUGOU_USER_AGENT: &str =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148";
const BILIBILI_USER_AGENT: &str =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36";
const MAX_AUDIO_SOURCES: usize = 64;

#[derive(Default)]
struct AudioRegistry {
    next_id: u64,
    entries: HashMap<String, Vec<String>>,
    order: VecDeque<String>,
}

/// Tauri managed state lives for the entire application process.
/// Clients are shared so HTTP connections can be reused between requests.
struct ApiState {
    kugou_client: reqwest::Client,
    bilibili_client: reqwest::Client,
    bilibili_sources: Arc<Mutex<AudioRegistry>>,
}

fn is_safe_path(path: &str) -> bool {
    !path.contains("://") && !path.contains("..") && path.starts_with('/')
}

fn is_allowed_kugou_path(path: &str) -> bool {
    is_safe_path(path)
        && (path == "/?json=true"
            || path == "/rank/list&json=true"
            || path.starts_with("/rank/info/?"))
}

fn is_allowed_bilibili_path(path: &str) -> bool {
    is_safe_path(path)
        && (path.starts_with("/x/web-interface/search/type?")
            || path.starts_with("/x/web-interface/view?")
            || path.starts_with("/x/player/playurl?"))
}

fn is_allowed_bilibili_media_url(url: &str) -> bool {
    let Ok(url) = reqwest::Url::parse(url) else {
        return false;
    };
    if url.scheme() != "https" {
        return false;
    }

    let Some(host) = url.host_str() else {
        return false;
    };
    host == "bilivideo.com"
        || host.ends_with(".bilivideo.com")
        || host == "bilivideo.cn"
        || host.ends_with(".bilivideo.cn")
}

fn protocol_error(status: http::StatusCode, message: &str) -> http::Response<Vec<u8>> {
    http::Response::builder()
        .status(status)
        .header(http::header::CONTENT_TYPE, "text/plain; charset=utf-8")
        .header(http::header::ACCESS_CONTROL_ALLOW_ORIGIN, "*")
        .body(message.as_bytes().to_vec())
        .expect("valid protocol error response")
}

#[tauri::command]
async fn fetch_kugou(state: State<'_, ApiState>, path: String) -> Result<Value, String> {
    if !is_allowed_kugou_path(&path) {
        return Err("不支持的音乐接口路径".to_string());
    }

    state
        .kugou_client
        .get(format!("{KUGOU_BASE_URL}{path}"))
        .header(reqwest::header::ACCEPT, "application/json")
        .send()
        .await
        .map_err(|error| format!("音乐服务连接失败：{error}"))?
        .error_for_status()
        .map_err(|error| format!("音乐服务返回异常：{error}"))?
        .json::<Value>()
        .await
        .map_err(|error| format!("音乐数据解析失败：{error}"))
}

#[tauri::command]
async fn fetch_bilibili(state: State<'_, ApiState>, path: String) -> Result<Value, String> {
    if !is_allowed_bilibili_path(&path) {
        return Err("不支持的 Bilibili 接口路径".to_string());
    }

    state
        .bilibili_client
        .get(format!("{BILIBILI_API_BASE_URL}{path}"))
        .header(reqwest::header::ACCEPT, "application/json")
        .header(reqwest::header::REFERER, BILIBILI_REFERER)
        .header(reqwest::header::ORIGIN, "https://www.bilibili.com")
        .send()
        .await
        .map_err(|error| format!("Bilibili 连接失败：{error}"))?
        .error_for_status()
        .map_err(|error| format!("Bilibili 返回异常：{error}"))?
        .json::<Value>()
        .await
        .map_err(|error| format!("Bilibili 数据解析失败：{error}"))
}

#[tauri::command]
fn register_bilibili_audio(
    state: State<'_, ApiState>,
    urls: Vec<String>,
) -> Result<String, String> {
    if urls.is_empty()
        || urls.len() > 10
        || !urls.iter().all(|url| is_allowed_bilibili_media_url(url))
    {
        return Err("Bilibili 音频地址无效".to_string());
    }

    let mut unique_urls = Vec::new();
    for url in urls {
        if !unique_urls.contains(&url) {
            unique_urls.push(url);
        }
    }

    let mut registry = state
        .bilibili_sources
        .lock()
        .map_err(|_| "音频代理状态不可用".to_string())?;
    registry.next_id += 1;
    let token = format!("source-{}", registry.next_id);
    registry.entries.insert(token.clone(), unique_urls);
    registry.order.push_back(token.clone());

    while registry.order.len() > MAX_AUDIO_SOURCES {
        if let Some(expired) = registry.order.pop_front() {
            registry.entries.remove(&expired);
        }
    }
    Ok(token)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let kugou_client = reqwest::Client::builder()
        .timeout(Duration::from_secs(15))
        .user_agent(KUGOU_USER_AGENT)
        .build()
        .expect("failed to initialize Kugou HTTP client");
    let bilibili_client = reqwest::Client::builder()
        .timeout(Duration::from_secs(20))
        .user_agent(BILIBILI_USER_AGENT)
        .build()
        .expect("failed to initialize Bilibili HTTP client");
    let bilibili_sources = Arc::new(Mutex::new(AudioRegistry::default()));

    let protocol_client = bilibili_client.clone();
    let protocol_sources = Arc::clone(&bilibili_sources);

    tauri::Builder::default()
        .manage(ApiState {
            kugou_client,
            bilibili_client,
            bilibili_sources,
        })
        .register_asynchronous_uri_scheme_protocol(
            "bili-audio",
            move |_context, request, responder| {
                let client = protocol_client.clone();
                let sources = Arc::clone(&protocol_sources);
                let token = request.uri().path().trim_start_matches('/').to_string();
                let range = request
                    .headers()
                    .get(http::header::RANGE)
                    .and_then(|value| value.to_str().ok())
                    .map(str::to_string);

                tauri::async_runtime::spawn(async move {
                    let urls = sources
                        .lock()
                        .ok()
                        .and_then(|registry| registry.entries.get(&token).cloned());
                    let Some(urls) = urls else {
                        responder.respond(protocol_error(
                            http::StatusCode::NOT_FOUND,
                            "音频地址已过期，请重新播放歌曲",
                        ));
                        return;
                    };

                    for url in urls {
                        let mut upstream = client
                            .get(url)
                            .header(reqwest::header::REFERER, BILIBILI_REFERER)
                            .header(reqwest::header::ORIGIN, "https://www.bilibili.com");
                        if let Some(range) = &range {
                            upstream = upstream.header(reqwest::header::RANGE, range);
                        }

                        let Ok(response) = upstream.send().await else {
                            continue;
                        };
                        if !response.status().is_success() {
                            continue;
                        }

                        let status = response.status().as_u16();
                        let content_type = response
                            .headers()
                            .get(reqwest::header::CONTENT_TYPE)
                            .and_then(|value| value.to_str().ok())
                            .unwrap_or("audio/mp4")
                            .to_string();
                        let content_range = response
                            .headers()
                            .get(reqwest::header::CONTENT_RANGE)
                            .and_then(|value| value.to_str().ok())
                            .map(str::to_string);
                        let Ok(bytes) = response.bytes().await else {
                            continue;
                        };

                        let mut response = http::Response::builder()
                            .status(status)
                            .header(http::header::CONTENT_TYPE, content_type)
                            .header(http::header::CONTENT_LENGTH, bytes.len())
                            .header(http::header::ACCEPT_RANGES, "bytes")
                            .header(http::header::ACCESS_CONTROL_ALLOW_ORIGIN, "*");
                        if let Some(content_range) = content_range {
                            response = response.header(http::header::CONTENT_RANGE, content_range);
                        }

                        responder.respond(
                            response
                                .body(bytes.to_vec())
                                .expect("valid Bilibili audio response"),
                        );
                        return;
                    }

                    responder.respond(protocol_error(
                        http::StatusCode::BAD_GATEWAY,
                        "Bilibili 音频 CDN 暂时不可用",
                    ));
                });
            },
        )
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            fetch_kugou,
            fetch_bilibili,
            register_bilibili_audio
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
