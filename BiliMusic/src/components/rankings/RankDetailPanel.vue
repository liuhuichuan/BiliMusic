<script setup lang="ts">
import {
  ChevronDown,
  LoaderCircle,
  Music2,
  Play,
  RotateCcw,
  TrendingUp,
} from "@lucide/vue";
import type { Rank, RankDetail, Song } from "../../types/music";
import { cleanIntro, formatCount } from "../../utils/format";
import SongList from "../SongList.vue";

const props = defineProps<{
  rank?: Rank;
  detail?: RankDetail;
  loading: boolean;
  moreLoading: boolean;
  error: string;
  hasMore: boolean;
  activeId?: string;
}>();

const emit = defineEmits<{
  play: [song: Song, playlist: Song[]];
  retry: [];
  loadMore: [];
}>();

function playSong(song: Song) {
  if (props.detail) emit("play", song, props.detail.songs);
}

function playFirstSong() {
  const firstSong = props.detail?.songs[0];
  if (firstSong) playSong(firstSong);
}
</script>

<template>
  <article class="rank-detail">
    <div v-if="loading" class="detail-loading">
      <LoaderCircle class="spin" :size="26" />
      <p>正在读取榜单…</p>
    </div>

    <div v-else-if="error" class="detail-error state-card">
      <RotateCcw :size="26" />
      <h2>这个榜单暂时无法打开</h2>
      <p>{{ error }}</p>
      <button class="secondary-button" type="button" @click="emit('retry')">再试一次</button>
    </div>

    <template v-else-if="detail && rank">
      <header class="rank-hero">
        <div
          class="rank-hero-bg"
          :style="rank.banner ? { backgroundImage: `url(${rank.banner})` } : {}"
        ></div>
        <div class="rank-cover" :style="{ background: rank.color }">
          <img v-if="rank.image" :src="rank.image" :alt="`${rank.name} 封面`" />
          <Music2 v-else :size="44" />
        </div>
        <div class="rank-hero-copy">
          <span class="rank-label">BILIMUSIC CHART</span>
          <h2>{{ rank.name }}</h2>
          <p>{{ cleanIntro(rank.intro) }}</p>
          <div class="rank-meta">
            <span>{{ rank.frequency }}更新</span>
            <span>{{ formatCount(detail.total) }} 首收录</span>
          </div>
        </div>
        <button
          v-if="detail.songs.length"
          class="rank-play-all"
          type="button"
          aria-label="播放榜单第一首"
          @click="playFirstSong"
        >
          <Play :size="21" :fill="'currentColor'" />
        </button>
      </header>

      <div class="rank-list-heading">
        <div>
          <h3>榜单歌曲</h3>
          <p>已加载 {{ detail.songs.length }} / {{ detail.total }} 首</p>
        </div>
        <span>排名 <TrendingUp :size="14" /></span>
      </div>

      <SongList
        :songs="detail.songs"
        :active-id="activeId"
        :show-cover="false"
        @play="playSong"
      />

      <button
        v-if="hasMore"
        class="load-more"
        type="button"
        :disabled="moreLoading"
        @click="emit('loadMore')"
      >
        <LoaderCircle v-if="moreLoading" class="spin" :size="17" />
        <ChevronDown v-else :size="17" />
        {{ moreLoading ? "正在加载" : "加载更多" }}
      </button>
    </template>
  </article>
</template>
