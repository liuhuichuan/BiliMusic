<script setup lang="ts">
import { Music2 } from "@lucide/vue";
import type { Rank } from "../../types/music";

defineProps<{
  ranks: Rank[];
  selectedId?: number;
  categoryLabel: string;
}>();

const emit = defineEmits<{
  select: [rankId: number];
}>();
</script>

<template>
  <aside class="rank-picker" aria-label="分类榜单列表">
    <div class="picker-heading">
      <span>{{ categoryLabel }}榜单</span>
      <small>{{ ranks.length }} CHARTS</small>
    </div>

    <div class="rank-card-list">
      <button
        v-for="(rank, index) in ranks"
        :key="rank.id"
        type="button"
        class="rank-card"
        :class="{ active: selectedId === rank.id }"
        @click="emit('select', rank.id)"
      >
        <span class="rank-card-art" :style="{ background: rank.color }">
          <img v-if="rank.image" :src="rank.image" :alt="`${rank.name} 封面`" loading="lazy" />
          <Music2 v-else :size="22" />
        </span>
        <span class="rank-card-copy">
          <strong>{{ rank.name }}</strong>
          <small>{{ rank.frequency }}</small>
        </span>
        <span class="rank-card-index">{{ String(index + 1).padStart(2, '0') }}</span>
      </button>
    </div>
  </aside>
</template>
