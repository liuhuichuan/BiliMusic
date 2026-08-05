<script setup lang="ts">
import { Crown, Music2, Play, TrendingDown, TrendingUp } from "@lucide/vue";
import { MUSIC_ACCESS_LABEL, MusicAccess } from "../constants/music";
import type { Song } from "../types/music";
import { formatDuration } from "../utils/format";

const props = withDefaults(
  defineProps<{
    songs: Song[];
    activeId?: string;
    showCover?: boolean;
  }>(),
  { activeId: "", showCover: true },
);

const emit = defineEmits<{
  play: [song: Song, playlist: Song[]];
}>();

function trend(song: Song): number {
  if (!song.previousRank || song.previousRank <= 0) return 0;
  return song.previousRank - song.rank;
}
</script>

<template>
  <div class="song-list" :class="{ 'no-cover': !showCover }">
    <button
      v-for="song in props.songs"
      :key="song.id"
      class="song-row"
      :class="{ playing: activeId === song.id }"
      type="button"
      :aria-label="`播放 ${song.title} - ${song.artist}`"
      @click="emit('play', song, props.songs)"
    >
      <span class="song-rank" :class="{ podium: song.rank <= 3 }">
        <Crown v-if="song.rank === 1" :size="13" :fill="'currentColor'" />
        <span>{{ String(song.rank).padStart(2, '0') }}</span>
      </span>

      <span v-if="showCover" class="song-cover" :class="{ fallback: !song.cover }">
        <img v-if="song.cover" :src="song.cover" :alt="`${song.title} 封面`" loading="lazy" />
        <Music2 v-else :size="18" />
        <span class="cover-play"><Play :size="15" :fill="'currentColor'" /></span>
      </span>

      <span class="song-copy">
        <strong>{{ song.title }}</strong>
        <small>{{ song.artist }}</small>
      </span>

      <span class="song-trend" :class="{ up: trend(song) > 0, down: trend(song) < 0 }">
        <TrendingUp v-if="trend(song) > 0" :size="14" />
        <TrendingDown v-else-if="trend(song) < 0" :size="14" />
        <span v-if="trend(song)">{{ Math.abs(trend(song)) }}</span>
        <span v-else>—</span>
      </span>

      <span
        v-if="song.access !== MusicAccess.Free"
        class="quality-tag"
        :class="song.access"
      >
        {{ MUSIC_ACCESS_LABEL[song.access] }}
      </span>
      <span class="song-duration">{{ formatDuration(song.duration) }}</span>
      <span class="row-play"><Play :size="16" :fill="'currentColor'" /></span>
    </button>
  </div>
</template>

<style scoped src="../styles/song-list.css"></style>
