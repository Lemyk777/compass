// Diagnostic — measures the DETERMINISTIC CEILING on confirmed dates, without
// calling the model. For every competition it does exactly what the production
// scraper does (fetch landing → findDatePages → fetch sub-pages → cleanHtml)
// and asks one question: does the combined text contain a STRONG deadline
// signal (a deadline word next to a real date)? If it doesn't, the model has
// nothing to extract and null is the honest answer — so that entry can NEVER
// be auto-confirmed by this pipeline, no matter how often the cron runs.
//
// This is the number step (3) of OPPORTUNITIES_PLAN.md turns on: the cap on how
// many of the 100 entries the "remove the work / calendar file" bet can ever
// cover through scraping alone.
//
//   npm run diag:dates            (whole catalog, concurrency 6)
//   npm run diag:dates -- 10 rsi  (concurrency 10, only these ids)

import { COMPETITIONS, type Competition } from "../lib/data/key-dates";
import { cleanHtml, findDatePages } from "../lib/scraper/scrape-dates";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const DEADLINE_WORD = /(deadline|due|closes?|registration|register by|apply by|submit by|entries close)/i;
const DATE_LIKE =
  /((january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2})|(\d{1,2}\s+(january|february|march|april|may|june|july|august|september|october|november|december))|(\d{4}-\d{2}-\d{2})/i;

type Signal = "STRONG" | "weak-date" | "weak-word" | "none";
type Row = {
  id: string;
  confirmed: boolean;
  landingFailed: boolean;
  pagesRead: number;
  signal: Signal;
};

async function get(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "text/html,*/*" },
      signal: AbortSignal.timeout(15_000),
      redirect: "follow",
    });
    if (!res.ok) return null;
    const type = res.headers.get("content-type") ?? "";
    if (type && !/html|text/i.test(type)) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function signalOf(text: string): Signal {
  const w = DEADLINE_WORD.test(text);
  const d = DATE_LIKE.test(text);
  if (w && d) return "STRONG";
  if (d) return "weak-date";
  if (w) return "weak-word";
  return "none";
}

async function probe(comp: Competition): Promise<Row> {
  const base = {
    id: comp.id,
    confirmed: comp.dateConfirmed === true,
  };
  const raw = await get(comp.url);
  if (!raw) {
    return { ...base, landingFailed: true, pagesRead: 0, signal: "none" };
  }
  const parts = [cleanHtml(raw).slice(0, 9_000)];
  let pagesRead = 1;
  for (const sub of findDatePages(raw, comp.url)) {
    const sr = await get(sub);
    if (!sr) continue;
    const t = cleanHtml(sr).slice(0, 9_000);
    if (t.length > 120) {
      parts.push(t);
      pagesRead++;
    }
  }
  return {
    ...base,
    landingFailed: false,
    pagesRead,
    signal: signalOf(parts.join("\n")),
  };
}

/** Run `tasks` with a bounded number in flight at once. */
async function pool<T, R>(items: T[], size: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, worker));
  return out;
}

async function main() {
  const args = process.argv.slice(2);
  const concurrency = args.length && /^\d+$/.test(args[0]) ? Number(args.shift()) : 6;
  const targets = args.length
    ? COMPETITIONS.filter((c) => args.includes(c.id))
    : COMPETITIONS;

  console.log(`Probing ${targets.length} entries, concurrency ${concurrency}…\n`);
  const rows = await pool(targets, concurrency, probe);

  const by = (s: Signal) => rows.filter((r) => r.signal === s && !r.landingFailed);
  const failed = rows.filter((r) => r.landingFailed);
  const strong = by("STRONG");

  // The addressable pool: reaches a STRONG page but is NOT yet dateConfirmed —
  // exactly what the cron should be able to confirm and currently is not.
  const addressable = strong.filter((r) => !r.confirmed);
  // Structurally unconfirmable: no strong signal anywhere the scraper can read.
  const stuck = rows.filter((r) => r.signal !== "STRONG");

  const pct = (n: number) => `${n} (${Math.round((n / targets.length) * 100)}%)`;

  console.log("── Signal distribution (production scraper, model excluded) ──");
  console.log(`  STRONG (word + date) : ${pct(strong.length)}   ← ceiling on auto-confirmable`);
  console.log(`  weak (date only)     : ${pct(by("weak-date").length)}`);
  console.log(`  weak (word only)     : ${pct(by("weak-word").length)}`);
  console.log(`  none                 : ${pct(by("none").length)}   ← JS-rendered / bot-walled`);
  console.log(`  landing fetch FAILED : ${pct(failed.length)}`);
  console.log("");
  console.log("── What this means for step (3) ──");
  console.log(`  Already dateConfirmed in catalog : ${rows.filter((r) => r.confirmed).length}`);
  console.log(`  Reachable + STRONG but unconfirmed: ${addressable.length}   ← cron SHOULD confirm these`);
  console.log(`  Structurally stuck (no STRONG)    : ${stuck.length}   ← need curation or headless render`);
  console.log("");
  console.log("Addressable (fix the cron/key → these should flip to confirmed):");
  console.log("  " + (addressable.map((r) => r.id).join(", ") || "(none)"));
  console.log("");
  console.log("Landing fetch failed (dead/blocked from here):");
  console.log("  " + (failed.map((r) => r.id).join(", ") || "(none)"));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
