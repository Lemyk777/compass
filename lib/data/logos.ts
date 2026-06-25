import { readdirSync } from "fs";
import path from "path";

// Auto-discovers university logos from /public/logos so the marquee always
// reflects whatever image files are actually present. Drop a logo in (or delete
// one) and it shows up (or disappears) on the landing page — no code change.

export type UniversityLogo = { name: string; file: string };

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

export function getUniversityLogos(): UniversityLogo[] {
  let files: string[] = [];
  try {
    files = readdirSync(path.join(process.cwd(), "public", "logos"));
  } catch {
    return [];
  }

  return files
    .filter((f) => IMG_EXT.has(path.extname(f).toLowerCase()))
    .sort((a, b) => a.localeCompare(b))
    .map((file) => ({ name: labelFor(path.parse(file).name), file }));
}
