import { ref } from "vue";
import type { Song } from "../types/music";

const STORAGE_KEY = "bilimusic-favorites";

function toStoredSong(song: Song): Song {
  return {
    id: song.id,
    title: song.title,
    artist: song.artist,
    duration: song.duration,
    cover: song.cover,
    rank: song.rank,
    previousRank: song.previousRank,
    access: song.access,
  };
}

function readFavorites(): Song[] {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];

    const parsed: unknown = JSON.parse(saved);
    return Array.isArray(parsed) ? (parsed as Song[]) : [];
  } catch {
    return [];
  }
}

/** “我喜欢”列表只保存歌曲资料，实际播放时仍会重新解析 Bilibili 音源。 */
export function useFavorites() {
  const favorites = ref<Song[]>(readFavorites());

  function isFavorite(song: Song): boolean {
    return favorites.value.some((item) => item.id === song.id);
  }

  function save() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites.value));
    } catch {
      // 某些 WebView 可能禁用本地存储；收藏仍会在当前运行期间生效。
    }
  }

  function toggleFavorite(song: Song): boolean {
    const added = !isFavorite(song);

    if (added) {
      favorites.value = [toStoredSong(song), ...favorites.value];
    } else {
      favorites.value = favorites.value.filter((item) => item.id !== song.id);
    }

    save();
    return added;
  }

  return { favorites, isFavorite, toggleFavorite };
}
