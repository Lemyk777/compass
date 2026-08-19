"use client";

import { useMemo, useState } from "react";
import { MAP_OUTLINES } from "@/lib/data/map-outlines";
import type { CountryView, UniMarker } from "@/lib/data/map-markers";

// Fixed drawing surface; the SVG scales responsively to its container.
// Changing either of these means regenerating the outlines (npm run map:outlines).
const VIEW_W = 1000;
const VIEW_H = 640;
const CHIP = 17;

type ProjPoint = UniMarker & { x: number; y: number };
type Placed = ProjPoint & { cx: number; cy: number; lead: boolean };

/**
 * Projects a lon/lat marker into the surface the outline was generated in.
 * The outline generator already fitted the country to the surface, so the only
 * thing left at runtime is a linear map from the country's own bounding box —
 * which the generator records as `img` — onto the marker's position within it.
 * Web Mercator is applied here for exactly the handful of markers on screen,
 * never for the tens of thousands of coastline points.
 */
const R = 6378137;
const mercX = (lon: number) => (R * lon * Math.PI) / 180;
const mercY = (lat: number) =>
  R * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));

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
    const colX = Math.max(
      CHIP + 8,
      Math.min(VIEW_W - CHIP - 8, cxs + side * 120),
    );
    const spacing = CHIP * 2 + 7;
    const sorted = [...group].sort((a, b) => pts[a].y - pts[b].y);
    const startY = cys - ((sorted.length - 1) * spacing) / 2;
    sorted.forEach((k, idx) => {
      const cy = Math.max(
        CHIP + 8,
        Math.min(VIEW_H - CHIP - 8, startY + idx * spacing),
      );
      out.push({ ...pts[k], cx: colX, cy, lead: true });
    });
  }
  return out;
}

const outlineFor = (code: string) => MAP_OUTLINES[code] ?? MAP_OUTLINES.IT;

// Locally-hosted terrain raster for a country. The bboxes are fixed (derived
// from static geo data), so the ArcGIS export is baked once into /public/terrain
// — served from our own origin, cached, no third-party stall. The generated
// `remote` URL is kept only as a runtime fallback if the local file is missing.
export function topoUrlForCountry(country: CountryView): string {
  const code = (MAP_OUTLINES[country.code] ? country.code : "IT").toLowerCase();
  return `/terrain/${code}.png`;
}

export function OutlineMap({ country }: { country: CountryView }) {
  const [hovered, setHovered] = useState<string | null>(null);
  // Hold the terrain hidden until it is decoded, then fade it in over the
  // silhouette — the shape, border and university chips never wait on it.
  const [loaded, setLoaded] = useState(false);
  // If the local raster is ever missing, fall back to the live ArcGIS export.
  // OutlineMap remounts per country (keyed AnimatePresence), so this resets.
  const [useRemote, setUseRemote] = useState(false);

  const { clip, url, remoteUrl, img, placed } = useMemo(() => {
    const outline = outlineFor(country.code);
    const { img, bounds } = outline;

    // The generator fitted this lon/lat box into `img`; invert that fit to put
    // the markers in the same frame as the coastline it already drew.
    const minX = mercX(bounds[0]);
    const maxX = mercX(bounds[2]);
    const minY = mercY(bounds[1]);
    const maxY = mercY(bounds[3]);
    const sx = img.w / (maxX - minX);
    const sy = img.h / (maxY - minY);

    const pts: ProjPoint[] = country.markers.map((m) => ({
      ...m,
      x: img.x + (mercX(m.lon) - minX) * sx,
      y: img.y + (maxY - mercY(m.lat)) * sy,
    }));

    return {
      clip: outline.d,
      url: topoUrlForCountry(country),
      remoteUrl: outline.remote,
      img,
      placed: decluster(pts),
    };
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
      aria-label={`${country.label}, top universities`}
    >
      <defs>
        <clipPath id={clipId}>
          <path d={clip} />
        </clipPath>
        <filter id="terrain-lift" x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow
            dx="0"
            dy="12"
            stdDeviation="16"
            floodColor="#0f172a"
            floodOpacity="0.22"
          />
        </filter>
        <filter id="chip-lift" x="-60%" y="-60%" width="220%" height="220%">
          <feDropShadow
            dx="0"
            dy="3"
            stdDeviation="4"
            floodColor="#0f172a"
            floodOpacity="0.28"
          />
        </filter>
      </defs>

      <g>
        {/* Shadow silhouette lifts the country off the page. Shown immediately so
            the map is visibly present even before the terrain raster decodes. */}
        <path d={clip} fill="#e8ecf0" filter="url(#terrain-lift)" />

        {/* Real topographic terrain, clipped to the country shape. Only THIS layer
            waits on the raster, fading in over the silhouette below it. */}
        <image
          href={useRemote ? remoteUrl : url}
          x={img.x}
          y={img.y}
          width={img.w}
          height={img.h}
          clipPath={`url(#${clipId})`}
          preserveAspectRatio="none"
          onLoad={() => setLoaded(true)}
          onError={() => {
            // Local file missing → retry once against the live ArcGIS export
            // before giving up and revealing the silhouette on its own.
            if (!useRemote) setUseRemote(true);
            else setLoaded(true);
          }}
          style={{
            opacity: loaded ? 1 : 0,
            transition: "opacity 0.4s ease-out",
          }}
        />

        {/* Coastline / border */}
        <path
          d={clip}
          fill="none"
          stroke="rgba(15,23,42,0.45)"
          strokeWidth={1.3}
          strokeLinejoin="round"
        />

        {/* Leader lines + true-position dots for declustered (fanned-out) markers */}
        {ordered
          .filter((p) => p.lead)
          .map((p) => (
            <g key={`lead-${p.name}`}>
              <line
                x1={p.x}
                y1={p.y}
                x2={p.cx}
                y2={p.cy}
                stroke="rgba(255,255,255,0.9)"
                strokeWidth={2.4}
              />
              <line
                x1={p.x}
                y1={p.y}
                x2={p.cx}
                y2={p.cy}
                stroke="rgb(var(--ivy))"
                strokeWidth={1.1}
              />
              <circle
                cx={p.x}
                cy={p.y}
                r={3}
                fill="#0E7B57"
                stroke="#fff"
                strokeWidth={1.4}
              />
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
          if (p.cx + labelX + labelW > VIEW_W - 6)
            labelX = VIEW_W - 6 - labelW - p.cx;

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
                <circle
                  r={r}
                  fill="#ffffff"
                  stroke="rgb(var(--ivy))"
                  strokeWidth={isHovered ? 2 : 1.4}
                />
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
                    fontSize={
                      r - 4 - Math.max(0, (p.mono?.length ?? 1) - 2) * 2.4
                    }
                    fontWeight={700}
                    fill="#0E7B57"
                    style={{
                      fontFamily: "var(--font-sans, system-ui), sans-serif",
                    }}
                  >
                    {p.mono ?? p.name.charAt(0)}
                  </text>
                )}
              </g>

              {isHovered && (
                <g transform={`translate(${labelX}, ${labelY})`}>
                  <rect
                    width={labelW}
                    height={26}
                    rx={5}
                    fill="#0f172a"
                    filter="url(#chip-lift)"
                  />
                  <text
                    x={11}
                    y={17}
                    fontSize={13}
                    fontWeight={600}
                    fill="#ffffff"
                    style={{
                      fontFamily: "var(--font-sans, system-ui), sans-serif",
                    }}
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
