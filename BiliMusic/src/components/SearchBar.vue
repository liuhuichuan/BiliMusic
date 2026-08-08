<script setup lang="ts">
import { LoaderCircle, Search, X } from "@lucide/vue";
import { ref } from "vue";

defineProps<{ loading: boolean }>();

const emit = defineEmits<{
  search: [query: string];
}>();

const input = ref("");

function submit() {
  const query = input.value.trim();
  if (query) emit("search", query);
}
</script>

<template>
  <form class="search-bar" role="search" @submit.prevent="submit">
    <Search class="search-icon" :size="17" />
    <input
      v-model="input"
      type="search"
      placeholder="搜索歌曲或歌手"
      aria-label="搜索歌曲或歌手"
      maxlength="80"
      @keydown.esc="input = ''"
    />
    <button
      v-if="input"
      class="clear-search"
      type="button"
      aria-label="清空搜索内容"
      @click="input = ''"
    >
      <X :size="14" />
    </button>
    <button class="submit-search" type="submit" :disabled="!input.trim() || loading">
      <LoaderCircle v-if="loading" class="spin" :size="15" />
      <span v-else>搜索</span>
    </button>
  </form>
</template>

<style scoped>
.search-bar {
  display: flex;
  align-items: center;
  width: min(390px, 38vw);
  height: 40px;
  padding-left: 13px;
  overflow: hidden;
  color: #9a979a;
  border: 1px solid rgba(34, 34, 37, 0.08);
  border-radius: 13px;
  background: rgba(255, 255, 255, 0.68);
  transition: 160ms ease;
}

.search-bar:focus-within {
  color: #d94d5e;
  border-color: rgba(217, 68, 88, 0.22);
  background: #fff;
  box-shadow: 0 8px 24px rgba(45, 39, 37, 0.06);
}

.search-icon {
  flex: 0 0 auto;
}

input {
  min-width: 0;
  flex: 1;
  height: 100%;
  padding: 0 10px;
  color: var(--ink);
  border: 0;
  outline: 0;
  background: transparent;
  font-size: 11px;
}

input::-webkit-search-cancel-button {
  display: none;
}

input::placeholder {
  color: #aaa7aa;
}

.clear-search {
  display: grid;
  width: 27px;
  height: 27px;
  flex: 0 0 auto;
  place-items: center;
  color: #a7a4a7;
  border: 0;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
}

.clear-search:hover {
  color: var(--ink);
  background: rgba(35, 35, 38, 0.05);
}

.submit-search {
  align-self: stretch;
  min-width: 58px;
  padding: 0 13px;
  color: #fff;
  border: 0;
  background: var(--ink);
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
}

@media (max-width: 820px) {
  .search-bar {
    width: min(330px, 42vw);
  }
}

@media (max-width: 620px) {
  .search-bar {
    width: auto;
    min-width: 0;
    flex: 1;
  }

  .submit-search {
    min-width: 40px;
    padding: 0 9px;
  }

  .submit-search span {
    font-size: 0;
  }

  .submit-search span::after {
    font-size: 13px;
    content: "→";
  }
}
</style>
