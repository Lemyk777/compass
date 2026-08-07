"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

// The map projects markers with Mercator maths whose float results differ subtly
// between server and client — render it client-only to avoid hydration mismatches.
const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <div className="h-full w-full" aria-hidden="true" />,
});

/**
 * Mounts the map only once it is actually near the viewport.
 *
 * The map is the most expensive thing on the landing page — its own JS chunk,
 * a terrain raster, and the university logo files behind the chips. It now sits
 * below the fold, so downloading any of that during the first paint buys the
 * visitor nothing. The IntersectionObserver fires 300px early, which on a normal
 * scroll is far enough ahead that the map is drawn by the time it is on screen.
 *
 * The placeholder reserves the map's exact box (aspect ratio + pager height), so
 * arriving content never shifts the page.
 */
export function MapScene({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // No IntersectionObserver (very old browsers) → just show it.
    if (typeof IntersectionObserver === "undefined") {
      setNear(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "300px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      {near ? (
        <MapView />
      ) : (
        <div aria-hidden="true">
          <div className="aspect-[1000/640] w-full rounded-2xl bg-ink/[0.03]" />
          <div className="mt-5 h-[74px]" />
        </div>
      )}
    </div>
  );
}
