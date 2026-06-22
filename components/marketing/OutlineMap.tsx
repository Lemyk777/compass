"use client";

import { useMemo, useState } from "react";
import statesGeo from "@/public/data/us-states.json";
import italyGeo from "@/public/data/italy.json";
import hkGeo from "@/public/data/hong-kong.json";
import type { CountryView, UniMarker } from "@/lib/data/map-markers";

// Boundary source per country (clip mask + bbox for the topo image).
const SHAPE: Record<string, { features: { properties?: { name?: string }; geometry: { type: string; coordinates: unknown } }[] }> = {
  US: statesGeo as never,
  IT: italyGeo as never,
  HK: hkGeo as never,
};

// Fixed drawing surface; the SVG scales responsively to its container.
const VIEW_W = 1000;
const VIEW_H = 640;
const PAD = 46;
const CHIP = 17;
const R = 6378137; // Web Mercator earth radius

// Lower-48 only — drop the insets so one flat topo image frames cleanly.
const US_EXCLUDE = new Set(["Alaska", "Hawaii", "Puerto Rico"]);

type LonLat = [number, number];
type ProjPoint = UniMarker & { x: number; y: number };
type Placed = ProjPoint & { cx: number; cy: number; lead: boolean };

const mercX = (lon: number) => (R * lon * Math.PI) / 180;
const mercY = (lat: number) => R * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));

// eslint-disable is intentionally NOT used here — the project's eslint config
// (next/core-web-vitals) doesn't load no-explicit-any, so a disable directive
// would itself break `next build`. Plain `any` is allowed.
function outerRings(geo: { features: any[] }, exclude?: Set<string>): LonLat[][] {
  const rings: LonLat[][] = [];
  for (const f of geo.features) {
    if (exclude && exclude.has(f.properties?.name)) continue;
    const g = f.geometry;
    if (!g) continue;
    if (g.type === "Polygon") rings.push(g.coordinates[0]);
    else if (g.type === "MultiPolygon") for (const poly of g.coordinates) rings.push(poly[0]);
  }
  return rings;
}

function decluster(pts: ProjPoint[]): Placed[] {
  const T = 42; // px in VIEW space below which markers are considered overlapping
  const used = new Array(pts.length).fill(false);
  const out: Placed[] = [];
  for (let i = 0; i < pts.length; i++) {
    if (used[i]) continue;
    const group = [i];
    used[i] = true;
    for (let j = i + 1; j < pts.length; j++) {
      if (used[j]) continue;
      if (Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y) < T) {
        group.push(j);
        used[j] = true;
      }
    }
    if (group.length === 1) {
      const p = pts[i];
      out.push({ ...p, cx: p.x, cy: p.y, lead: false });
      continue;
    }
    // Fan the cluster into a vertical column offset toward the map interior,
    // with a leader line from each true dot to its chip.
    const cxs = group.reduce((s, k) => s + pts[k].x, 0) / group.length;
    const cys = group.reduce((s, k) => s + pts[k].y, 0) / group.length;
    const side = cxs > VIEW_W * 0.5 ? -1 : 1;
    const colX = Math.max(CHIP + 8, Math.min(VIEW_W - CHIP - 8, cxs + side * 120));
    const spacing = CHIP * 2 + 7;
    const sorted = [...group].sort((a, b) => pts[a].y - pts[b].y);
    const startY = cys - ((sorted.length - 1) * spacing) / 2;
    sorted.forEach((k, idx) => {
      const cy = Math.max(CHIP + 8, Math.min(VIEW_H - CHIP - 8, startY + idx * spacing));
      out.push({ ...pts[k], cx: colX, cy, lead: true });
    });
  }
  return out;
}

export function OutlineMap({ country }: { country: CountryView }) {
  const [hovered, setHovered] = useState<string | null>(null);
  // Hold the whole map hidden until the terrain raster is decoded, then reveal
  // everything (silhouette + relief + markers) together — no staged pop-in.
  const [loaded, setLoaded] = useState(false);

  const { clip, url, img, placed } = useMemo(() => {
    const geo = (SHAPE[country.code] ?? italyGeo) as unknown as { features: any[] };
    const rings = outerRings(geo, country.code === "US" ? US_EXCLUDE : undefined);

    let minLon = Infinity, minLat = Infinity, maxLon = -Infinity, maxLat = -Infinity;
    for (const ring of rings)
      for (const [lon, lat] of ring) {
        if (lon < minLon) minLon = lon;
        if (lon > maxLon) maxLon = lon;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      }
    const padLon = (maxLon - minLon) * 0.03;
    const padLat = (maxLat - minLat) * 0.03;
    minLon -= padLon; maxLon += padLon; minLat -= padLat; maxLat += padLat;

    const minX = mercX(minLon), maxX = mercX(maxLon);
    const minY = mercY(minLat), maxY = mercY(maxLat);
    const mW = maxX - minX, mH = maxY - minY;
    const scale = Math.min((VIEW_W - 2 * PAD) / mW, (VIEW_H - 2 * PAD) / mH);
    const drawW = mW * scale, drawH = mH * scale;
    const offX = (VIEW_W - drawW) / 2, offY = (VIEW_H - drawH) / 2;
    const project = (lon: number, lat: number): [number, number] => [
      offX + (mercX(lon) - minX) * scale,
      offY + (maxY - mercY(lat)) * scale,
    ];

    let clip = "";
    for (const ring of rings) {
      ring.forEach((pt, i) => {
        const [x, y] = project(pt[0], pt[1]);
        clip += (i === 0 ? "M" : "L") + x.toFixed(1) + "," + y.toFixed(1);
      });
      clip += "Z";
    }

    const imgPxW = Math.min(2048, Math.round(drawW * 1.8));
    const imgPxH = Math.round((imgPxW * mH) / mW);
    const url =
      `https://server.arcgisonline.com/arcgis/rest/services/World_Topo_Map/MapServer/export` +
      `?bbox=${minX},${minY},${maxX},${maxY}&bboxSR=3857&imageSR=3857` +
      `&size=${imgPxW},${imgPxH}&format=png&transparent=false&f=image`;

    const pts: ProjPoint[] = country.markers.map((m) => {
      const [x, y] = project(m.lon, m.lat);
      return { ...m, x, y };
    });

    return { clip, url, img: { x: offX, y: offY, w: drawW, h: drawH }, placed: decluster(pts) };
  }, [country]);

  // Render the hovered chip last so it sits above its neighbours.
  const ordered = useMemo(() => {
    if (!hovered) return placed;
    const rest = placed.filter((p) => p.name !== hovered);
    const top = placed.find((p) => p.name === hovered);
    return top ? [...rest, top] : placed;
  }, [placed, hovered]);

  const clipId = `clip-${country.code}`;

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="xMidYMid meet"
      className="h-full w-full"
      role="img"
      aria-label={`${country.label} — top universities`}
    >
      <defs>
        <clipPath id={clipId}>
          <path d={clip} />
        </clipPath>
        <filter id="terrain-lift" x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="12" stdDeviation="16" floodColor="#0f172a" floodOpacity="0.22" />
        </filter>
        <filter id="chip-lift" x="-60%" y="-60%" width="220%" height="220%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#0f172a" floodOpacity="0.28" />
        </filter>
      </defs>

      <g style={{ opacity: loaded ? 1 : 0, transition: "opacity 0.5s ease-out" }}>
        {/* Shadow silhouette lifts the country off the page */}
        <path d={clip} fill="#e8ecf0" filter="url(#terrain-lift)" />

        {/* Real topographic terrain, clipped to the country shape */}
        <image
          href={url}
          x={img.x}
          y={img.y}
          width={img.w}
          height={img.h}
          clipPath={`url(#${clipId})`}
          preserveAspectRatio="none"
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
        />

      {/* Coastline / border */}
      <path d={clip} fill="none" stroke="rgba(15,23,42,0.45)" strokeWidth={1.3} strokeLinejoin="round" />

      {/* Leader lines + true-position dots for declustered (fanned-out) markers */}
      {ordered
        .filter((p) => p.lead)
        .map((p) => (
          <g key={`lead-${p.name}`}>
            <line x1={p.x} y1={p.y} x2={p.cx} y2={p.cy} stroke="rgba(255,255,255,0.9)" strokeWidth={2.4} />
            <line x1={p.x} y1={p.y} x2={p.cx} y2={p.cy} stroke="#0E7B57" strokeWidth={1.1} />
            <circle cx={p.x} cy={p.y} r={3} fill="#0E7B57" stroke="#fff" strokeWidth={1.4} />
          </g>
        ))}

      {/* University chips */}
      {ordered.map((p) => {
        const isHovered = hovered === p.name;
        const r = isHovered ? CHIP + 2 : CHIP;
        const chipClip = `chip-${country.code}-${p.name.replace(/[^a-z0-9]/gi, "")}`;
        const labelW = p.name.length * 7.1 + 22;
        const below = p.cy < VIEW_H - 92;
        const labelY = below ? r + 9 : -(r + 9) - 26;
        let labelX = -labelW / 2;
        if (p.cx + labelX < 6) labelX = 6 - p.cx;
        if (p.cx + labelX + labelW > VIEW_W - 6) labelX = VIEW_W - 6 - labelW - p.cx;

        return (
          <g
            key={p.name}
            transform={`translate(${p.cx}, ${p.cy})`}
            onMouseEnter={() => setHovered(p.name)}
            onMouseLeave={() => setHovered((h) => (h === p.name ? null : h))}
            className="cursor-pointer"
            style={{ pointerEvents: "all" }}
          >
            {isHovered && <circle r={r + 7} fill="#0E7B57" opacity={0.18} />}

            <g filter="url(#chip-lift)">
              <circle r={r} fill="#ffffff" stroke="#0E7B57" strokeWidth={isHovered ? 2 : 1.4} />
              {p.logo ? (
                <>
                  <clipPath id={chipClip}>
                    <circle r={r - 3} />
                  </clipPath>
                  <image
                    href={p.logo}
                    x={-(r - 3)}
                    y={-(r - 3)}
                    width={(r - 3) * 2}
                    height={(r - 3) * 2}
                    clipPath={`url(#${chipClip})`}
                    preserveAspectRatio="xMidYMid meet"
                  />
                </>
              ) : (
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={r - 4 - Math.max(0, (p.mono?.length ?? 1) - 2) * 2.4}
                  fontWeight={700}
                  fill="#0E7B57"
                  style={{ fontFamily: "var(--font-sans, system-ui), sans-serif" }}
                >
                  {p.mono ?? p.name.charAt(0)}
                </text>
              )}
            </g>

            {isHovered && (
              <g transform={`translate(${labelX}, ${labelY})`}>
                <rect width={labelW} height={26} rx={5} fill="#0f172a" filter="url(#chip-lift)" />
                <text
                  x={11}
                  y={17}
                  fontSize={13}
                  fontWeight={600}
                  fill="#ffffff"
                  style={{ fontFamily: "var(--font-sans, system-ui), sans-serif" }}
                >
                  {p.name}
                </text>
              </g>
            )}
          </g>
        );
      })}
      </g>
    </svg>
  );
}
