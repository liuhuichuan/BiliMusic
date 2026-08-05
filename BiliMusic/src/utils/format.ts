export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "--:--";
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60);
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

export function formatCount(value: number): string {
  if (value >= 10000) return `${(value / 10000).toFixed(value >= 100000 ? 0 : 1)} 万`;
  return value.toLocaleString("zh-CN");
}

export function cleanIntro(value: string): string {
  return value.replace(/\r/g, "").replace(/\n+/g, " · ").trim();
}
