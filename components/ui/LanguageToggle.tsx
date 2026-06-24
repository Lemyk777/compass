"use client";

import { useLang } from "@/lib/i18n/client";
import { LANGS, type Lang } from "@/lib/i18n/config";

export function LanguageToggle({ className = "" }: { className?: string }) {
  const { lang, setLang } = useLang();
  return (
    <div
      className={`inline-flex items-center rounded-lg border border-line bg-card p-0.5 ${className}`}
      role="group"
      aria-label="Language"
    >
      {LANGS.map((l: Lang) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`rounded-md min-h-[44px] px-2.5 text-xs font-semibold uppercase transition-colors focus-visible:focus-ring sm:px-3 ${
            lang === l
              ? "bg-ink text-white"
              : "text-ink-faint hover:text-ink"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
