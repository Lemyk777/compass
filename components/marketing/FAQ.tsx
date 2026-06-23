"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useT } from "@/lib/i18n/client";
import { ScrollReveal } from "@/components/ui/ScrollAnimations";

// Objection-handling FAQ — earns its place near the close (not another result
// preview, which the hero already shows).
export function FAQ() {
  const t = useT();
  const [open, setOpen] = useState<number | null>(0);
  const items = [1, 2, 3, 4, 5, 6].map((i) => ({
    q: t(`landing.faqQ${i}`),
    a: t(`landing.faqA${i}`),
  }));

  return (
    <section className="w-full bg-[#F7F8FA] px-5 py-24 md:px-12 lg:px-20">
      <div className="mx-auto max-w-3xl">
        <ScrollReveal>
          <div className="mb-12 text-center">
            <h2 className="text-balance text-4xl font-medium tracking-tight text-ink md:text-5xl">
              {t("landing.faqTitle")}
            </h2>
            <p className="mt-4 text-lg font-light text-ink/60">{t("landing.faqSub")}</p>
          </div>
        </ScrollReveal>

        <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white shadow-[0_20px_50px_-30px_rgba(15,23,42,0.25)]">
          {items.map((it, i) => {
            const isOpen = open === i;
            return (
              <div key={i}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-black/[0.015]"
                >
                  <span className="text-base font-medium text-ink">{it.q}</span>
                  <span
                    className={`shrink-0 text-accent transition-transform duration-300 ${isOpen ? "rotate-45" : ""}`}
                    aria-hidden="true"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-5 text-pretty text-base font-light leading-relaxed text-ink/65">
                        {it.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
