// Language config shared by server and client (no runtime deps here).
export type Lang = "en" | "ru";
export const LANGS: Lang[] = ["en", "ru"];
export const DEFAULT_LANG: Lang = "en";
export const LANG_COOKIE = "compass_lang";

export function isLang(v: unknown): v is Lang {
  return v === "en" || v === "ru";
}
