<script setup lang="ts">
import {
  ListMusic,
  LoaderCircle,
  Music2,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume1,
  Volume2,
} from "@lucide/vue";
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import type { PlaybackTrack } from "../types/music";
import { formatDuration } from "../utils/format";

const props = defineProps<{
  track?: PlaybackTrack;
  loading: boolean;
  canGoPrevious: boolean;
  canGoNext: boolean;
}>();

const emit = defineEmits<{
  previous: [];
  next: [];
  playbackError: [message: string];
}>();

const audio = ref<HTMLAudioElement>();
const playing = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const volume = ref(0.75);
const audioSource = ref("");
const fallbackSources = ref<string[]>([]);
const fallbackIndex = ref(-1);

const progress = computed(() => (duration.value ? (currentTime.value / duration.value) * 100 : 0));

async function togglePlayback() {
  if (!audio.value || !props.track) return;
  if (audio.value.paused) {
    try {
      await audio.value.play();
    } catch {
      playing.value = false;
    }
  } else {
    audio.value.pause();
  }
}

function updateProgress() {
  if (!audio.value) return;
  currentTime.value = audio.value.currentTime;
  duration.value = audio.value.duration || props.track?.duration || 0;
}

function seek(event: Event) {
  if (!audio.value) return;
  const value = Number((event.target as HTMLInputElement).value);
  audio.value.currentTime = (value / 100) * (duration.value || 0);
}

function updateVolume(event: Event) {
  volume.value = Number((event.target as HTMLInputElement).value);
  if (audio.value) audio.value.volume = volume.value;
}

async function startCurrentSource() {
  await nextTick();
  if (!audio.value || !audioSource.value) return;
  audio.value.volume = volume.value;
  audio.value.load();
  try {
    await audio.value.play();
  } catch {
    playing.value = false;
  }
}

async function handleAudioError() {
  // 空播放器在部分 WebView 中也会触发 error，不应被当成歌曲播放失败。
  if (!props.track || !audioSource.value) return;

  const nextIndex = fallbackIndex.value + 1;
  const fallback = fallbackSources.value[nextIndex];
  if (!fallback) {
    playing.value = false;
    emit("playbackError", "Bilibili 音源已经失效，请稍后重试或重新选择歌曲");
    return;
  }

  fallbackIndex.value = nextIndex;
  audioSource.value = fallback;
  await startCurrentSource();
}

watch(
  () => props.track?.audioUrl,
  async () => {
    currentTime.value = 0;
    duration.value = props.track?.duration || 0;
    fallbackIndex.value = -1;
    fallbackSources.value = props.track?.fallbackUrls || [];
    audioSource.value = props.track?.audioUrl || "";
    await startCurrentSource();
  },
);

onBeforeUnmount(() => audio.value?.pause());
</script>

<template>
  <footer class="player-bar" :class="{ empty: !track }">
    <audio
      ref="audio"
      :src="audioSource"
      @timeupdate="updateProgress"
      @loadedmetadata="updateProgress"
      @play="playing = true"
      @pause="playing = false"
      @ended="emit('next')"
      @error="handleAudioError"
    ></audio>

    <div class="now-playing">
      <span class="player-cover" :class="{ fallback: !track?.cover }">
        <img v-if="track?.cover" :src="track.cover" :alt="`${track.title} 封面`" />
        <LoaderCircle v-else-if="loading" class="spin" :size="21" />
        <Music2 v-else :size="21" />
      </span>
      <span class="player-copy">
        <strong>{{ loading ? '正在匹配 Bilibili 音源…' : track?.title || '还没有播放音乐' }}</strong>
        <small>
          {{ track?.artist || '从榜单中挑一首喜欢的歌' }}
          <span v-if="track" class="player-source">{{ track.source.label }}</span>
        </small>
      </span>
    </div>

    <div class="player-center">
      <div class="player-controls">
        <button type="button" :disabled="!canGoPrevious || loading" aria-label="上一首" @click="emit('previous')">
          <SkipBack :size="18" :fill="'currentColor'" />
        </button>
        <button class="main-play" type="button" :disabled="!track || loading" :aria-label="playing ? '暂停' : '播放'" @click="togglePlayback">
          <LoaderCircle v-if="loading" class="spin" :size="19" />
          <Pause v-else-if="playing" :size="19" :fill="'currentColor'" />
          <Play v-else :size="19" :fill="'currentColor'" />
        </button>
        <button type="button" :disabled="!canGoNext || loading" aria-label="下一首" @click="emit('next')">
          <SkipForward :size="18" :fill="'currentColor'" />
        </button>
      </div>
      <div class="progress-wrap">
        <span>{{ formatDuration(currentTime) }}</span>
        <input
          type="range"
          min="0"
          max="100"
          step="0.1"
          :value="progress"
          :style="{ '--range-progress': `${progress}%` }"
          :disabled="!track"
          aria-label="播放进度"
          @input="seek"
        />
        <span>{{ formatDuration(duration || track?.duration || 0) }}</span>
      </div>
    </div>

    <div class="player-extras">
      <ListMusic :size="18" />
      <Volume1 v-if="volume < 0.5" :size="18" />
      <Volume2 v-else :size="18" />
      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        :value="volume"
        :style="{ '--range-progress': `${volume * 100}%` }"
        aria-label="音量"
        @input="updateVolume"
      />
    </div>
  </footer>
</template>
