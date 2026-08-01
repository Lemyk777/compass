// Link health for every curated opportunity. A dead or TLS-broken link is the
// most visible kind of quality failure — the student clicks "Details" and gets
// a browser error, which makes the whole list look fake.
//
// Needs no API key.  npm run test:links
//
// Exit code 1 when anything is broken, so this can gate a release.

import { COMPETITIONS } from "../lib/data/key-dates";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

type Verdict = {
  id: string;
  url: string;
  status: "ok" | "redirected" | "blocked" | "broken";
  detail: string;
};

// Codes a bot-protection service (Cloudflare & co) returns to a script that a
// human browser sails past. Verified by hand: maa.org and ssp.org both answer
// 403 here and serve a "checking your browser" interstitial in a real browser.
// Treating those as dead links makes this gate cry wolf on every run — and a
// gate that is always red stops being read.
const BOT_WALL = new Set([401, 403, 406, 409, 429]);

/**
 * A single attempt. Only 4xx (other than the bot wall) proves the URL itself is
 * wrong; 5xx, timeouts and network errors mean the far end is having a bad
 * minute, which is not the same thing and not something we can fix by editing a
 * link. See `check` for how those are retried.
 */
async function attempt(url: string): Promise<{ status: Verdict["status"]; detail: string }> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "text/html,*/*" },
      redirect: "follow",
      signal: AbortSignal.timeout(20_000),
    });
    if (BOT_WALL.has(res.status)) {
      return { status: "blocked", detail: `HTTP ${res.status} — bot protection, verify by hand` };
    }
    if (!res.ok) return { status: "broken", detail: `HTTP ${res.status}` };

    // A redirect to a different host usually means the URL we ship is stale.
    const finalUrl = res.url || url;
    const from = new URL(url).host.replace(/^www\./, "");
    const to = new URL(finalUrl).host.replace(/^www\./, "");
    if (from !== to) return { status: "redirected", detail: `→ ${finalUrl}` };
    return { status: "ok", detail: `HTTP ${res.status}` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // TLS failures, DNS failures and timeouts all land here — exactly what the
    // student sees as "this site can't provide a secure connection".
    return { status: "broken", detail: msg.slice(0, 120) };
  }
}

/** A failure that a second attempt a few seconds later might not reproduce. */
function looksTransient(detail: string): boolean {
  const code = Number(detail.match(/^HTTP (\d{3})/)?.[1]);
  if (code >= 500) return true; // their server is down right now, not our URL
  return /timeout|aborted|fetch failed|ECONNRESET|ENOTFOUND|EAI_AGAIN|socket/i.test(detail);
}

/**
 * Check a link, retrying once on a transient-looking failure.
 *
 * Without this the gate goes red for reasons entirely outside the project: two
 * healthy entries failed a run because one site answered 503 and another 522
 * for a few minutes, having both passed an hour earlier. A link that is really
 * dead fails both attempts and still fails the run.
 */
async function check(url: string): Promise<{ status: Verdict["status"]; detail: string }> {
  const first = await attempt(url);
  if (first.status !== "broken" || !looksTransient(first.detail)) return first;

  await new Promise((r) => setTimeout(r, 4000));
  const second = await attempt(url);
  if (second.status === "broken") {
    return { status: "broken", detail: `${second.detail} (twice, 4s apart)` };
  }
  return second;
}

async function main() {
  const results: Verdict[] = [];
  // Small concurrency so we don't hammer anything or trip rate limits.
  const queue = [...COMPETITIONS];
  const workers = Array.from({ length: 6 }, async () => {
    for (;;) {
      const comp = queue.shift();
      if (!comp) return;
      const r = await check(comp.url);
      results.push({ id: comp.id, url: comp.url, ...r });
    }
  });
  await Promise.all(workers);

  results.sort((a, b) => a.id.localeCompare(b.id));
  const broken = results.filter((r) => r.status === "broken");
  const redirected = results.filter((r) => r.status === "redirected");
  const blocked = results.filter((r) => r.status === "blocked");

  if (broken.length) {
    console.log("BROKEN — student sees a browser error:");
    for (const r of broken) console.log(`  ✗ ${r.id.padEnd(24)} ${r.url}\n      ${r.detail}`);
  }
  if (redirected.length) {
    console.log("\nREDIRECTED — the stored URL is stale, update it:");
    for (const r of redirected) console.log(`  → ${r.id.padEnd(24)} ${r.url}\n      ${r.detail}`);
  }
  if (blocked.length) {
    console.log("\nBLOCKED — we can't check these from a script, open them yourself:");
    for (const r of blocked) console.log(`  ? ${r.id.padEnd(24)} ${r.url}\n      ${r.detail}`);
  }

  const ok = results.length - broken.length - redirected.length - blocked.length;
  console.log(
    `\n${ok}/${results.length} links healthy · ${redirected.length} stale · ${blocked.length} unverifiable · ${broken.length} broken`,
  );
  // Only a genuinely dead link fails the gate. A bot wall is a "go look",
  // not a defect — but it is printed every run so it can't be forgotten.
  if (broken.length) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
