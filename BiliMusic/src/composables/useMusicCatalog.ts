import { ref } from "vue";
import { getNewSongs, getRankings } from "../services/kugou";
import type { Rank, Song } from "../types/music";
import { getErrorMessage } from "../utils/errors";

/**
 * 负责首页新歌和榜单目录。
 * composable 是“可复用的状态 + 操作”，组件只需要关心怎么展示这些状态。
 */
export function useMusicCatalog() {
  const songs = ref<Song[]>([]);
  const ranks = ref<Rank[]>([]);
  const newSongsLoading = ref(false);
  const rankingsLoading = ref(false);
  const newSongsError = ref("");
  const rankingsError = ref("");

  async function loadNewSongs() {
    newSongsLoading.value = true;
    newSongsError.value = "";
    try {
      songs.value = await getNewSongs();
    } catch (error) {
      newSongsError.value = getErrorMessage(error);
    } finally {
      newSongsLoading.value = false;
    }
  }

  async function loadRankings() {
    rankingsLoading.value = true;
    rankingsError.value = "";
    try {
      ranks.value = await getRankings();
    } catch (error) {
      rankingsError.value = getErrorMessage(error);
    } finally {
      rankingsLoading.value = false;
    }
  }

  async function loadCatalog() {
    await Promise.all([loadNewSongs(), loadRankings()]);
  }

  return {
    songs,
    ranks,
    newSongsLoading,
    rankingsLoading,
    newSongsError,
    rankingsError,
    loadNewSongs,
    loadRankings,
    loadCatalog,
  };
}
