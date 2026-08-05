use serde_json::Value;
use std::time::Duration;
use tauri::State;

const KUGOU_BASE_URL: &str = "https://m.kugou.com";
const MOBILE_USER_AGENT: &str =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148";

/// Tauri managed state lives for the entire application process.
/// Reusing one client keeps HTTP connections pooled between requests.
struct ApiState {
    client: reqwest::Client,
}

fn is_allowed_kugou_path(path: &str) -> bool {
    if path.contains("://") || path.contains("..") || !path.starts_with('/') {
        return false;
    }

    path == "/?json=true"
        || path == "/rank/list&json=true"
        || path.starts_with("/rank/info/?")
        || path.starts_with("/app/i/getSongInfo.php?")
}

#[tauri::command]
async fn fetch_kugou(state: State<'_, ApiState>, path: String) -> Result<Value, String> {
    if !is_allowed_kugou_path(&path) {
        return Err("不支持的音乐接口路径".to_string());
    }

    state
        .client
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let api_state = ApiState {
        client: reqwest::Client::builder()
            .timeout(Duration::from_secs(15))
            .user_agent(MOBILE_USER_AGENT)
            .build()
            .expect("failed to initialize Kugou HTTP client"),
    };

    tauri::Builder::default()
        .manage(api_state)
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![fetch_kugou])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
