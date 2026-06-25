"use client";

import { useEffect, useState } from "react";

/**
 * The second headline line: a deep-navy phrase that smoothly "shuffles" through
 * a few full sentences — the next line glides down into place (soft blur→sharp,
 * fades in) while the previous one slips down and fades out at the same time, a
 * true crossfade so the slot never flashes empty. Mobbin/21st.dev feel.
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

  useEffect(() => {
    if (phrases.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      setRotated(true);
      setIndex((i) => (i + 1) % phrases.length);
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, [phrases.length]);

  // Rotation is strictly sequential, so the outgoing phrase is always index-1.
  const prevIndex = (index - 1 + phrases.length) % phrases.length;

  return (
    <span className={`block ${className}`}>
      <span className="relative inline-block align-top">
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
