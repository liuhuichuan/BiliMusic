<script setup lang="ts">
import { Heart, RefreshCw, Wifi } from "@lucide/vue";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import AppSidebar from "./components/AppSidebar.vue";
import FavoritesView from "./components/FavoritesView.vue";
import NewSongsView from "./components/NewSongsView.vue";
import PlayerBar from "./components/PlayerBar.vue";
import RankingsView from "./components/RankingsView.vue";
import SearchBar from "./components/SearchBar.vue";
import SearchResultsView from "./components/SearchResultsView.vue";
import { useMusicCatalog } from "./composables/useMusicCatalog";
import { useFavorites } from "./composables/useFavorites";
import { usePlayer } from "./composables/usePlayer";
import { useSongSearch } from "./composables/useSongSearch";

const activeView = ref<"new" | "rankings" | "favorites" | "search">("new");
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

const { favorites, isFavorite, toggleFavorite } = useFavorites();
const {
  query: searchQuery,
  results: searchResults,
  total: searchTotal,
  loading: searchLoading,
  error: searchError,
  search: searchForSongs,
  retry: retrySearch,
} = useSongSearch();
const isCurrentTrackFavorite = computed(() =>
  currentTrack.value ? isFavorite(currentTrack.value) : false,
);

const isRefreshing = computed(() =>
  activeView.value === "new"
    ? newSongsLoading.value
    : activeView.value === "rankings"
      ? rankingsLoading.value
      : activeView.value === "search" && searchLoading.value,
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
  else if (activeView.value === "rankings") void loadRankings();
  else if (activeView.value === "search") retrySearch();
}

function openSearch(query: string) {
  activeView.value = "search";
  void searchForSongs(query);
}

function toggleCurrentFavorite() {
  if (!currentTrack.value) return;
  const added = toggleFavorite(currentTrack.value);
  showToast(added ? `已将“${currentTrack.value.title}”添加到我喜欢` : `已从我喜欢中删除“${currentTrack.value.title}”`);
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
        <SearchBar :loading="searchLoading" @search="openSearch" />
        <div class="topbar-meta">
          <div class="source-status">
            <span><Wifi :size="15" /></span>
            <div>
              <strong>榜单在线</strong>
              <small>数据来自酷狗音乐公开接口</small>
            </div>
          </div>
          <div class="topbar-actions">
            <button
              class="refresh-button"
              type="button"
              :disabled="isRefreshing || activeView === 'favorites'"
              @click="refreshCurrentView"
            >
              <RefreshCw :size="17" :class="{ spin: isRefreshing }" />
              <span>{{ isRefreshing ? '同步中' : '刷新' }}</span>
            </button>
            <button
              class="favorites-button"
              :class="{ active: activeView === 'favorites' }"
              type="button"
              aria-label="打开我喜欢"
              @click="activeView = 'favorites'"
            >
              <Heart :size="17" :fill="activeView === 'favorites' ? 'currentColor' : 'none'" />
              <span>我喜欢</span>
              <small v-if="favorites.length">{{ favorites.length }}</small>
            </button>
          </div>
        </div>
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
          v-else-if="activeView === 'rankings'"
          :ranks="ranks"
          :loading="rankingsLoading"
          :error="rankingsError"
          :active-id="currentTrack?.id"
          @play="playSong"
          @retry="loadRankings"
        />
        <FavoritesView
          v-else-if="activeView === 'favorites'"
          :songs="favorites"
          :active-id="currentTrack?.id"
          @play="playSong"
          @browse="activeView = 'new'"
        />
        <SearchResultsView
          v-else
          :query="searchQuery"
          :songs="searchResults"
          :total="searchTotal"
          :loading="searchLoading"
          :error="searchError"
          :active-id="currentTrack?.id"
          @play="playSong"
          @retry="retrySearch"
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
      :is-favorite="isCurrentTrackFavorite"
      @previous="playPrevious"
      @next="playNext"
      @toggle-favorite="toggleCurrentFavorite"
      @playback-error="showToast"
    />
  </div>
</template>
