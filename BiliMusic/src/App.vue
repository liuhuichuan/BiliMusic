<script setup lang="ts">
import { ref } from "vue";
import { invoke } from "@tauri-apps/api/core";

const name = ref("");
const greetMsg = ref("");
const loading = ref(false);
const errorMsg = ref("");

async function greet() {
  loading.value = true;
  errorMsg.value = "";

  try {
    greetMsg.value = await invoke<string>("greet", {
      name: name.value,
    });
  } catch (error) {
    errorMsg.value = String(error);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <main class="container">
    <h1>Welcome to Tauri + Vue</h1>

    <form class="row" @submit.prevent="greet">
      <input
        id="greet-input"
        v-model="name"
        placeholder="Enter a name..."
      />

      <button type="submit" :disabled="loading">
        {{ loading ? "Loading..." : "Greet" }}
      </button>
    </form>

    <p v-if="greetMsg">{{ greetMsg }}</p>
    <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
  </main>
</template>