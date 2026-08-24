// Link health for every curated opportunity. A dead or TLS-broken link is the
// most visible kind of quality failure — the student clicks "Details" and gets
// a browser error, which makes the whole list look fake.
//
// Needs no API key.  npm run test:links
//
// Exit code 1 only when a link is WRONG — a 4xx that is not a bot wall. A 5xx,
// a timeout or a reset means we could not get an answer, which proves nothing
// about the link and is reported without failing.

import { COMPETITIONS } from "../lib/data/key-dates";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

type Verdict = {
  id: string;
  url: string;
  status: "ok" | "redirected" | "blocked" | "unreachable" | "broken";
  detail: string;
};

// Codes a bot-protection service (Cloudflare & co) returns to a script that a
// human browser sails past. Verified by hand: maa.org and ssp.org both answer
// 403 here and serve a "checking your browser" interstitial in a real browser.
// Treating those as dead links makes this gate cry wolf on every run — and a
// gate that is always red stops being read.
const BOT_WALL = new Set([401, 403, 406, 409, 429]);

/**
 * What one HTTP status means for a link we ship. Exported so the rule can be
 * asserted without the network — a gate whose verdict nothing checks is how
 * this one ended up failing four weeks running on links that were all alive.
 *
 *   blocked      the server answered and refused this caller. Go look.
 *   unreachable  the server said the fault is its own, or never answered.
 *                Proves nothing about our URL.
 *   broken       the server says this address is wrong. The only failing case.
 */
export function classifyStatus(status: number): Verdict["status"] {
  if (BOT_WALL.has(status)) return "blocked";
  if (status >= 500) return "unreachable";
  if (status >= 400) return "broken";
  return "ok";
}

/** Only this verdict may fail the run. */
export const FAILS_THE_GATE: Verdict["status"] = "broken";

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
    // The distinction this file's own comment above has always described, and
    // did not make until now: a 5xx is the far end telling us the fault is its
    // own. Editing our link cannot fix it, so it is not a defect in the
    // catalog. Only a 4xx says the address we ship is wrong.
    const verdict = classifyStatus(res.status);
    if (verdict === "blocked") {
      return { status: verdict, detail: `HTTP ${res.status} — bot protection, verify by hand` };
    }
    if (verdict === "unreachable") {
      return { status: verdict, detail: `HTTP ${res.status} — their server, not our URL` };
    }
    if (verdict === "broken") return { status: verdict, detail: `HTTP ${res.status}` };

    // A redirect to a different host usually means the URL we ship is stale.
    const finalUrl = res.url || url;
    const from = new URL(url).host.replace(/^www\./, "");
    const to = new URL(finalUrl).host.replace(/^www\./, "");
    if (from !== to) return { status: "redirected", detail: `→ ${finalUrl}` };
    return { status: "ok", detail: `HTTP ${res.status}` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // TLS failures, DNS failures, resets and timeouts land here, and from a
    // datacenter IP they mostly mean the host refused THIS caller. Verified by
    // hand 2026-08-24: the three links this run called broken in CI —
    // ijsoweb.org, shanghai.nyu.edu and icaci.org — all answer 200 to a
    // residential request, and icaci.org renders in full in a browser while
    // resetting the connection to curl. Calling that a dead link is a false
    // accusation about somebody else's website.
    return { status: "unreachable", detail: msg.slice(0, 120) };
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
  const retryable =
    (first.status === "broken" || first.status === "unreachable") &&
    looksTransient(first.detail);
  if (!retryable) return first;

  await new Promise((r) => setTimeout(r, 4000));
  const second = await attempt(url);
  if (second.status === "broken" || second.status === "unreachable") {
    return { status: second.status, detail: `${second.detail} (twice, 4s apart)` };
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
  const unreachable = results.filter((r) => r.status === "unreachable");

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
  if (unreachable.length) {
    console.log("\nUNREACHABLE — we could not get an answer. Proves nothing; open them yourself:");
    for (const r of unreachable) console.log(`  ~ ${r.id.padEnd(24)} ${r.url}\n      ${r.detail}`);
  }

  const ok =
    results.length -
    broken.length -
    redirected.length -
    blocked.length -
    unreachable.length;
  console.log(
    `\n${ok}/${results.length} links healthy · ${redirected.length} stale · ${blocked.length} unverifiable · ${unreachable.length} unreachable · ${broken.length} broken`,
  );
  // Only a URL the far end says is WRONG fails the gate: a 4xx that is not a
  // bot wall. Everything else is printed every run so it cannot be forgotten,
  // and fails nothing.
  //
  // The weekly workflow had failed on all four of its runs, every time on links
  // that were alive — GitHub's runners get refused by a dozen of these hosts —
  // and a gate that has never once passed is a red light people learn to
  // scroll past. That is worse than no gate, because it also hides the day
  // something is really wrong.
  if (broken.length) process.exit(1);
}

// Guarded so the rule above can be imported and asserted without firing 172
// requests. Same shape as build-map-outlines.ts next door.
if (process.argv[1] && process.argv[1].includes("test-links")) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
