<script setup lang="ts">
import { Heart, Music2 } from "@lucide/vue";
import type { Song } from "../types/music";
import SongList from "./SongList.vue";

defineProps<{
  songs: Song[];
  activeId?: string;
}>();

const emit = defineEmits<{
  play: [song: Song, playlist: Song[]];
  browse: [];
}>();
</script>

<template>
  <section class="view-section favorites-view">
    <header class="page-heading favorites-heading">
      <div>
        <span class="eyebrow"><Heart :size="12" :fill="'currentColor'" /> MY FAVORITES</span>
        <h1>我喜欢</h1>
        <p>把此刻喜欢的旋律留在这里，随时重新播放。</p>
      </div>
      <div class="favorites-total">
        <strong>{{ songs.length }}</strong>
        <span>首收藏</span>
      </div>
    </header>

    <div v-if="songs.length" class="content-panel favorites-panel">
      <div class="panel-heading">
        <div>
          <span class="panel-icon favorite-panel-icon"><Heart :size="17" :fill="'currentColor'" /></span>
          <div>
            <h2>喜欢的歌曲</h2>
            <p>最近添加的歌曲排在最前面</p>
          </div>
        </div>
        <span class="panel-count">{{ songs.length }} TRACKS</span>
      </div>
      <SongList :songs="songs" :active-id="activeId" @play="emit('play', $event, songs)" />
    </div>

    <div v-else class="favorites-empty">
      <span class="empty-heart"><Heart :size="31" /></span>
      <Music2 class="empty-music-note" :size="18" />
      <h2>还没有喜欢的歌曲</h2>
      <p>播放一首歌，然后点击底部歌曲信息旁的红心，它就会出现在这里。</p>
      <button class="primary-button" type="button" @click="emit('browse')">去发现音乐</button>
    </div>
  </section>
</template>
