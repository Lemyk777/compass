// Shrink the two Open Graph fonts to the glyphs those cards can draw.
//
// Why: the cards run on the EDGE runtime (lib/og-card.tsx says why — the node
// build of @vercel/og crashes on Windows), and a Vercel Edge Function is capped
// at 1 MB compressed on Hobby. With full Latin Inter the bundle measured
// 1.06 MB gzip against that ceiling, so `next build` passed locally AND in CI —
// neither enforces the limit — and only the deploy failed. Full Inter is ~2,800
// glyphs; these cards need about 400.
//
// Run after replacing either font file, or after widening OG_GLYPHS:
//
//   npm i --no-save subset-font && node --import tsx scripts/subset-og-fonts.mjs
//
// It is .mjs rather than .ts on purpose: subset-font is installed with
// --no-save for the one run and is not a dependency of this project, so a .ts
// file importing it would fail the build type-check on every clean checkout
// for a tool the build never executes.
//
// Safe to re-run: subsetting an already-subset font only re-encodes it. The
// originals come from the Google Fonts CSS API asked with an old user agent,
// which serves TrueType — Satori cannot read woff2.
import { readFileSync, writeFileSync, statSync } from "node:fs";
import subsetFont from "subset-font";
import { OG_GLYPHS } from "../lib/data/og-glyphs";

async function main() {
  const FILES = ["lib/og-fonts/Inter-Regular.ttf", "lib/og-fonts/Inter-Bold.ttf"];

  for (const file of FILES) {
    const before = statSync(file).size;
    const subset = await subsetFont(readFileSync(file), OG_GLYPHS, {
      targetFormat: "truetype",
    });
    writeFileSync(file, subset);
    console.log(
      `${file.split("/").pop().padEnd(20)} ${(before / 1024).toFixed(0).padStart(5)} KB -> ${(subset.length / 1024).toFixed(0).padStart(4)} KB`,
    );
  }
  
}

main();
