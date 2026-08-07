import { STUDY_DESTINATIONS } from "@/lib/data/study-destinations";

// Are the guide's official sources still there?
//
// The guide says its rules are "checked against the organiser or the government
// that sets the rule". Until the country profiles carried links, that claim was
// unprovable; now it is checkable, and this is the check. Same job as
// `npm run test:links` does for the catalog, and deliberately a separate script:
// these are twenty-odd government pages, not two thousand competition URLs.
//
// Same convention as the catalog checker, and it exists for the same reason: a
// 403 or 429 from a bot wall is REPORTED but does not fail the run, because a
// real browser gets through and a gate that is always red stops being read.
// Anything that fails twice, four seconds apart, is treated as dead.

type Result = { id: string; label: string; url: string; status: string; dead: boolean };

const TIMEOUT_MS = 15_000;

async function probe(url: string): Promise<{ status: string; dead: boolean }> {
  const attempt = async (): Promise<{ status: string; dead: boolean } | null> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        redirect: "follow",
        signal: controller.signal,
        headers: {
          // Without a browser-shaped UA, several government sites answer 403.
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
          accept: "text/html,application/xhtml+xml",
        },
      });
      // 403/429/412 are bot walls: the server ANSWERED, which is proof the page
      // is there, and a real browser gets through. A timeout proves nothing
      // either way, so it is treated as dead and the link does not ship — the
      // rule that decided which official sources are in the guide at all.
      if (res.status === 403 || res.status === 429 || res.status === 412) {
        return { status: `${res.status} blocked (a browser gets through)`, dead: false };
      }
      if (res.ok) return { status: String(res.status), dead: false };
      // 5xx and timeouts get a second chance; 404 does not.
      if (res.status >= 500) return null;
      return { status: String(res.status), dead: true };
    } catch (err) {
      return null;
    } finally {
      clearTimeout(timer);
    }
  };

  const first = await attempt();
  if (first) return first;
  await new Promise((r) => setTimeout(r, 4000));
  const second = await attempt();
  if (second) return second;
  return { status: "no answer (twice, 4s apart)", dead: true };
}

async function main() {
  const results: Result[] = [];
  for (const d of STUDY_DESTINATIONS) {
    for (const s of d.sources) {
      const { status, dead } = await probe(s.url);
      results.push({ id: d.id, label: s.label, url: s.url, status, dead });
      const mark = dead ? "DEAD" : "ok  ";
      console.log(`${mark} ${d.id.padEnd(16)} ${status.padEnd(34)} ${s.url}`);
    }
  }

  const dead = results.filter((r) => r.dead);
  console.log(`\n${results.length - dead.length}/${results.length} official sources reachable.`);
  if (dead.length) {
    console.log("\nDead:");
    for (const r of dead) console.log(`  ${r.id}: ${r.url} (${r.status})`);
    process.exitCode = 1;
  }
}

main();
