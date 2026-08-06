import { invoke } from "@tauri-apps/api/core";
import { MusicAccess, RankCategory } from "../constants/music";
import type {
  Rank,
  RankDetail,
  RawRank,
  RawSong,
  Song,
} from "../types/music";

interface HomeResponse {
  data?: RawSong[];
}

interface RankListResponse {
  rank?: {
    total?: number;
    list?: RawRank[];
  };
}

interface RankInfoResponse {
  info?: RawRank;
  songs?: {
    total?: number;
    page?: number;
    pagesize?: number;
    list?: RawSong[];
  };
}

const FALLBACK_COVERS = [
  "linear-gradient(145deg, #ff8c69, #ff5e73)",
  "linear-gradient(145deg, #7f7cff, #b16cea)",
  "linear-gradient(145deg, #38bdf8, #2dd4bf)",
  "linear-gradient(145deg, #f7c75d, #ff8c69)",
];

async function requestJson<T>(path: string): Promise<T> {
  if (Reflect.has(window, "__TAURI_INTERNALS__")) {
    return invoke<T>("fetch_kugou", { path });
  }

  const response = await fetch(`/kugou-api${path}`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`请求失败（${response.status}）`);
  return response.json() as Promise<T>;
}

function imageUrl(url?: string, size = 400): string {
  if (!url) return "";
  return url.replace("{size}", String(size)).replace(/^http:/, "https:");
}

function normalizeAccess(payType = 0, privilege = 0): MusicAccess {
  if (payType === 3) return MusicAccess.Vip;
  if (payType > 0 || privilege > 0) return MusicAccess.Paid;
  return MusicAccess.Free;
}

function splitFilename(filename = ""): { artist: string; title: string } {
  const separator = filename.indexOf(" - ");
  if (separator < 0) return { artist: "未知音乐人", title: filename || "未知歌曲" };
  return {
    artist: filename.slice(0, separator).trim(),
    title: filename.slice(separator + 3).trim(),
  };
}

function normalizeSong(raw: RawSong, index: number): Song {
  const parsed = splitFilename(raw.filename);
  return {
    id: raw.hash || `song-${index}`,
    title: raw.song_name || raw.songname || parsed.title,
    artist: raw.singer_name || raw.singername || raw.h5_author_name || parsed.artist,
    duration: raw.duration || 0,
    cover: imageUrl(raw.album_sizable_cover),
    rank: raw.sort || index + 1,
    previousRank: raw.last_sort,
    access: normalizeAccess(raw.pay_type, raw.privilege),
  };
}

function normalizeRank(raw: RawRank): Rank {
  const category = (raw.classify || RankCategory.Popular) as RankCategory;
  return {
    id: raw.rankid || 0,
    name: raw.rankname || "未命名榜单",
    image: imageUrl(raw.imgurl),
    banner: imageUrl(raw.banner7url || raw.bannerurl, 1000),
    intro: raw.intro || "记录此刻正在流行的声音。",
    frequency: raw.update_frequency || "定期更新",
    category,
    color: raw.album_cover_color || FALLBACK_COVERS[(category - 1) % FALLBACK_COVERS.length],
  };
}

export async function getNewSongs(): Promise<Song[]> {
  const payload = await requestJson<HomeResponse>("/?json=true");
  return (payload.data || []).map(normalizeSong);
}

export async function getRankings(): Promise<Rank[]> {
  const payload = await requestJson<RankListResponse>("/rank/list&json=true");
  return (payload.rank?.list || [])
    .map(normalizeRank)
    .filter((rank) => rank.id > 0);
}

export async function getRankDetail(rankId: number, page = 1): Promise<RankDetail> {
  const payload = await requestJson<RankInfoResponse>(
    `/rank/info/?rankid=${encodeURIComponent(rankId)}&page=${encodeURIComponent(page)}&json=true`,
  );
  const rawSongs = payload.songs?.list || [];
  return {
    info: normalizeRank(payload.info || { rankid: rankId }),
    songs: rawSongs.map(normalizeSong),
    total: payload.songs?.total || rawSongs.length,
    page: payload.songs?.page || page,
    pageSize: payload.songs?.pagesize || rawSongs.length,
  };
}
