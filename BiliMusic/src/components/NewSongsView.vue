<script setup lang="ts">
import { ArrowRight, Disc3, Music2, Play, Radio, Sparkles } from "@lucide/vue";
import { computed } from "vue";
import type { Song } from "../types/music";
import SongList from "./SongList.vue";

const props = defineProps<{
  songs: Song[];
  loading: boolean;
  error: string;
  activeId?: string;
}>();

const emit = defineEmits<{
  play: [song: Song, playlist: Song[]];
  retry: [];
  openRankings: [];
}>();

const leadSong = computed(() => props.songs[0]);
const spotlights = computed(() => props.songs.slice(1, 4));
</script>

<template>
  <section class="view-section new-songs-view">
    <div class="page-heading">
      <div>
        <span class="eyebrow"><span class="live-dot"></span> TODAY'S RELEASES</span>
        <h1>今天，听点新的</h1>
        <p>从当下新歌中，挑出值得按下播放键的声音。</p>
      </div>
      <button class="text-action" type="button" @click="emit('openRankings')">
        浏览全部榜单 <ArrowRight :size="17" />
      </button>
    </div>

    <div v-if="loading" class="hero-skeleton skeleton-block"></div>

    <div v-else-if="error" class="state-card">
      <Radio :size="28" />
      <h2>新歌信号暂时走丢了</h2>
      <p>{{ error }}</p>
      <button class="primary-button" type="button" @click="emit('retry')">重新连接</button>
    </div>

    <template v-else-if="leadSong">
      <article class="new-hero">
        <div class="hero-glow"></div>
        <div class="hero-copy">
          <span class="hero-kicker"><Sparkles :size="15" /> 新歌首发</span>
          <h2>{{ leadSong.title }}</h2>
          <p>{{ leadSong.artist }}</p>
          <div class="hero-meta">
            <span><Disc3 :size="15" /> 今日第 1 名</span>
            <span>{{ songs.length }} 首新鲜上榜</span>
          </div>
          <button class="hero-play" type="button" @click="emit('play', leadSong, songs)">
            <Play :size="18" :fill="'currentColor'" /> 立即播放
          </button>
        </div>

        <div class="hero-art" :class="{ fallback: !leadSong.cover }">
          <img v-if="leadSong.cover" :src="leadSong.cover" :alt="`${leadSong.title} 封面`" />
          <Music2 v-else :size="54" />
          <span class="vinyl-ring"></span>
        </div>

        <div class="hero-number">01</div>
      </article>

      <div class="spotlight-grid">
        <button
          v-for="song in spotlights"
          :key="song.id"
          type="button"
          class="spotlight-card"
          @click="emit('play', song, songs)"
        >
          <span class="spotlight-cover" :class="{ fallback: !song.cover }">
            <img v-if="song.cover" :src="song.cover" :alt="`${song.title} 封面`" />
            <Music2 v-else :size="24" />
            <span><Play :size="18" :fill="'currentColor'" /></span>
          </span>
          <span class="spotlight-copy">
            <small>NEW · {{ String(song.rank).padStart(2, '0') }}</small>
            <strong>{{ song.title }}</strong>
            <span>{{ song.artist }}</span>
          </span>
        </button>
      </div>

      <section class="content-panel release-list-panel">
        <div class="panel-heading">
          <div>
            <span class="panel-icon"><Radio :size="18" /></span>
            <div>
              <h2>新歌完整榜</h2>
              <p>数据实时更新 · 点击歌曲即可尝试播放</p>
            </div>
          </div>
          <span class="panel-count">{{ songs.length }} TRACKS</span>
        </div>
        <SongList :songs="songs" :active-id="activeId" @play="emit('play', $event, songs)" />
      </section>
    </template>
  </section>
</template>
