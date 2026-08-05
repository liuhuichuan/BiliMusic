/** 把任意 catch 值转换成适合展示给用户的文本。 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error).replace(/^Error:\s*/, "");
}
