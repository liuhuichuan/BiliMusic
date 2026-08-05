import { computed, ref, watch, type Ref } from "vue";
import { RankCategory } from "../constants/music";
import { getRankDetail } from "../services/kugou";
import type { Rank, RankDetail } from "../types/music";
import { getErrorMessage } from "../utils/errors";

/** 分类选择、详情缓存和分页都集中在这里，RankingsView 只负责组合组件。 */
export function useRankBrowser(ranks: Ref<Rank[]>) {
  const selectedCategory = ref(RankCategory.Popular);
  const selectedRankId = ref<number>();
  const detail = ref<RankDetail>();
  const detailLoading = ref(false);
  const moreLoading = ref(false);
  const detailError = ref("");

  const cache = new Map<number, RankDetail>();
  let requestVersion = 0;

  const filteredRanks = computed(() =>
    ranks.value.filter((rank) => rank.category === selectedCategory.value),
  );

  const selectedRank = computed(() =>
    ranks.value.find((rank) => rank.id === selectedRankId.value),
  );

  const categoryCounts = computed(() => {
    const counts = new Map<RankCategory, number>();
    for (const rank of ranks.value) {
      counts.set(rank.category, (counts.get(rank.category) || 0) + 1);
    }
    return counts;
  });

  const hasMore = computed(
    () => !!detail.value && detail.value.songs.length < detail.value.total,
  );

  function selectCategory(category: RankCategory) {
    selectedCategory.value = category;
    selectedRankId.value = ranks.value.find((rank) => rank.category === category)?.id;
  }

  function selectRank(rankId: number) {
    selectedRankId.value = rankId;
  }

  async function loadRank(rankId: number) {
    const version = ++requestVersion;
    detailError.value = "";
    moreLoading.value = false;

    const cached = cache.get(rankId);
    if (cached) {
      detail.value = cached;
      detailLoading.value = false;
      return;
    }

    detailLoading.value = true;
    detail.value = undefined;
    try {
      const result = await getRankDetail(rankId);
      if (version !== requestVersion) return;
      detail.value = result;
      cache.set(rankId, result);
    } catch (error) {
      if (version === requestVersion) detailError.value = getErrorMessage(error);
    } finally {
      if (version === requestVersion) detailLoading.value = false;
    }
  }

  async function loadMore() {
    const current = detail.value;
    if (!current || moreLoading.value || !hasMore.value) return;

    // 固定请求发出时的榜单，避免切换榜单后把两份歌曲错误合并。
    const rankId = current.info.id;
    const nextPage = current.page + 1;
    const existingSongs = current.songs;
    const version = requestVersion;
    moreLoading.value = true;
    detailError.value = "";

    try {
      const next = await getRankDetail(rankId, nextPage);
      if (version !== requestVersion || selectedRankId.value !== rankId) return;
      const merged = { ...next, songs: [...existingSongs, ...next.songs] };
      detail.value = merged;
      cache.set(rankId, merged);
    } catch (error) {
      if (selectedRankId.value === rankId) detailError.value = getErrorMessage(error);
    } finally {
      if (selectedRankId.value === rankId) moreLoading.value = false;
    }
  }

  function retryDetail() {
    const rankId = selectedRankId.value;
    if (!rankId) return;
    cache.delete(rankId);
    void loadRank(rankId);
  }

  watch(
    ranks,
    (availableRanks) => {
      const stillExists = availableRanks.some((rank) => rank.id === selectedRankId.value);
      if (!stillExists) {
        selectedRankId.value = availableRanks.find(
          (rank) => rank.category === selectedCategory.value,
        )?.id;
      }
    },
    { immediate: true },
  );

  watch(
    selectedRankId,
    (rankId) => {
      if (rankId) void loadRank(rankId);
    },
    { immediate: true },
  );

  return {
    selectedCategory,
    selectedRankId,
    selectedRank,
    filteredRanks,
    categoryCounts,
    detail,
    detailLoading,
    moreLoading,
    detailError,
    hasMore,
    selectCategory,
    selectRank,
    loadMore,
    retryDetail,
  };
}
