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
 * Layout-stable & no overlap: an invisible sizer reserves the box, and the
 * animated phrases are layered absolutely on top of it — so they never shift the
 * surrounding text and never collide with the lines around them. Full sentences
 * keep each grammatical in any language.
 *
 * The sizer stacks EVERY phrase in one grid cell rather than picking "the
 * longest" one. It used to pick by `String.length`, which is not width and was
 * only ever right by accident: the three phrases in the hero are 19 characters
 * each and render 382px, 398px and 398px wide. Picking by character count
 * reserved the narrowest, and the other two would have overflowed the box into
 * the paragraph below on any width where they wrapped and it did not. A grid
 * row is as tall as its tallest item, measured by the browser, at every width —
 * so the reserve is correct for free, with no measurement and no heuristic.
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
      { threshold: 0 },
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
      <span ref={box} className="relative grid items-start">
        {/* Invisible sizer — every phrase in ONE grid cell, so the row is as tall
            as the tallest of them AS RENDERED at this width → zero layout shift,
            and no phrase can outgrow its own box. The animated copies below are
            absolutely positioned, so they stay out of this measurement. */}
        {phrases.map((p) => (
          <span
            key={`size-${p}`}
            aria-hidden="true"
            className="invisible col-start-1 row-start-1"
          >
            {p}
          </span>
        ))}
        {/* Incoming / current phrase — glides down into place, crossfading with
            the outgoing one.

            `inset-0 grid content-center`, not `top-0`: the slot is as tall as
            the phrase needing the MOST lines, and at some widths a shorter
            phrase needs fewer. Top-aligning it put that whole difference
            underneath, where it read as a hole between the headline and the
            paragraph. Centred, the same difference is split above and below and
            reads as leading. Two near-identical English sentences still differ
            by ~16px — "win" against "own" is enough — so no copy can remove this
            case, only shrink the band of widths it happens in. The keyframes
            translate by `em`, so a full-height box does not change the glide. */}
        <span
          key={`in-${index}`}
          aria-hidden="true"
          className="roll-word roll-in absolute inset-0 grid content-center"
        >
          {phrases[index]}
        </span>
        {/* Outgoing phrase — slips down and fades out (only during a swap). */}
        {rotated && prevIndex !== index && (
          <span
            key={`out-${index}`}
            aria-hidden="true"
            className="roll-word roll-out pointer-events-none absolute inset-0 grid content-center"
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
