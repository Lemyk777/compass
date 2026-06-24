"use client";

import { useEffect, useState } from "react";

/**
 * The second headline line: a brand-colored phrase that rotates through a few
 * full sentences with a vertical "shuffle" — the new phrase drops in from above
 * while the previous one swipes down and fades out (like the variants are being
 * flipped through). Full sentences keep each grammatical in any language.
 *
 * The first phrase is server-rendered and visible without JS; JS cycles the
 * rest. Honors prefers-reduced-motion — then it stays on the first phrase, no
 * rotation (and the global reduced-motion guard makes the entrance instant).
 */
export function RotatingHeadline({
  phrases,
  className = "",
}: {
  phrases: string[];
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  const [rotated, setRotated] = useState(false);

  useEffect(() => {
    if (phrases.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      setRotated(true);
      setIndex((i) => (i + 1) % phrases.length);
    }, 2800);
    return () => clearInterval(id);
  }, [phrases.length]);

  // Rotation is strictly sequential, so the outgoing phrase is always index-1.
  const prevIndex = (index - 1 + phrases.length) % phrases.length;

  return (
    <span className={`relative block ${className}`}>
      {/* incoming / current — in flow, defines the line's height */}
      <span key={`in-${index}`} className="roll-word roll-in inline-block">
        {phrases[index]}
      </span>
      {/* outgoing — absolute overlay so it doesn't shift layout while it leaves */}
      {rotated && prevIndex !== index && (
        <span
          key={`out-${index}`}
          aria-hidden="true"
          className="roll-word roll-out pointer-events-none absolute left-0 top-0 inline-block"
        >
          {phrases[prevIndex]}
        </span>
      )}
    </span>
  );
}
