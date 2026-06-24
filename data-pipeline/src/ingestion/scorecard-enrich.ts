/**
 * College Scorecard enrichment for the US university pool.
 *
 * Pulls OFFICIAL federal data (admission rate, SAT 25th/75th percentiles,
 * enrollment) for each school in lib/data/universities.ts and writes a
 * side-by-side comparison to data-pipeline/scorecard-enrichment.json so the
 * approximate "v1 seed" numbers in universities.ts can be replaced with
 * authoritative ones. This both improves the product directly and gives a
 * trustworthy base-rate anchor for likelihood calibration.
 *
 * Source: https://collegescorecard.ed.gov/data/  (api.data.gov)
 *
 * A free api.data.gov key lifts the rate limit (DEMO_KEY allows only ~30/hour).
 * Put it in data-pipeline/.env as  SCORECARD_API_KEY=...  (get one in 30s at
 * https://api.data.gov/signup ). Without it the script uses DEMO_KEY and you
 * must pass --limit <=25.
 *
 * Run:   npm run enrich:scorecard            # all schools (needs a key)
 *        npm run enrich:scorecard -- --limit 5   # validate with DEMO_KEY
 */

import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';
import { UNIVERSITIES } from '../../../lib/data/universities';

(() => {
  const envPath = path.join(__dirname, '..', '..', '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
})();

const API_KEY = process.env.SCORECARD_API_KEY || process.env.DATA_GOV_API_KEY || 'DEMO_KEY';
const OUT = path.join(__dirname, '..', '..', 'scorecard-enrichment.json');
const args = process.argv.slice(2);
const LIMIT = (() => { const i = args.indexOf('--limit'); return i >= 0 ? parseInt(args[i + 1], 10) : Infinity; })();

const FIELDS = [
  'school.name',
  'latest.admissions.admission_rate.overall',
  'latest.admissions.sat_scores.25th_percentile.critical_reading',
  'latest.admissions.sat_scores.75th_percentile.critical_reading',
  'latest.admissions.sat_scores.25th_percentile.math',
  'latest.admissions.sat_scores.75th_percentile.math',
  'latest.student.size',
].join(',');

function get(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'compass-research/1.0' } }, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => {
        if (res.statusCode === 429) return reject(new Error('rate limited (429) — use a real SCORECARD_API_KEY or --limit'));
        try { resolve(JSON.parse(d)); } catch { reject(new Error(`non-JSON (${res.statusCode}): ${d.slice(0, 120)}`)); }
      });
    }).on('error', reject);
  });
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchSchool(name: string): Promise<any | null> {
  const url = `https://api.data.gov/ed/collegescorecard/v1/schools?api_key=${API_KEY}&school.name=${encodeURIComponent(name)}&fields=${FIELDS}&per_page=5`;
  const j = await get(url);
  if (j.error) throw new Error(JSON.stringify(j.error).slice(0, 160));
  const results: any[] = j.results || [];
  if (results.length === 0) return null;
  // prefer an exact name match, else the first result
  return results.find((r) => (r['school.name'] || '').toLowerCase() === name.toLowerCase()) || results[0];
}

async function main() {
  const todo = UNIVERSITIES.slice(0, LIMIT === Infinity ? undefined : LIMIT);
  console.log(`Scorecard enrichment for ${todo.length}/${UNIVERSITIES.length} schools  (key: ${API_KEY === 'DEMO_KEY' ? 'DEMO_KEY — limited!' : 'set'})\n`);

  const rows: any[] = [];
  let matched = 0, unmatched: string[] = [];

  for (const u of todo) {
    try {
      const r = await fetchSchool(u.name);
      if (!r) { unmatched.push(u.name); rows.push({ id: u.id, name: u.name, matched: false }); continue; }
      const cr25 = r['latest.admissions.sat_scores.25th_percentile.critical_reading'];
      const cr75 = r['latest.admissions.sat_scores.75th_percentile.critical_reading'];
      const m25 = r['latest.admissions.sat_scores.25th_percentile.math'];
      const m75 = r['latest.admissions.sat_scores.75th_percentile.math'];
      const officialRate = r['latest.admissions.admission_rate.overall'];
      const p25 = cr25 != null && m25 != null ? cr25 + m25 : null;
      const p75 = cr75 != null && m75 != null ? cr75 + m75 : null;
      matched++;
      rows.push({
        id: u.id, name: u.name, matched: true, scorecard_name: r['school.name'],
        current: { acceptance_rate: u.acceptance_rate, sat_p25: u.sat_p25, sat_p75: u.sat_p75 },
        official: { acceptance_rate: officialRate != null ? Math.round(officialRate * 1000) / 1000 : null, sat_p25: p25, sat_p75: p75, enrollment: r['latest.student.size'] },
      });
      const rateStr = officialRate != null ? `${(officialRate * 100).toFixed(1)}% (was ${(u.acceptance_rate * 100).toFixed(1)}%)` : 'n/a';
      console.log(`  ✓ ${u.id.padEnd(14)} admit ${rateStr}  SAT ${p25 ?? '?'}–${p75 ?? '?'} (was ${u.sat_p25}–${u.sat_p75})`);
    } catch (e: any) {
      console.error(`  ❌ ${u.id}: ${e.message}`);
      if (/rate limited/.test(e.message)) break;
    }
    await sleep(API_KEY === 'DEMO_KEY' ? 1500 : 250);
  }

  fs.writeFileSync(OUT, JSON.stringify(rows, null, 2));
  console.log(`\nMatched ${matched}/${todo.length}. Unmatched: ${unmatched.join(', ') || 'none'}`);
  console.log(`💾 ${OUT}`);
  console.log(`(Review deltas, then I can patch the numbers into lib/data/universities.ts.)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
