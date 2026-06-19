import "server-only";
import { cookies } from "next/headers";
import { DEFAULT_LANG, LANG_COOKIE, isLang, type Lang } from "@/lib/i18n/config";
import { makeT, type TFunc } from "@/lib/i18n/dictionary";

/** Current language from the cookie (server components / route handlers). */
export function getLang(): Lang {
  const v = cookies().get(LANG_COOKIE)?.value;
  return isLang(v) ? v : DEFAULT_LANG;
}

/** Server-side translator bound to the request's language. */
export function getT(): TFunc {
  return makeT(getLang());
}
