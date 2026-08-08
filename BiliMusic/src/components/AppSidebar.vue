<script setup lang="ts">
import { BarChart3, Headphones, Music2, Sparkles } from "@lucide/vue";

defineProps<{ activeView: "new" | "rankings" | "favorites" | "search" }>();

const emit = defineEmits<{
  navigate: [view: "new" | "rankings"];
}>();
</script>

<template>
  <aside class="sidebar">
    <button class="brand" type="button" aria-label="BiliMusic 新歌榜" @click="emit('navigate', 'new')">
      <span class="brand-mark"><Music2 :size="20" :stroke-width="2.4" /></span>
      <span>
        <strong>BiliMusic</strong>
        <small>听见正在发生</small>
      </span>
    </button>

    <nav class="side-nav" aria-label="主导航">
      <p class="nav-label">音乐发现</p>
      <button
        type="button"
        :class="{ active: activeView === 'new' }"
        @click="emit('navigate', 'new')"
      >
        <Sparkles :size="19" />
        <span>新歌速递</span>
      </button>
      <button
        type="button"
        :class="{ active: activeView === 'rankings' }"
        @click="emit('navigate', 'rankings')"
      >
        <BarChart3 :size="19" />
        <span>排行榜</span>
      </button>
    </nav>

    <div class="side-note">
      <span class="side-note-icon"><Headphones :size="18" /></span>
      <div>
        <strong>每日新鲜抵达</strong>
        <span>聚合热门与分类榜单</span>
      </div>
    </div>
  </aside>
</template>

<style scoped src="../styles/sidebar.css"></style>
