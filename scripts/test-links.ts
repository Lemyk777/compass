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
  status: "ok" | "redirected" | "broken";
  detail: string;
};

async function check(url: string): Promise<{ status: Verdict["status"]; detail: string }> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "text/html,*/*" },
      redirect: "follow",
      signal: AbortSignal.timeout(20_000),
    });
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

  if (broken.length) {
    console.log("BROKEN — student sees a browser error:");
    for (const r of broken) console.log(`  ✗ ${r.id.padEnd(24)} ${r.url}\n      ${r.detail}`);
  }
  if (redirected.length) {
    console.log("\nREDIRECTED — the stored URL is stale, update it:");
    for (const r of redirected) console.log(`  → ${r.id.padEnd(24)} ${r.url}\n      ${r.detail}`);
  }

  const ok = results.length - broken.length - redirected.length;
  console.log(
    `\n${ok}/${results.length} links healthy · ${redirected.length} stale · ${broken.length} broken`,
  );
  if (broken.length) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
