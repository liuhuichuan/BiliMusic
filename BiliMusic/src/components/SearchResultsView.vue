<script setup lang="ts">
import { AlertCircle, LoaderCircle, Search, SearchX } from "@lucide/vue";
import type { Song } from "../types/music";
import SongList from "./SongList.vue";

defineProps<{
  query: string;
  songs: Song[];
  total: number;
  loading: boolean;
  error: string;
  activeId?: string;
}>();

const emit = defineEmits<{
  play: [song: Song, playlist: Song[]];
  retry: [];
}>();
</script>

<template>
  <section class="view-section search-results-view">
    <header class="page-heading search-heading">
      <div>
        <span class="eyebrow"><Search :size="12" /> MUSIC SEARCH</span>
        <h1>搜索结果</h1>
        <p v-if="query">正在查找与“{{ query }}”相关的歌曲和音乐人。</p>
      </div>
      <div v-if="!loading && !error" class="search-total">
        <strong>{{ songs.length }}</strong>
        <span>条结果</span>
      </div>
    </header>

    <div v-if="loading" class="search-state">
      <LoaderCircle class="spin" :size="30" />
      <h2>正在搜索</h2>
      <p>正在整理与“{{ query }}”相关的歌曲…</p>
    </div>

    <div v-else-if="error" class="search-state error">
      <AlertCircle :size="31" />
      <h2>搜索暂时不可用</h2>
      <p>{{ error }}</p>
      <button class="secondary-button" type="button" @click="emit('retry')">重新搜索</button>
    </div>

    <div v-else-if="!songs.length" class="search-state">
      <SearchX :size="34" />
      <h2>没有找到相关歌曲</h2>
      <p>可以试试缩短关键词，或换成歌手名字再次搜索。</p>
    </div>

    <div v-else class="content-panel search-panel">
      <div class="panel-heading">
        <div>
          <span class="panel-icon"><Search :size="17" /></span>
          <div>
            <h2>匹配歌曲</h2>
            <p>点击任意结果，通过 Bilibili 音源播放</p>
          </div>
        </div>
        <span class="panel-count">约 {{ total }} 条相关内容</span>
      </div>
      <SongList :songs="songs" :active-id="activeId" @play="emit('play', $event, songs)" />
    </div>
  </section>
</template>

<style scoped>
.search-heading {
  align-items: center;
}

.search-heading .eyebrow {
  color: #d94d5e;
}

.search-total {
  display: flex;
  align-items: baseline;
  gap: 7px;
  padding: 12px 16px;
  border: 1px solid var(--line);
  border-radius: 15px;
  background: rgba(255, 255, 255, 0.66);
}

.search-total strong {
  font-size: 25px;
  letter-spacing: -0.05em;
}

.search-total span {
  color: var(--muted);
  font-size: 9px;
}

.search-panel {
  overflow: hidden;
}

.search-state {
  display: grid;
  min-height: 390px;
  place-content: center;
  justify-items: center;
  padding: 40px;
  color: #d94d5e;
  text-align: center;
  border: 1px solid rgba(34, 34, 37, 0.07);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.66);
}

.search-state.error {
  color: var(--accent-deep);
}

.search-state h2 {
  margin: 15px 0 6px;
  color: var(--ink);
  font-size: 17px;
}

.search-state p {
  max-width: 420px;
  margin: 0;
  color: var(--muted);
  font-size: 10px;
  line-height: 1.7;
}

.search-state .secondary-button {
  margin-top: 17px;
}

@media (max-width: 620px) {
  .search-total {
    padding: 9px 12px;
  }

  .search-total strong {
    font-size: 21px;
  }

  .panel-count {
    display: none;
  }
}
</style>
