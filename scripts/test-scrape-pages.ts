// Verifies the two-hop page discovery WITHOUT calling the model: for each
// competition it prints which linked page was chosen and whether the combined
// text actually contains deadline-like signal. If a target says
// "signal: none", the model has nothing to extract and null is the honest
// answer — that's a data problem (JS-rendered site), not a scraper bug.
//
//   npm run test:scrape                 (a default sample)
//   npm run test:scrape -- mun rsi      (specific competition ids)

import { COMPETITIONS } from "../lib/data/key-dates";
import { cleanHtml, findDatePages } from "../lib/scraper/scrape-dates";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const DEADLINE_WORD = /(deadline|due|closes|registration|apply by|submit by)/i;
const DATE_LIKE =
  /((january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2})|(\d{1,2}\s+(january|february|march|april|may|june|july|august|september|october|november|december))|(\d{4}-\d{2}-\d{2})/i;

async function get(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "text/html,*/*" },
      signal: AbortSignal.timeout(15_000),
      redirect: "follow",
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function signal(text: string): string {
  const d = DEADLINE_WORD.test(text);
  const dt = DATE_LIKE.test(text);
  if (d && dt) return "STRONG (deadline word + date)";
  if (dt) return "weak (date only)";
  if (d) return "weak (deadline word only)";
  return "none";
}

async function main() {
  const ids = process.argv.slice(2);
  const targets = ids.length
    ? COMPETITIONS.filter((c) => ids.includes(c.id))
    : COMPETITIONS.filter((c) =>
        ["mun", "world-scholars-cup", "rsi", "mostec", "ippf", "scholastic", "youngarts", "ssp"].includes(c.id),
      );

  let improved = 0;
  for (const comp of targets) {
    const raw = await get(comp.url);
    if (!raw) {
      console.log(`\n${comp.id}: landing fetch FAILED (${comp.url})`);
      continue;
    }
    const landing = cleanHtml(raw).slice(0, 9_000);
    const subs = findDatePages(raw, comp.url);

    const parts = [landing];
    const chosen: string[] = [];
    for (const s of subs) {
      const sr = await get(s);
      if (!sr) continue;
      const t = cleanHtml(sr).slice(0, 9_000);
      if (t.length > 120) {
        parts.push(t);
        chosen.push(`${s} (${t.length} chars)`);
      }
    }
    const before = signal(landing);
    const after = signal(parts.join("\n"));
    if (before !== after) improved++;

    console.log(`\n${comp.id}  ${comp.url}`);
    console.log(`  landing only : ${before}`);
    console.log(`  with sub-pages: ${after}`);
    for (const c of chosen) console.log(`    → ${c}`);
    if (!chosen.length) console.log(`    (no linked dates page found)`);
  }

  console.log(`\n${improved}/${targets.length} targets improved by following a linked page.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
