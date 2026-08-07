/**
 * Precomputes the landing map's country outlines into lib/data/map-outlines.ts.
 *
 * Why this exists: OutlineMap used to `import` all five GeoJSON files
 * (public/data/*.json — ~126 kB raw) and project them with Mercator maths inside
 * a `useMemo`. Both costs landed in the browser: a 140 kB client chunk that is
 * pure coordinate data, and a full re-projection of 58 US rings on the main
 * thread every time the visitor pages to another country.
 *
 * None of it is dynamic. The drawing surface is fixed (1000x640, 46px padding)
 * and the geometry is static files in this repo, so the SVG path is the same
 * on every render of every request. Computing it here and committing the result
 * ships ~17 kB of path strings instead, and the runtime does no geometry at all.
 *
 * Run after editing anything in public/data:
 *
 *     npm run map:outlines
 *
 * scripts/test-engine.ts asserts the generated file still matches this script's
 * output, so a stale commit fails the test step rather than silently drawing an
 * old coastline.
 */
import { readFileSync, writeFileSync } from "fs";
import path from "path";

// Must stay in step with OutlineMap's drawing surface.
const VIEW_W = 1000;
const VIEW_H = 640;
const PAD = 46;
const R = 6378137; // Web Mercator earth radius

// Lower-48 only — the insets would leave one flat topo image framing badly.
const US_EXCLUDE = new Set(["Alaska", "Hawaii", "Puerto Rico"]);

/**
 * Points closer together than this (in VIEW units, where the whole surface is
 * 1000 wide) are dropped. The map renders at ~600-900 CSS px, so a third of a
 * unit is well under a third of a pixel — invisible, and it takes Hong Kong's
 * single ring from 14.8 kB of coordinates to a fraction of that.
 */
const MIN_STEP = 0.35;

const SOURCES: { code: string; file: string; exclude?: Set<string> }[] = [
  { code: "US", file: "us-states.json", exclude: US_EXCLUDE },
  { code: "IT", file: "italy.json" },
  { code: "HK", file: "hong-kong.json" },
  { code: "KR", file: "korea.json" },
  { code: "AE", file: "uae.json" },
];

const mercX = (lon: number) => (R * lon * Math.PI) / 180;
const mercY = (lat: number) =>
  R * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));

type LonLat = [number, number];
type Feature = {
  properties?: { name?: string };
  geometry?: { type: string; coordinates: number[][][] | number[][][][] };
};

function outerRings(
  features: Feature[],
  exclude?: Set<string>
): LonLat[][] {
  const rings: LonLat[][] = [];
  for (const f of features) {
    if (exclude && f.properties?.name && exclude.has(f.properties.name)) continue;
    const g = f.geometry;
    if (!g) continue;
    if (g.type === "Polygon") {
      rings.push((g.coordinates as number[][][])[0] as LonLat[]);
    } else if (g.type === "MultiPolygon") {
      for (const poly of g.coordinates as number[][][][]) {
        rings.push(poly[0] as LonLat[]);
      }
    }
  }
  return rings;
}

export type MapOutline = {
  /** SVG path for the country's coastline, in the fixed 1000x640 surface. */
  d: string;
  /** Where the terrain raster sits inside that surface. */
  img: { x: number; y: number; w: number; h: number };
  /**
   * The padded lon/lat box `img` was fitted to: [minLon, minLat, maxLon, maxLat].
   * The runtime needs it to place the handful of university markers — that is
   * the only projection left in the browser.
   */
  bounds: [number, number, number, number];
  /** Live ArcGIS export, used only if the local /terrain PNG is missing. */
  remote: string;
};

export function buildOutline(
  features: Feature[],
  exclude?: Set<string>
): MapOutline {
  const rings = outerRings(features, exclude);

  let minLon = Infinity,
    minLat = Infinity,
    maxLon = -Infinity,
    maxLat = -Infinity;
  for (const ring of rings)
    for (const [lon, lat] of ring) {
      if (lon < minLon) minLon = lon;
      if (lon > maxLon) maxLon = lon;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }
  const padLon = (maxLon - minLon) * 0.03;
  const padLat = (maxLat - minLat) * 0.03;
  minLon -= padLon;
  maxLon += padLon;
  minLat -= padLat;
  maxLat += padLat;

  const minX = mercX(minLon),
    maxX = mercX(maxLon);
  const minY = mercY(minLat),
    maxY = mercY(maxLat);
  const mW = maxX - minX,
    mH = maxY - minY;
  const scale = Math.min((VIEW_W - 2 * PAD) / mW, (VIEW_H - 2 * PAD) / mH);
  const drawW = mW * scale,
    drawH = mH * scale;
  const offX = (VIEW_W - drawW) / 2,
    offY = (VIEW_H - drawH) / 2;

  let d = "";
  for (const ring of rings) {
    let lastX = NaN;
    let lastY = NaN;
    let wrote = 0;
    for (let i = 0; i < ring.length; i++) {
      const x = offX + (mercX(ring[i][0]) - minX) * scale;
      const y = offY + (maxY - mercY(ring[i][1])) * scale;
      const last = i === ring.length - 1;
      // Always keep the first and last point of a ring — dropping either opens
      // a visible notch where the outline closes.
      if (wrote > 0 && !last && Math.hypot(x - lastX, y - lastY) < MIN_STEP) {
        continue;
      }
      d += (wrote === 0 ? "M" : "L") + x.toFixed(1) + "," + y.toFixed(1);
      lastX = x;
      lastY = y;
      wrote++;
    }
    d += "Z";
  }

  const imgPxW = Math.min(2048, Math.round(drawW * 1.8));
  const imgPxH = Math.round((imgPxW * mH) / mW);
  const remote =
    `https://server.arcgisonline.com/arcgis/rest/services/World_Topo_Map/MapServer/export` +
    `?bbox=${minX},${minY},${maxX},${maxY}&bboxSR=3857&imageSR=3857` +
    `&size=${imgPxW},${imgPxH}&format=png&transparent=false&f=image`;

  return {
    d,
    img: {
      x: round2(offX),
      y: round2(offY),
      w: round2(drawW),
      h: round2(drawH),
    },
    bounds: [round6(minLon), round6(minLat), round6(maxLon), round6(maxLat)],
    remote,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// Six decimals is ~0.1 m on the ground — far finer than a marker needs, and it
// keeps the generated literals short.
function round6(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}

/** Builds the generated module's source text, so a test can diff it. */
export function renderModule(): string {
  const root = process.cwd();
  const entries = SOURCES.map(({ code, file, exclude }) => {
    const raw = JSON.parse(
      readFileSync(path.join(root, "public", "data", file), "utf8")
    ) as { features: Feature[] };
    return [code, buildOutline(raw.features, exclude)] as const;
  });

  const body = entries
    .map(
      ([code, o]) =>
        `  ${code}: {\n` +
        `    d: ${JSON.stringify(o.d)},\n` +
        `    img: { x: ${o.img.x}, y: ${o.img.y}, w: ${o.img.w}, h: ${o.img.h} },\n` +
        `    bounds: [${o.bounds.join(", ")}],\n` +
        `    remote:\n      ${JSON.stringify(o.remote)},\n` +
        `  },`
    )
    .join("\n");

  return `// GENERATED FILE — do not edit by hand.
//
// Run \`npm run map:outlines\` to regenerate from public/data/*.json.
// scripts/build-map-outlines.ts explains why the projection happens at build
// time: it keeps ~126 kB of GeoJSON, and a full Mercator re-projection per
// country switch, out of the browser.

export type MapOutline = {
  /** SVG path for the coastline, in OutlineMap's fixed 1000x640 surface. */
  d: string;
  /** Where the terrain raster sits inside that surface. */
  img: { x: number; y: number; w: number; h: number };
  /** The padded [minLon, minLat, maxLon, maxLat] box \`img\` was fitted to. */
  bounds: [number, number, number, number];
  /** Live ArcGIS export — the fallback if the local /terrain PNG is missing. */
  remote: string;
};

export const MAP_OUTLINES: Record<string, MapOutline> = {
${body}
};
`;
}

const OUT = path.join(process.cwd(), "lib", "data", "map-outlines.ts");

if (process.argv[1] && process.argv[1].includes("build-map-outlines")) {
  const source = renderModule();
  writeFileSync(OUT, source, "utf8");
  console.log(
    `map-outlines.ts written — ${(source.length / 1024).toFixed(1)} kB`
  );
}
