import { ref } from "vue";
import { searchSongs } from "../services/kugou";
import type { Song } from "../types/music";
import { getErrorMessage } from "../utils/errors";

/** 管理一次歌曲搜索的输入结果、加载状态和错误信息。 */
export function useSongSearch() {
  const query = ref("");
  const results = ref<Song[]>([]);
  const total = ref(0);
  const loading = ref(false);
  const error = ref("");
  let requestVersion = 0;

  async function search(nextQuery: string) {
    const normalizedQuery = nextQuery.trim();
    if (!normalizedQuery) return;

    const version = ++requestVersion;
    query.value = normalizedQuery;
    loading.value = true;
    error.value = "";

    try {
      const response = await searchSongs(normalizedQuery);
      if (version !== requestVersion) return;
      results.value = response.songs;
      total.value = response.total;
    } catch (caughtError) {
      if (version !== requestVersion) return;
      results.value = [];
      total.value = 0;
      error.value = getErrorMessage(caughtError);
    } finally {
      if (version === requestVersion) loading.value = false;
    }
  }

  function retry() {
    if (query.value) void search(query.value);
  }

  return { query, results, total, loading, error, search, retry };
}
