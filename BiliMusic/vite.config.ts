import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { bilibiliMediaProxy } from "./vite/bilibiliMediaProxy";

const BILIBILI_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [vue(), bilibiliMediaProxy()],

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    proxy: {
      "/kugou-api": {
        target: "https://m.kugou.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/kugou-api/, ""),
        headers: {
          "User-Agent":
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148",
        },
      },
      "/kugou-search-api": {
        target: "https://songsearch.kugou.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/kugou-search-api/, ""),
        headers: {
          Accept: "application/json",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36",
        },
      },
      "/bilibili-api": {
        target: "https://api.bilibili.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/bilibili-api/, ""),
        headers: {
          Accept: "application/json",
          Origin: "https://www.bilibili.com",
          Referer: "https://www.bilibili.com/",
          "User-Agent": BILIBILI_USER_AGENT,
        },
      },
    },
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));
