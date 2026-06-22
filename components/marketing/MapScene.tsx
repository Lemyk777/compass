"use client";

import dynamic from "next/dynamic";

// The map projects GeoJSON with d3-geo, whose float math differs subtly between
// server and client — render it client-only to avoid hydration mismatches.
const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <div className="h-full w-full" aria-hidden="true" />,
});

export function MapScene({ className }: { className?: string }) {
  return <MapView className={className} />;
}
