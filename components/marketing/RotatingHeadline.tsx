"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The second headline line: a deep-navy phrase that smoothly "shuffles" through
 * a few full sentences — the next line glides down into place and fades in while
 * the previous one slips down and fades out at the same time, a true crossfade
 * so the slot never flashes empty.
 *
 * Transform and opacity only. The glide used to blur from 5px to sharp, which
 * forced the browser to re-rasterise a 60px headline on a loop for as long as
 * the page was open — see the note on .roll-word in globals.css.
 *
 * Layout-stable & no overlap: an invisible sizer reserves the LONGEST phrase's
 * box, and the animated phrases are layered absolutely on top of it — so they
 * never shift the surrounding text and never collide with the lines around them.
 * Full sentences keep each grammatical in any language.
 *
 * SSR shows the first phrase (visible without JS); a stable copy is exposed to
 * screen readers (the motion is decorative). Honors prefers-reduced-motion: it
 * holds the first phrase, and the global CSS guard makes any swap instant.
 */
const ROTATE_MS = 2600;

export function RotatingHeadline({
  phrases,
  className = "",
}: {
  phrases: string[];
  className?: string;
}) {
  const first = phrases[0] ?? "";
  const [index, setIndex] = useState(0);
  const [rotated, setRotated] = useState(false);
  const longest = phrases.reduce((a, b) => (b.length > a.length ? b : a), "");
  const box = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (phrases.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let id = 0;
    const start = () => {
      if (id) return;
      id = window.setInterval(() => {
        setRotated(true);
        setIndex((i) => (i + 1) % phrases.length);
      }, ROTATE_MS);
    };
    const stop = () => {
      if (!id) return;
      window.clearInterval(id);
      id = 0;
    };

    // Only run while the headline is actually on screen. The landing page is
    // ~7000px tall, so a visitor spends most of their time far below this — and
    // an interval that re-renders the <h1> every 2.6 seconds forever is work
    // nobody can see. Without IntersectionObserver, just run it.
    const el = box.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      start();
      return stop;
    }
    const io = new IntersectionObserver(
      (entries) => (entries.some((e) => e.isIntersecting) ? start() : stop()),
      { threshold: 0 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      stop();
    };
  }, [phrases.length]);

  // Rotation is strictly sequential, so the outgoing phrase is always index-1.
  const prevIndex = (index - 1 + phrases.length) % phrases.length;

  return (
    <span className={`block ${className}`}>
      <span ref={box} className="relative inline-block align-top">
        {/* Invisible sizer — reserves the longest phrase's box → zero layout shift. */}
        <span aria-hidden="true" className="invisible">
          {longest}
        </span>
        {/* Incoming / current phrase — glides down into place, crossfading with
            the outgoing one (both blurred + semi-transparent as they cross). */}
        <span
          key={`in-${index}`}
          aria-hidden="true"
          className="roll-word roll-in absolute inset-x-0 top-0"
        >
          {phrases[index]}
        </span>
        {/* Outgoing phrase — slips down and fades out (only during a swap). */}
        {rotated && prevIndex !== index && (
          <span
            key={`out-${index}`}
            aria-hidden="true"
            className="roll-word roll-out pointer-events-none absolute inset-x-0 top-0"
          >
            {phrases[prevIndex]}
          </span>
        )}
        {/* Stable text for screen readers (the animation is decorative). */}
        <span className="sr-only">{first}</span>
      </span>
    </span>
  );
}
