<script setup lang="ts">
import { RefreshCw, Wifi } from "@lucide/vue";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import AppSidebar from "./components/AppSidebar.vue";
import NewSongsView from "./components/NewSongsView.vue";
import PlayerBar from "./components/PlayerBar.vue";
import RankingsView from "./components/RankingsView.vue";
import { useMusicCatalog } from "./composables/useMusicCatalog";
import { usePlayer } from "./composables/usePlayer";

const activeView = ref<"new" | "rankings">("new");
const toast = ref("");
let toastTimer: number | undefined;

const {
  songs,
  ranks,
  newSongsLoading,
  rankingsLoading,
  newSongsError,
  rankingsError,
  loadNewSongs,
  loadRankings,
  loadCatalog,
} = useMusicCatalog();

const {
  currentTrack,
  loading: playerLoading,
  error: playerError,
  canGoPrevious,
  canGoNext,
  play: playSong,
  playPrevious,
  playNext,
} = usePlayer();

const isRefreshing = computed(() =>
  activeView.value === "new" ? newSongsLoading.value : rankingsLoading.value,
);
function showToast(message: string) {
  toast.value = message;
  if (toastTimer) window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.value = "";
  }, 3600);
}

function refreshCurrentView() {
  if (activeView.value === "new") void loadNewSongs();
  else void loadRankings();
}

onMounted(() => {
  void loadCatalog();
});

watch(playerError, (message) => {
  if (message) showToast(message);
});

onBeforeUnmount(() => {
  if (toastTimer) window.clearTimeout(toastTimer);
});
</script>

<template>
  <div class="app-shell">
    <AppSidebar :active-view="activeView" @navigate="activeView = $event" />

    <div class="app-main">
      <header class="topbar">
        <div class="source-status">
          <span><Wifi :size="15" /></span>
          <div>
            <strong>榜单在线</strong>
            <small>数据来自酷狗音乐公开接口</small>
          </div>
        </div>
        <button class="refresh-button" type="button" :disabled="isRefreshing" @click="refreshCurrentView">
          <RefreshCw :size="17" :class="{ spin: isRefreshing }" />
          <span>{{ isRefreshing ? '同步中' : '刷新' }}</span>
        </button>
      </header>

      <main class="content-scroll">
        <NewSongsView
          v-if="activeView === 'new'"
          :songs="songs"
          :loading="newSongsLoading"
          :error="newSongsError"
          :active-id="currentTrack?.id"
          @play="playSong"
          @retry="loadNewSongs"
          @open-rankings="activeView = 'rankings'"
        />
        <RankingsView
          v-else
          :ranks="ranks"
          :loading="rankingsLoading"
          :error="rankingsError"
          :active-id="currentTrack?.id"
          @play="playSong"
          @retry="loadRankings"
        />
      </main>
    </div>

    <Transition name="toast">
      <div v-if="toast" class="toast" role="status">{{ toast }}</div>
    </Transition>

    <PlayerBar
      :track="currentTrack"
      :loading="playerLoading"
      :can-go-previous="canGoPrevious"
      :can-go-next="canGoNext"
      @previous="playPrevious"
      @next="playNext"
      @playback-error="showToast"
    />
  </div>
</template>
