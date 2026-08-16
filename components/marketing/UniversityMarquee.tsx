"use client";

import { useEffect, useRef, useState } from "react";
import type { UniversityLogo } from "@/lib/data/logos";

// A single scrolling line of real university logos. The list is discovered from
// /public/logos on the server (see lib/data/logos.ts) and passed in as `logos`,
// so adding or removing an image file updates this row automatically.

function LogoMark({ u, copy }: { u: UniversityLogo; copy: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/logos/${u.file}`}
      alt={copy === 0 ? u.name : ""}
      // The second copy of the list exists only to make the loop seamless, so
      // it is decoration: no alt text, no title, hidden from assistive tech.
      // Otherwise a screen reader read every university out twice.
      title={copy === 0 ? u.name : undefined}
      aria-hidden={copy === 0 ? undefined : true}
      loading="lazy"
      decoding="async"
      // Reserving the box stops the row from reflowing as marks arrive — a
      // moving strip that re-lays-out mid-animation is where the jitter came from.
      width={170}
      height={56}
      className="h-14 w-auto max-w-[170px] shrink-0 object-contain"
    />
  );
}

export function UniversityLogos({ logos }: { logos: UniversityLogo[] }) {
  if (logos.length === 0) return null;
  return (
    <div className="marquee-row marquee-mask overflow-hidden">
      <div className="marquee-track items-center gap-12 pr-12">
        {logos.map((u) => (
          <LogoMark key={`a-${u.file}`} u={u} copy={0} />
        ))}
        {logos.map((u) => (
          <LogoMark key={`b-${u.file}`} u={u} copy={1} />
        ))}
      </div>
    </div>
  );
}
