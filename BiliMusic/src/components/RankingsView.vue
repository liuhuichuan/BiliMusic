<script setup lang="ts">
import { RotateCcw } from "@lucide/vue";
import { computed, toRef } from "vue";
import { RANK_CATEGORIES } from "../constants/music";
import { useRankBrowser } from "../composables/useRankBrowser";
import type { Rank, Song } from "../types/music";
import RankCategoryTabs from "./rankings/RankCategoryTabs.vue";
import RankDetailPanel from "./rankings/RankDetailPanel.vue";
import RankPicker from "./rankings/RankPicker.vue";

const props = defineProps<{
  ranks: Rank[];
  loading: boolean;
  error: string;
  activeId?: string;
}>();

const emit = defineEmits<{
  play: [song: Song, playlist: Song[]];
  retry: [];
}>();

const {
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
} = useRankBrowser(toRef(props, "ranks"));

const categoryLabel = computed(
  () => RANK_CATEGORIES.find((category) => category.id === selectedCategory.value)?.label || "",
);

function forwardPlay(song: Song, playlist: Song[]) {
  emit("play", song, playlist);
}
</script>

<template>
  <section class="view-section rankings-view">
    <div class="page-heading rankings-heading">
      <div>
        <span class="eyebrow"><span class="live-dot"></span> LIVE CHARTS</span>
        <h1>排行榜</h1>
        <p>从全网热度到细分曲风，一次看见正在流行的声音。</p>
      </div>
      <span class="ranking-total">{{ ranks.length || "—" }}<small>个榜单</small></span>
    </div>

    <RankCategoryTabs
      :selected="selectedCategory"
      :counts="categoryCounts"
      @select="selectCategory"
    />

    <div v-if="loading" class="ranking-layout">
      <div class="rank-picker skeleton-block"></div>
      <div class="rank-detail skeleton-block"></div>
    </div>

    <div v-else-if="error" class="state-card">
      <RotateCcw :size="28" />
      <h2>榜单暂时没有响应</h2>
      <p>{{ error }}</p>
      <button class="primary-button" type="button" @click="emit('retry')">重新加载</button>
    </div>

    <div v-else class="ranking-layout">
      <RankPicker
        :ranks="filteredRanks"
        :selected-id="selectedRankId"
        :category-label="categoryLabel"
        @select="selectRank"
      />
      <RankDetailPanel
        :rank="selectedRank"
        :detail="detail"
        :loading="detailLoading"
        :more-loading="moreLoading"
        :error="detailError"
        :has-more="hasMore"
        :active-id="activeId"
        @play="forwardPlay"
        @retry="retryDetail"
        @load-more="loadMore"
      />
    </div>
  </section>
</template>
