"use client";

import { useEffect, useRef, useState } from "react";

// Playful "showroom" of real university mascots — adds personality to the
// landing page. Photos live in /public/mascots. Cards reveal on scroll
// (staggered) and lift + tilt on hover.
type Mascot = {
  file: string;
  school: string;
  name: string; // mascot / team nickname (proper noun — not translated)
  color: string; // school accent, used for the glow + ring
};

const MASCOTS: Mascot[] = [
  { file: "yale.jpeg", school: "Yale", name: "Handsome Dan", color: "#00356B" },
  { file: "mit.jpeg", school: "MIT", name: "Tim the Beaver", color: "#A31F34" },
  { file: "princeton.jpg", school: "Princeton", name: "The Tiger", color: "#E77500" },
  { file: "stanford.jpg", school: "Stanford", name: "The Tree", color: "#8C1515" },
  { file: "harvard.jpeg", school: "Harvard", name: "The Crimson", color: "#A51C30" },
];

export function MascotGallery() {
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
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5"
    >
      {MASCOTS.map((m, i) => (
        <figure
          key={m.school}
          style={{
            transitionDelay: `${i * 80}ms`,
            // expose the school color to the hover glow
            ["--mascot" as string]: m.color,
          }}
          className={`group relative aspect-[3/4] overflow-hidden rounded-2xl border border-line bg-card shadow-card transition-all duration-500 ease-out will-change-transform hover:-translate-y-1.5 hover:shadow-lift ${
            i === MASCOTS.length - 1 ? "max-sm:col-span-2" : ""
          } ${shown ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}
        >
          {/* glow ring on hover, tinted with the school color */}
          <span
            className="pointer-events-none absolute inset-0 z-20 rounded-2xl opacity-0 ring-2 ring-inset transition-opacity duration-300 group-hover:opacity-100"
            style={{ color: m.color }}
            aria-hidden="true"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/mascots/${m.file}`}
            alt={`${m.school} mascot — ${m.name}`}
            loading="lazy"
            className="h-full w-full scale-105 object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          />
          {/* gradient scrim + caption */}
          <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-3 pt-10">
            <figcaption>
              <span className="block font-display text-base font-semibold leading-tight text-white">
                {m.school}
              </span>
              <span
                className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-white/85"
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: m.color }}
                  aria-hidden="true"
                />
                {m.name}
              </span>
            </figcaption>
          </div>
        </figure>
      ))}
    </div>
  );
}
