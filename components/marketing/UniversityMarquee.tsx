"use client";

import { useEffect, useRef, useState } from "react";
import type { UniversityLogo } from "@/lib/data/logos";

// A single scrolling line of real university logos. The list is discovered from
// /public/logos on the server (see lib/data/logos.ts) and passed in as `logos`,
// so adding or removing an image file updates this row automatically.

function LogoMark({ u }: { u: UniversityLogo }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/logos/${u.file}`}
      alt={u.name}
      title={u.name}
      loading="lazy"
      className="h-14 w-auto max-w-[170px] shrink-0 object-contain"
    />
  );
}

export function UniversityLogos({ logos }: { logos: UniversityLogo[] }) {
  if (logos.length === 0) return null;
  const doubled = [...logos, ...logos];
  return (
    <div className="marquee-row marquee-mask overflow-hidden">
      <div className="marquee-track items-center gap-12 pr-12">
        {doubled.map((u, i) => (
          <LogoMark key={i} u={u} />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Real country flags (flagcdn), revealed with a staggered animation on scroll.
// ---------------------------------------------------------------------------
const CODES = [
  "kz", "in", "ng", "br", "vn", "eg", "id", "pk", "tr", "kr",
  "cn", "mx", "ph", "bd", "ke", "co", "th", "uz", "my", "gh",
];

export function CountryReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setShown(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="flex flex-wrap justify-center gap-3">
      {CODES.map((c, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={c}
          src={`https://flagcdn.com/h80/${c}.png`}
          alt=""
          aria-hidden="true"
          loading="lazy"
          style={{ transitionDelay: `${i * 45}ms` }}
          className={`h-12 w-auto rounded-md shadow-lift transition-all duration-500 ease-out ${
            shown
              ? "translate-y-0 scale-100 opacity-100"
              : "translate-y-4 scale-90 opacity-0"
          }`}
        />
      ))}
    </div>
  );
}

/** Compact real-flag strip for tight spaces (auth panel). */
export function FlagStrip({ count = 16 }: { count?: number }) {
  return (
    <div className="flex flex-wrap gap-2">
      {CODES.slice(0, count).map((c) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={c}
          src={`https://flagcdn.com/h40/${c}.png`}
          alt=""
          aria-hidden="true"
          loading="lazy"
          className="h-6 w-auto rounded shadow-sm"
        />
      ))}
    </div>
  );
}
