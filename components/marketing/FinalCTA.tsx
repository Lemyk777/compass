"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useT } from "@/lib/i18n/client";

// Closing call-to-action — the page's final, decisive beat.
export function FinalCTA() {
  const t = useT();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });

  return (
    <section className="w-full bg-[#F7F8FA] px-5 py-28 md:px-12 lg:px-20">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 32 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-auto max-w-3xl overflow-hidden rounded-[2rem] border border-line bg-white px-8 py-16 text-center shadow-[0_40px_90px_-40px_rgba(15,23,42,0.25)] md:py-20"
      >
        <div className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-64 w-64 -translate-x-1/2 rounded-full bg-accent-soft opacity-60 blur-3xl" />
        <h2 className="text-balance text-4xl font-medium tracking-tight text-ink md:text-5xl">
          {t("landing.ctaTitle")}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-pretty text-lg font-light leading-relaxed text-ink/60">
          {t("landing.ctaSub")}
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 rounded-full bg-ink px-8 py-4 text-base font-medium text-white transition-all hover:bg-ink/90 hover:shadow-[0_0_30px_rgba(14,123,87,0.35)]"
          >
            {t("landing.ctaBuild")}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <Link
            href="/demo"
            className="inline-flex items-center rounded-full border border-ink/10 bg-white px-8 py-4 text-base font-medium text-ink transition-all hover:shadow-md"
          >
            {t("landing.seeSample") || "See a sample report"}
          </Link>
        </div>
        <p className="mt-6 text-sm text-ink-faint">{t("landing.free")}</p>
      </motion.div>
    </section>
  );
}
