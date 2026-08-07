import { readdirSync, statSync } from "fs";
import path from "path";

// Auto-discovers university logos from /public/logos so the marquee always
// reflects whatever image files are actually present. Drop a logo in (or delete
// one) and it shows up (or disappears) on the landing page — no code change.

export type UniversityLogo = { name: string; file: string };

/**
 * The marquee's byte budget, and why it has one.
 *
 * /public/logos holds 94 files totalling ~3.8 MB, and the marquee renders the
 * list TWICE (that's how the loop seams). Unfiltered, one landing page pulled
 * 188 image requests and several megabytes for a row of 56px-tall marks — with
 * a handful of single files above 250 kB (one crest is 413 kB of vector path)
 * whose decode work lands on the main thread while the row is already scrolling.
 * That was the visible stutter.
 *
 * So the row is capped two ways: skip any single file over MAX_BYTES, and keep
 * only the MAX_LOGOS lightest of what remains. Neither number is precious — the
 * point is that a wall of logos is not more persuasive than a clean row of them,
 * and a row that stutters is less. Every file stays on disk; the map and the
 * report still reference any of them by name.
 *
 * Selecting by WEIGHT rather than by name matters more than it looks. Taking
 * the first 32 alphabetically ended the row at Lehigh — no MIT, no Yale, no
 * Stanford, no Princeton, all of which are small files that were never the
 * problem. Cheapest-first keeps the recognisable marks and drops the 300 kB
 * crests, then the row is re-sorted alphabetically so its order is stable
 * between deploys.
 */
const MAX_BYTES = 40 * 1024;
const MAX_LOGOS = 32;

const IMG_EXT = new Set([".svg", ".png", ".jpg", ".jpeg", ".webp", ".avif"]);

// Pretty display names (used for alt/title). Anything not listed is
// auto-capitalized from its filename.
const LABELS: Record<string, string> = {
  nyu: "NYU",
  ucla: "UCLA",
  mit: "MIT",
  usc: "USC",
  uchicago: "UChicago",
  upenn: "Penn",
  penn: "Penn",
  washington: "Washington",
  johnshopkins: "Johns Hopkins",
  jhu: "Johns Hopkins",
  cmu: "Carnegie Mellon",
  uva: "UVA",
  unc: "UNC",
  bc: "Boston College",
  bu: "Boston University",
  rpi: "RPI",
  rit: "RIT",
  wpi: "WPI",
  smu: "SMU",
  cmc: "Claremont McKenna",
  washu: "WashU",
  // Italian universities (map + marquee)
  polimi: "Politecnico di Milano",
  polito: "Politecnico di Torino",
  bocconi: "Bocconi",
  bologna: "Università di Bologna",
  padova: "Università di Padova",
  sapienza: "Sapienza",
  normale: "Scuola Normale Superiore",
  firenze: "Università di Firenze",
  federico2: "Federico II",
  // Hong Kong universities (map + marquee)
  hku: "HKU",
  hkust: "HKUST",
  cuhk: "CUHK",
  cityu: "CityU",
  polyu: "PolyU",
  // UAE and Korea — the auto-capitaliser turned these acronyms into words
  // ("Uaeu", "Snu", "Aus"), which is what a visitor reads as the alt text.
  uaeu: "UAE University",
  aus: "American University of Sharjah",
  khalifa: "Khalifa University",
  zayed: "Zayed University",
  "nyu-abu-dhabi": "NYU Abu Dhabi",
  snu: "Seoul National University",
  kaist: "KAIST",
  hanyang: "Hanyang University",
  "korea-university": "Korea University",
};

function labelFor(base: string): string {
  const key = base.toLowerCase();
  if (LABELS[key]) return LABELS[key];
  return base
    .replace(/[-_]+/g, " ")
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

// The directory never changes while the server is up, and the landing page is
// rendered per request — so without this every visit paid for a readdir plus a
// stat per file.
let cached: UniversityLogo[] | null = null;

export function getUniversityLogos(): UniversityLogo[] {
  if (cached) return cached;

  const dir = path.join(process.cwd(), "public", "logos");
  let files: string[] = [];
  try {
    files = readdirSync(dir);
  } catch {
    return [];
  }

  const sized: { file: string; size: number }[] = [];
  for (const file of files) {
    if (!IMG_EXT.has(path.extname(file).toLowerCase())) continue;
    let size: number;
    try {
      size = statSync(path.join(dir, file)).size;
    } catch {
      continue;
    }
    if (size > MAX_BYTES) continue;
    sized.push({ file, size });
  }

  cached = sized
    // Lightest first, name as the tie-break so the choice is deterministic…
    .sort((a, b) => a.size - b.size || a.file.localeCompare(b.file))
    .slice(0, MAX_LOGOS)
    // …then alphabetically, so the row itself doesn't reshuffle when someone
    // re-exports one file a few bytes smaller.
    .sort((a, b) => a.file.localeCompare(b.file))
    .map(({ file }) => ({ name: labelFor(path.parse(file).name), file }));

  return cached;
}
