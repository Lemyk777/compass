// Language config shared by server and client (no runtime deps here).
// The site is English-only; the type stays a (single-member) union so the
// translator plumbing keeps working without per-call-site changes.
export type Lang = "en";
export const LANGS: Lang[] = ["en"];
export const DEFAULT_LANG: Lang = "en";
export const LANG_COOKIE = "compass_lang";

export function isLang(v: unknown): v is Lang {
  return v === "en";
}
