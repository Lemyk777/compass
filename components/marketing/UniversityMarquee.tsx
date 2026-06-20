"use client";

import { useEffect, useRef, useState } from "react";

// A scrolling "logo wall" of real university logos (served from /public/logos).
// `file` points at the real image; if it's missing or fails to load we fall
// back to a tasteful academic seal so the wall never looks broken.
type Logo = { name: string; mono: string; color: string; file?: string };

const LOGOS: Logo[] = [
  { name: "Harvard", mono: "H", color: "#A51C30", file: "harvard.svg" },
  { name: "Yale", mono: "Y", color: "#00356B", file: "yale.png" },
  { name: "Princeton", mono: "P", color: "#E77500", file: "princeton.svg" },
  { name: "Stanford", mono: "S", color: "#8C1515", file: "stanford.jpg" },
  { name: "Penn", mono: "P", color: "#990000", file: "penn.png" },
  { name: "Northwestern", mono: "N", color: "#4E2A84", file: "northwestern.png" },
  { name: "Berkeley", mono: "B", color: "#003262", file: "berkeley.svg" },
  { name: "NYU", mono: "NYU", color: "#57068C", file: "nyu.png" },
  { name: "Duke", mono: "D", color: "#00539B", file: "duke.png" },
  { name: "Rice", mono: "R", color: "#002469", file: "rice.png" },
  { name: "UCLA", mono: "LA", color: "#2774AE", file: "ucla.avif" },
  { name: "Washington", mono: "W", color: "#4B2E83", file: "washington.png" },
  // Seal-only (no logo file yet) — kept for variety:
  { name: "MIT", mono: "MIT", color: "#A31F34" },
  { name: "Columbia", mono: "C", color: "#1D4F91" },
  { name: "Cornell", mono: "C", color: "#B31B1B" },
  { name: "Dartmouth", mono: "D", color: "#00693E" },
  { name: "Chicago", mono: "U", color: "#800000" },
  { name: "Johns Hopkins", mono: "JH", color: "#002D72" },
];

function Seal({ u }: { u: Logo }) {
  return (
    <span className="flex shrink-0 items-center gap-3">
      <span
        className="relative flex h-11 w-11 items-center justify-center rounded-full ring-2"
        style={{ color: u.color }}
      >
        <span
          className="absolute inset-[3px] rounded-full ring-1 ring-current opacity-40"
          aria-hidden="true"
        />
        <span className="font-serif text-[12px] font-bold leading-none">
          {u.mono}
        </span>
      </span>
      <span className="font-serif text-xl font-semibold tracking-tight text-ink">
        {u.name}
      </span>
    </span>
  );
}

function LogoMark({ u }: { u: Logo }) {
  const [failed, setFailed] = useState(false);
  if (!u.file || failed) return <Seal u={u} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/logos/${u.file}`}
      alt={u.name}
      title={u.name}
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-14 w-auto max-w-[170px] shrink-0 object-contain"
    />
  );
}

function LogoRow({ items, dir }: { items: Logo[]; dir: "left" | "right" }) {
  const doubled = [...items, ...items];
  return (
    <div className="marquee-row marquee-mask overflow-hidden">
      <div
        className={`${dir === "left" ? "marquee-track" : "marquee-track-rev"} items-center gap-12 pr-12`}
      >
        {doubled.map((u, i) => (
          <LogoMark key={i} u={u} />
        ))}
      </div>
    </div>
  );
}

export function UniversityLogos() {
  const mid = Math.ceil(LOGOS.length / 2);
  return (
    <div className="space-y-6">
      <LogoRow items={LOGOS.slice(0, mid)} dir="left" />
      <LogoRow items={LOGOS.slice(mid)} dir="right" />
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
