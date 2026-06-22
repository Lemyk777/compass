"use client";

import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { OutlineMap } from "./OutlineMap";
import { COUNTRIES } from "@/lib/data/map-markers";

const EASE = [0.22, 1, 0.36, 1] as const;
const FLIGHT_MS = 1300;

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d={dir === "left" ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Minimalist line-art globe shown mid-flight ("we flew up to the planet"). */
function MiniGlobe() {
  return (
    <svg width="132" height="132" viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="44" fill="#F7F8FA" stroke="#0E7B57" strokeWidth="1.6" />
      <g fill="none" stroke="rgba(15,23,42,0.18)" strokeWidth="1">
        <ellipse cx="50" cy="50" rx="44" ry="15" />
        <ellipse cx="50" cy="50" rx="30" ry="44" />
        <ellipse cx="50" cy="50" rx="13" ry="44" />
        <line x1="6" y1="50" x2="94" y2="50" />
      </g>
      <circle cx="62" cy="38" r="3" fill="#0E7B57" />
    </svg>
  );
}

/** Soft clouds that sweep across in the travel direction during a flight. */
function Clouds({ dir }: { dir: number }) {
  const from = dir >= 0 ? -60 : 160;
  const to = dir >= 0 ? 160 : -60;
  const blobs = [
    { top: "8%", size: 260, delay: 0 },
    { top: "44%", size: 360, delay: 0.05 },
    { top: "30%", size: 220, delay: 0.12 },
    { top: "66%", size: 300, delay: 0.02 },
    { top: "20%", size: 180, delay: 0.16 },
  ];
  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      {blobs.map((b, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white blur-2xl"
          style={{ top: b.top, width: b.size, height: b.size }}
          initial={{ left: `${from}%`, opacity: 0 }}
          animate={{ left: [`${from}%`, `${(from + to) / 2}%`, `${to}%`], opacity: [0, 0.95, 0] }}
          transition={{ duration: FLIGHT_MS / 1000, ease: "easeInOut", delay: b.delay, times: [0, 0.5, 1] }}
        />
      ))}
    </div>
  );
}

export default function MapView({ className }: { className?: string }) {
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [flying, setFlying] = useState(false);
  const [flightKey, setFlightKey] = useState(0);
  const flyingRef = useRef(false);

  const len = COUNTRIES.length;
  const country = COUNTRIES[((index % len) + len) % len];

  const go = useCallback((d: number) => {
    if (flyingRef.current) return;
    flyingRef.current = true;
    setFlying(true);
    setDir(d);
    setIndex((i) => i + d);
    setFlightKey((k) => k + 1);
    window.setTimeout(() => {
      flyingRef.current = false;
      setFlying(false);
    }, FLIGHT_MS);
  }, []);

  return (
    <div className={className}>
      <div className="relative h-full w-full">
        {/* Country silhouette — zooms out to space and the next one flies in */}
        <AnimatePresence mode="wait">
          <motion.div
            key={country.code}
            className="absolute inset-0"
            initial={{ scale: 0.28, opacity: 0, y: 30, filter: "blur(6px)" }}
            animate={{ scale: 1, opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ scale: 0.28, opacity: 0, y: -30, filter: "blur(6px)" }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <OutlineMap country={country} />
          </motion.div>
        </AnimatePresence>

        {/* Flight overlay: clouds + a glimpse of the planet */}
        <AnimatePresence>
          {flying && (
            <div key={flightKey} className="pointer-events-none absolute inset-0 z-20">
              <Clouds dir={dir} />
              <motion.div
                className="absolute inset-0 z-30 flex items-center justify-center"
                initial={{ scale: 0.2, opacity: 0 }}
                animate={{ scale: [0.2, 1, 1, 0.4], opacity: [0, 1, 1, 0] }}
                transition={{ duration: FLIGHT_MS / 1000, ease: "easeInOut", times: [0, 0.35, 0.6, 1] }}
              >
                <MiniGlobe />
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Pager controls */}
        <div className="pointer-events-auto absolute bottom-6 left-1/2 z-40 -translate-x-1/2">
          <div className="flex items-center gap-4 rounded-full border border-black/5 bg-white/70 px-3 py-2 shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-md">
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous country"
              className="flex h-9 w-9 items-center justify-center rounded-full text-ink/70 transition-colors hover:bg-[#0E7B57]/10 hover:text-[#0E7B57]"
            >
              <Chevron dir="left" />
            </button>

            <div className="min-w-[148px] text-center">
              <div className="text-sm font-semibold leading-tight text-ink">{country.label}</div>
              <div className="text-[11px] leading-tight text-ink/50">{country.blurb}</div>
            </div>

            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next country"
              className="flex h-9 w-9 items-center justify-center rounded-full text-ink/70 transition-colors hover:bg-[#0E7B57]/10 hover:text-[#0E7B57]"
            >
              <Chevron dir="right" />
            </button>
          </div>

          <div className="mt-3 flex items-center justify-center gap-1.5">
            {COUNTRIES.map((c) => {
              const active = c.code === country.code;
              return (
                <span
                  key={c.code}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    active ? "w-5 bg-[#0E7B57]" : "w-1.5 bg-ink/20"
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
