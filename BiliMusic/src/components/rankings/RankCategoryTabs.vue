<script setup lang="ts">
import { AudioLines, Globe2, MapPin, Sparkles, TrendingUp } from "@lucide/vue";
import type { Component } from "vue";
import { RANK_CATEGORIES, RankCategory } from "../../constants/music";

defineProps<{
  selected: RankCategory;
  counts: Map<RankCategory, number>;
}>();

const emit = defineEmits<{
  select: [category: RankCategory];
}>();

const categoryIcons: Record<RankCategory, Component> = {
  [RankCategory.Popular]: TrendingUp,
  [RankCategory.Region]: MapPin,
  [RankCategory.Feature]: Sparkles,
  [RankCategory.Global]: Globe2,
  [RankCategory.Genre]: AudioLines,
};
</script>

<template>
  <div class="category-tabs" role="tablist" aria-label="榜单分类">
    <button
      v-for="category in RANK_CATEGORIES"
      :key="category.id"
      type="button"
      role="tab"
      :aria-selected="selected === category.id"
      :class="{ active: selected === category.id }"
      @click="emit('select', category.id)"
    >
      <component :is="categoryIcons[category.id]" :size="17" />
      {{ category.label }}
      <small>{{ counts.get(category.id) || 0 }}</small>
    </button>
  </div>
</template>
