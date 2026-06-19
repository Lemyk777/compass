"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_LANG, LANG_COOKIE, type Lang } from "@/lib/i18n/config";
import { makeT, type TFunc } from "@/lib/i18n/dictionary";

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: TFunc };

const LangContext = createContext<Ctx | null>(null);

export function LanguageProvider({
  initial,
  children,
}: {
  initial: Lang;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [lang, setLangState] = useState<Lang>(initial);

  const setLang = useCallback(
    (l: Lang) => {
      setLangState(l);
      // Persist for SSR + future requests, then re-render server components.
      document.cookie = `${LANG_COOKIE}=${l};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
      if (typeof document !== "undefined") document.documentElement.lang = l;
      router.refresh();
    },
    [router]
  );

  const value = useMemo<Ctx>(
    () => ({ lang, setLang, t: makeT(lang) }),
    [lang, setLang]
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

function useCtx(): Ctx {
  const ctx = useContext(LangContext);
  // Fallback so components don't crash if used outside the provider.
  if (!ctx) return { lang: DEFAULT_LANG, setLang: () => {}, t: makeT(DEFAULT_LANG) };
  return ctx;
}

/** Translator hook for client components. */
export function useT(): TFunc {
  return useCtx().t;
}

/** Current language + setter (for the language toggle). */
export function useLang() {
  const { lang, setLang } = useCtx();
  return { lang, setLang };
}
