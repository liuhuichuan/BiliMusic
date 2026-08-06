import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import type { PlaybackTrack, Song } from "../types/music";

interface BilibiliResponse {
  code: number;
  message?: string;
}

interface SearchVideo {
  aid: number;
  bvid: string;
  title: string;
  author: string;
  duration: string;
  pic?: string;
  play?: number | string;
}

interface SearchResponse extends BilibiliResponse {
  data?: { result?: SearchVideo[] };
}

interface ViewResponse extends BilibiliResponse {
  data?: { pages?: Array<{ cid: number }> };
}

interface DashAudio {
  bandwidth?: number;
  mimeType?: string;
  mime_type?: string;
  codecs?: string;
  baseUrl?: string;
  base_url?: string;
  backupUrl?: string[];
  backup_url?: string[];
}

interface PlayUrlResponse extends BilibiliResponse {
  data?: { dash?: { audio?: DashAudio[] } };
}

const UNWANTED_VERSIONS = [
  "翻唱",
  "伴奏",
  "教学",
  "片段",
  "剪辑",
  "现场",
  "演唱会",
  "加速",
  "降调",
  "remix",
  "cover",
  "live",
];

function isTauriApp(): boolean {
  return Reflect.has(window, "__TAURI_INTERNALS__");
}

async function requestBilibili<T extends BilibiliResponse>(path: string): Promise<T> {
  const payload = isTauriApp()
    ? await invoke<T>("fetch_bilibili", { path })
    : await fetch(`/bilibili-api${path}`, { headers: { Accept: "application/json" } }).then(
        async (response) => {
          if (!response.ok) throw new Error(`Bilibili 请求失败（${response.status}）`);
          return response.json() as Promise<T>;
        },
      );

  if (payload.code !== 0) {
    const hint = payload.code === -412 ? "请求过于频繁，请稍后再试" : payload.message;
    throw new Error(hint || `Bilibili 接口异常（${payload.code}）`);
  }
  return payload;
}

function cleanHtml(text: string): string {
  return text
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function normalizeText(text: string): string {
  return cleanHtml(text)
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

function parseDuration(duration: string): number {
  return duration
    .split(":")
    .map(Number)
    .reduce((total, part) => total * 60 + part, 0);
}

/**
 * 搜索结果不是歌曲数据，需要结合歌名、歌手和时长挑出最接近的音乐视频。
 * 分数只用于排序，最终仍会逐个验证候选视频是否真的提供 DASH 音频。
 */
function matchScore(video: SearchVideo, song: Song): number {
  const videoTitle = normalizeText(video.title);
  const songTitle = normalizeText(song.title);
  const artist = normalizeText(song.artist);
  const uploader = normalizeText(video.author);
  let score = 0;

  score += videoTitle.includes(songTitle) ? 120 : -120;
  if (artist && videoTitle.includes(artist)) score += 45;
  if (artist && uploader.includes(artist)) score += 20;

  const difference = Math.abs(parseDuration(video.duration) - song.duration);
  if (difference <= 10) score += 35;
  else if (difference <= 25) score += 22;
  else if (difference <= 45) score += 8;
  else score -= Math.min(40, Math.round(difference / 10));

  const readableTitle = cleanHtml(video.title).toLocaleLowerCase();
  for (const keyword of UNWANTED_VERSIONS) {
    if (readableTitle.includes(keyword)) score -= 28;
  }

  const playCount = Number(video.play) || 0;
  score += Math.min(12, Math.log10(playCount + 1) * 2);
  return score;
}

function audioUrls(audio: DashAudio): string[] {
  const primary = audio.baseUrl || audio.base_url;
  const backups = audio.backupUrl || audio.backup_url || [];
  return [...new Set([primary, ...backups].filter((url): url is string => !!url))];
}

async function resolveAudio(video: SearchVideo): Promise<string[]> {
  const view = await requestBilibili<ViewResponse>(
    `/x/web-interface/view?bvid=${encodeURIComponent(video.bvid)}`,
  );
  const cid = view.data?.pages?.[0]?.cid;
  if (!cid) throw new Error("视频没有可播放的分 P");

  const play = await requestBilibili<PlayUrlResponse>(
    `/x/player/playurl?bvid=${encodeURIComponent(video.bvid)}` +
      `&cid=${encodeURIComponent(cid)}&qn=80&fnver=0&fnval=16&fourk=1`,
  );
  const available = play.data?.dash?.audio || [];
  const compatible = available.filter((item) =>
    `${item.mimeType || item.mime_type || ""};${item.codecs || ""}`.includes("mp4a"),
  );
  const candidates = compatible.length ? compatible : available;
  const best = [...candidates].sort((left, right) => (right.bandwidth || 0) - (left.bandwidth || 0))[0];
  const urls = best ? audioUrls(best) : [];
  if (!urls.length) throw new Error("视频没有兼容的音频流");
  return urls;
}

function browserProxyUrl(url: string): string {
  return `/bilibili-media?url=${encodeURIComponent(url)}`;
}

async function playableUrls(urls: string[]): Promise<{ audioUrl: string; fallbackUrls: string[] }> {
  if (!isTauriApp()) {
    return {
      audioUrl: browserProxyUrl(urls[0]),
      fallbackUrls: urls.slice(1).map(browserProxyUrl),
    };
  }

  // Rust 协议代理负责附加 Bilibili 必需的 Referer，并在上游失败时切换备用 CDN。
  const token = await invoke<string>("register_bilibili_audio", { urls });
  return {
    audioUrl: convertFileSrc(token, "bili-audio"),
    fallbackUrls: [],
  };
}

export async function getBilibiliPlayback(song: Song): Promise<PlaybackTrack> {
  const keyword = `${song.title} ${song.artist}`.trim();
  const search = await requestBilibili<SearchResponse>(
    `/x/web-interface/search/type?search_type=video&page=1&order=totalrank` +
      `&keyword=${encodeURIComponent(keyword)}`,
  );
  const ranked = (search.data?.result || [])
    .map((video) => ({ video, score: matchScore(video, song) }))
    .sort((left, right) => right.score - left.score);

  if (!ranked.length || ranked[0].score < 60) {
    throw new Error(`没有找到与“${song.title}”足够匹配的 Bilibili 音源`);
  }

  let lastError: unknown;
  for (const { video } of ranked.slice(0, 5)) {
    try {
      const urls = await resolveAudio(video);
      const playable = await playableUrls(urls);
      return {
        ...song,
        ...playable,
        source: {
          provider: "bilibili",
          label: "Bilibili 音源",
          videoId: video.bvid,
          videoTitle: cleanHtml(video.title),
          uploader: video.author,
          pageUrl: `https://www.bilibili.com/video/${video.bvid}`,
        },
      };
    } catch (error) {
      lastError = error;
    }
  }

  const detail = lastError instanceof Error ? `：${lastError.message}` : "";
  throw new Error(`找到相关视频，但没有可播放的 Bilibili 音频${detail}`);
}
