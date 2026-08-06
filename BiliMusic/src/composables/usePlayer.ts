import { computed, ref } from "vue";
import { getBilibiliPlayback } from "../services/bilibili";
import type { PlaybackTrack, Song } from "../types/music";
import { getErrorMessage } from "../utils/errors";

/** 播放队列及音源解析。真正的 <audio> 控制仍由 PlayerBar 负责。 */
export function usePlayer() {
  const currentTrack = ref<PlaybackTrack>();
  const queue = ref<Song[]>([]);
  const queueIndex = ref(-1);
  const loading = ref(false);
  const error = ref("");

  // 每次点击歌曲都会递增。旧请求即使更晚返回，也不能覆盖新歌曲。
  let requestVersion = 0;

  const canGoPrevious = computed(() => queueIndex.value > 0);
  const canGoNext = computed(
    () => queueIndex.value >= 0 && queueIndex.value < queue.value.length - 1,
  );

  async function play(song: Song, playlist: Song[]) {
    const version = ++requestVersion;
    queue.value = playlist;
    queueIndex.value = playlist.findIndex((item) => item.id === song.id);
    loading.value = true;
    error.value = "";

    try {
      const track = await getBilibiliPlayback(song);
      if (version === requestVersion) currentTrack.value = track;
    } catch (caughtError) {
      if (version === requestVersion) error.value = getErrorMessage(caughtError);
    } finally {
      if (version === requestVersion) loading.value = false;
    }
  }

  function playAt(index: number) {
    const song = queue.value[index];
    if (song) void play(song, queue.value);
  }

  function playPrevious() {
    if (canGoPrevious.value) playAt(queueIndex.value - 1);
  }

  function playNext() {
    if (canGoNext.value) playAt(queueIndex.value + 1);
  }

  return {
    currentTrack,
    queue,
    queueIndex,
    loading,
    error,
    canGoPrevious,
    canGoNext,
    play,
    playPrevious,
    playNext,
  };
}
