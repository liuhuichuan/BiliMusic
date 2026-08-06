import { Buffer } from "node:buffer";
import type { Plugin } from "vite";

const BILIBILI_REFERER = "https://www.bilibili.com/";
const BILIBILI_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36";

function isAllowedMediaUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      (url.hostname === "bilivideo.com" ||
        url.hostname.endsWith(".bilivideo.com") ||
        url.hostname === "bilivideo.cn" ||
        url.hostname.endsWith(".bilivideo.cn"))
    );
  } catch {
    return false;
  }
}

/** 浏览器开发环境没有 Rust 自定义协议，因此用本地 Vite 中间件补上媒体请求头。 */
export function bilibiliMediaProxy(): Plugin {
  return {
    name: "bilimusic-bilibili-media-proxy",
    configureServer(server) {
      server.middlewares.use("/bilibili-media", async (request, response) => {
        const requestUrl = new URL(request.url || "/", "http://localhost");
        const sourceUrl = requestUrl.searchParams.get("url") || "";
        if (!isAllowedMediaUrl(sourceUrl)) {
          response.statusCode = 400;
          response.end("Invalid Bilibili media URL");
          return;
        }

        const headers: Record<string, string> = {
          Referer: BILIBILI_REFERER,
          Origin: "https://www.bilibili.com",
          "User-Agent": BILIBILI_USER_AGENT,
        };
        if (typeof request.headers.range === "string") {
          headers.Range = request.headers.range;
        }

        try {
          const upstream = await fetch(sourceUrl, {
            method: request.method === "HEAD" ? "HEAD" : "GET",
            headers,
          });
          response.statusCode = upstream.status;
          for (const name of ["content-type", "content-range", "accept-ranges"]) {
            const value = upstream.headers.get(name);
            if (value) response.setHeader(name, value);
          }
          response.setHeader("Access-Control-Allow-Origin", "*");
          response.setHeader("Cache-Control", "no-store");

          if (request.method === "HEAD") {
            response.end();
            return;
          }
          const body = Buffer.from(await upstream.arrayBuffer());
          response.setHeader("Content-Length", body.length);
          response.end(body);
        } catch {
          response.statusCode = 502;
          response.end("Bilibili media proxy failed");
        }
      });
    },
  };
}
