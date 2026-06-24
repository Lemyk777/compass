/**
 * LLM cleaning pass for the REAL scraped dataset.
 *
 * Turns the noisy regex-extracted `dataset_real.json` into clean, structured
 * records suitable for (a) re-running through the Compass analysis engine and
 * (b) calibrating per-school admission likelihoods against real outcomes.
 *
 * Design (mirrors the Python parser tier, reimplemented in TS — see CLAUDE.md):
 *  - claude-haiku-4-5 extracts a structured profile + admission DECISIONS,
 *    each decision carrying an exact verbatim QUOTE from the post.
 *  - Every quote is verified to be a real substring of the source text
 *    (anti-hallucination). Unverified decisions are dropped.
 *  - School names are normalized to the canonical IDs in lib/data/universities
 *    so outcomes join directly onto the product's dataset.
 *
 * Output:  data-pipeline/dataset_clean.json   (verified, normalized records)
 *          data-pipeline/triage_clean.json     (posts with no usable outcome)
 *
 * Run:   (put ANTHROPIC_API_KEY in data-pipeline/.env first)
 *          npm run clean:real            # full run, resumable
 *          npm run clean:real -- --limit 20   # small test batch
 *          npm run clean:real -- --dry        # no API: test the school matcher only
 */

import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import { UNIVERSITIES } from '../../../lib/data/universities';

// ── env (.env: KEY=VALUE per line) ─────────────────────────────────────────────
(() => {
  const envPath = path.join(__dirname, '..', '..', '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
})();

const ROOT = path.join(__dirname, '..', '..');
const INPUT_FILE = path.join(ROOT, 'dataset_real.json');
const OUTPUT_FILE = path.join(ROOT, 'dataset_clean.json');
const TRIAGE_FILE = path.join(ROOT, 'triage_clean.json');

const MODEL = process.env.CLEAN_MODEL || 'claude-haiku-4-5';
const CONCURRENCY = parseInt(process.env.CLEAN_CONCURRENCY || '4', 10);
const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const LIMIT = (() => {
  const i = args.indexOf('--limit');
  return i >= 0 ? parseInt(args[i + 1], 10) : Infinity;
})();

// ── Canonical school matcher ───────────────────────────────────────────────────
// Maps a free-text school mention to a canonical Compass university id. The alias
// list resolves common Reddit shorthand; order matters (longer/ambiguous first).
type Alias = { id: string; patterns: string[]; mode: 'contains' | 'token' };
const ALIASES: Alias[] = [
  // disambiguate the tricky pairs BEFORE their substrings
  { id: 'psu', patterns: ['penn state', 'pennsylvania state'], mode: 'contains' },
  { id: 'michigan-state', patterns: ['michigan state', 'msu'], mode: 'contains' },
  { id: 'wisconsin', patterns: ['wisconsin', 'uw madison', 'uw-madison', 'uw–madison'], mode: 'contains' },
  { id: 'wm', patterns: ['william & mary', 'william and mary', 'william mary'], mode: 'contains' },
  { id: 'bc', patterns: ['boston college'], mode: 'contains' },
  { id: 'bu', patterns: ['boston university'], mode: 'contains' },
  { id: 'nc-state', patterns: ['nc state', 'north carolina state', 'ncsu', 'n c state'], mode: 'contains' },
  { id: 'asu', patterns: ['arizona state', 'asu'], mode: 'contains' }, // before generic 'arizona'
  // ivies + top privates
  { id: 'mit', patterns: ['mit', 'massachusetts institute'], mode: 'token' },
  { id: 'harvard', patterns: ['harvard'], mode: 'contains' },
  { id: 'stanford', patterns: ['stanford'], mode: 'contains' },
  { id: 'princeton', patterns: ['princeton'], mode: 'contains' },
  { id: 'yale', patterns: ['yale'], mode: 'contains' },
  { id: 'columbia', patterns: ['columbia'], mode: 'contains' },
  { id: 'upenn', patterns: ['upenn', 'u penn', 'university of pennsylvania', 'wharton', 'penn'], mode: 'token' },
  { id: 'brown', patterns: ['brown'], mode: 'contains' },
  { id: 'dartmouth', patterns: ['dartmouth'], mode: 'contains' },
  { id: 'cornell', patterns: ['cornell'], mode: 'contains' },
  { id: 'caltech', patterns: ['caltech', 'california institute'], mode: 'contains' },
  { id: 'uchicago', patterns: ['uchicago', 'university of chicago', 'u chicago', 'uchi'], mode: 'contains' },
  { id: 'duke', patterns: ['duke'], mode: 'contains' },
  { id: 'northwestern', patterns: ['northwestern'], mode: 'contains' },
  { id: 'jhu', patterns: ['johns hopkins', 'jhu', 'hopkins'], mode: 'contains' },
  { id: 'vanderbilt', patterns: ['vanderbilt', 'vandy'], mode: 'contains' },
  { id: 'rice', patterns: ['rice university', 'rice'], mode: 'token' },
  { id: 'washu', patterns: ['washu', 'wustl', 'washington university in st', 'washington university st'], mode: 'contains' },
  { id: 'notre-dame', patterns: ['notre dame'], mode: 'contains' },
  { id: 'georgetown', patterns: ['georgetown'], mode: 'contains' },
  { id: 'cmu', patterns: ['carnegie mellon', 'cmu'], mode: 'contains' },
  { id: 'emory', patterns: ['emory'], mode: 'contains' },
  { id: 'usc', patterns: ['usc', 'university of southern california', 'southern california'], mode: 'token' },
  { id: 'ucla', patterns: ['ucla', 'university of california los angeles', 'california los angeles'], mode: 'contains' },
  { id: 'berkeley', patterns: ['berkeley', 'uc berkeley', 'ucb', 'cal'], mode: 'token' },
  { id: 'ucsd', patterns: ['ucsd', 'uc san diego', 'san diego'], mode: 'contains' },
  { id: 'umich', patterns: ['umich', 'university of michigan', 'ann arbor', 'michigan'], mode: 'token' },
  { id: 'uva', patterns: ['uva', 'university of virginia'], mode: 'contains' },
  { id: 'unc', patterns: ['unc', 'north carolina', 'chapel hill'], mode: 'contains' },
  { id: 'gatech', patterns: ['georgia tech', 'gatech', 'georgia institute', 'gt'], mode: 'token' },
  { id: 'nyu', patterns: ['nyu', 'new york university'], mode: 'contains' },
  { id: 'tufts', patterns: ['tufts'], mode: 'contains' },
  { id: 'northeastern', patterns: ['northeastern', 'neu'], mode: 'contains' },
  { id: 'rochester', patterns: ['university of rochester'], mode: 'contains' },
  { id: 'case-western', patterns: ['case western', 'cwru'], mode: 'contains' },
  { id: 'wake-forest', patterns: ['wake forest'], mode: 'contains' },
  { id: 'lehigh', patterns: ['lehigh'], mode: 'contains' },
  { id: 'brandeis', patterns: ['brandeis'], mode: 'contains' },
  { id: 'tulane', patterns: ['tulane'], mode: 'contains' },
  { id: 'miami', patterns: ['university of miami'], mode: 'contains' },
  { id: 'fordham', patterns: ['fordham'], mode: 'contains' },
  { id: 'uw', patterns: ['university of washington', 'udub'], mode: 'contains' },
  { id: 'uiuc', patterns: ['uiuc', 'urbana', 'illinois urbana', 'university of illinois'], mode: 'contains' },
  { id: 'ut-austin', patterns: ['ut austin', 'ut-austin', 'texas at austin', 'utexas'], mode: 'contains' },
  { id: 'purdue', patterns: ['purdue'], mode: 'contains' },
  { id: 'ohio-state', patterns: ['ohio state', 'osu'], mode: 'contains' },
  { id: 'asu', patterns: ['arizona state', 'asu'], mode: 'contains' },
  { id: 'indiana', patterns: ['indiana university', 'iu bloomington'], mode: 'contains' },

  // ── expanded pool: UC system (match both "UC X" and "California, X" forms) ──
  { id: 'uc-irvine', patterns: ['uc irvine', 'california irvine', 'uci'], mode: 'contains' },
  { id: 'uc-davis', patterns: ['uc davis', 'california davis', 'ucd'], mode: 'contains' },
  { id: 'ucsb', patterns: ['uc santa barbara', 'california santa barbara', 'ucsb'], mode: 'contains' },
  { id: 'uc-riverside', patterns: ['uc riverside', 'california riverside', 'ucr'], mode: 'contains' },
  { id: 'uc-santa-cruz', patterns: ['uc santa cruz', 'california santa cruz', 'ucsc'], mode: 'contains' },
  { id: 'uc-merced', patterns: ['uc merced', 'california merced'], mode: 'contains' },
  // ── expanded pool: public flagships (umass BEFORE amherst college below) ────
  { id: 'florida', patterns: ['university of florida', 'uf'], mode: 'token' },
  { id: 'maryland', patterns: ['university of maryland', 'maryland', 'umd'], mode: 'contains' },
  { id: 'georgia', patterns: ['university of georgia', 'uga'], mode: 'contains' },
  { id: 'texas-am', patterns: ['texas a&m', 'texas a m', 'tamu', 'texas am'], mode: 'contains' },
  { id: 'virginia-tech', patterns: ['virginia tech', 'vtech', 'vt'], mode: 'token' },
  { id: 'rutgers', patterns: ['rutgers'], mode: 'contains' },
  { id: 'pitt', patterns: ['university of pittsburgh', 'pittsburgh', 'pitt'], mode: 'token' },
  { id: 'minnesota', patterns: ['university of minnesota', 'minnesota', 'umn'], mode: 'contains' },
  { id: 'colorado-boulder', patterns: ['colorado boulder', 'cu boulder', 'boulder'], mode: 'contains' },
  { id: 'uconn', patterns: ['uconn', 'university of connecticut', 'connecticut'], mode: 'contains' },
  { id: 'umass', patterns: ['umass', 'university of massachusetts', 'massachusetts amherst'], mode: 'contains' },
  { id: 'stony-brook', patterns: ['stony brook', 'suny stony brook'], mode: 'contains' },
  { id: 'binghamton', patterns: ['binghamton'], mode: 'contains' },
  { id: 'arizona', patterns: ['university of arizona', 'u of a'], mode: 'contains' },
  { id: 'clemson', patterns: ['clemson'], mode: 'contains' },
  { id: 'syracuse', patterns: ['syracuse'], mode: 'contains' },
  // ── expanded pool: tech-focused privates ────────────────────────────────────
  { id: 'rpi', patterns: ['rensselaer', 'rpi'], mode: 'contains' },
  { id: 'rit', patterns: ['rochester institute', 'rit'], mode: 'token' },
  { id: 'drexel', patterns: ['drexel'], mode: 'contains' },
  { id: 'stevens', patterns: ['stevens institute', 'stevens tech'], mode: 'contains' },
  { id: 'wpi', patterns: ['worcester polytechnic', 'wpi'], mode: 'contains' },
  { id: 'villanova', patterns: ['villanova'], mode: 'contains' },
  { id: 'santa-clara', patterns: ['santa clara', 'scu'], mode: 'contains' },
  { id: 'smu', patterns: ['southern methodist', 'smu'], mode: 'contains' },
  // ── expanded pool: selective liberal arts colleges ──────────────────────────
  { id: 'williams', patterns: ['williams college', 'williams'], mode: 'contains' },
  { id: 'amherst', patterns: ['amherst college', 'amherst'], mode: 'contains' },
  { id: 'swarthmore', patterns: ['swarthmore'], mode: 'contains' },
  { id: 'pomona', patterns: ['pomona'], mode: 'contains' },
  { id: 'bowdoin', patterns: ['bowdoin'], mode: 'contains' },
  { id: 'middlebury', patterns: ['middlebury'], mode: 'contains' },
  { id: 'wellesley', patterns: ['wellesley'], mode: 'contains' },
  { id: 'carleton', patterns: ['carleton'], mode: 'contains' },
  { id: 'harvey-mudd', patterns: ['harvey mudd', 'hmc'], mode: 'contains' },
  { id: 'cmc', patterns: ['claremont mckenna', 'cmc'], mode: 'contains' },
  { id: 'colgate', patterns: ['colgate'], mode: 'contains' },
  { id: 'hamilton', patterns: ['hamilton college', 'hamilton'], mode: 'contains' },
  { id: 'davidson', patterns: ['davidson'], mode: 'contains' },
  { id: 'vassar', patterns: ['vassar'], mode: 'contains' },
  { id: 'grinnell', patterns: ['grinnell'], mode: 'contains' },
  { id: 'barnard', patterns: ['barnard'], mode: 'contains' },
];
const VALID_IDS = new Set(UNIVERSITIES.map((u) => u.id));
// keep only aliases whose target exists in the current dataset
const ACTIVE_ALIASES = ALIASES.filter((a) => VALID_IDS.has(a.id));

function normText(s: string): string {
  return (s || '').toLowerCase().replace(/&amp;/g, '&').replace(/[^a-z0-9 &]+/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Resolve a free-text school mention to a canonical id, or null if unknown. */
export function matchSchool(raw: string): string | null {
  const t = ' ' + normText(raw) + ' ';
  for (const a of ACTIVE_ALIASES) {
    for (const p of a.patterns) {
      const pn = normText(p);
      if (a.mode === 'token') {
        if (t.includes(' ' + pn + ' ')) return a.id;
      } else {
        if (t.includes(pn)) return a.id;
      }
    }
  }
  return null;
}

// ── Quote verification (anti-hallucination) ─────────────────────────────────────
function normQuote(s: string): string {
  return (s || '').toLowerCase().replace(/&amp;/g, '&').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/\s+/g, ' ').trim();
}
function quoteVerifies(quote: string, sourceNorm: string): boolean {
  const q = normQuote(quote);
  return q.length >= 3 && sourceNorm.includes(q);
}

// ── Extraction schema (validates the model's tool output) ───────────────────────
const ResultItem = z.object({
  school: z.string().min(1),
  decision: z.enum(['accepted', 'rejected', 'waitlisted', 'deferred']),
  quote: z.string().min(1),
});
const Extraction = z.object({
  is_results_post: z.boolean(),
  applicant_type: z.enum(['domestic_us', 'international', 'unknown']).nullish(),
  country: z.string().nullish(),
  intended_major: z.string().nullish(),
  curriculum: z.enum(['IB', 'A-Level', 'national', 'US-GPA', 'other']).nullish(),
  gpa: z.number().nullish(),
  sat: z.number().int().nullish(),
  act: z.number().int().nullish(),
  ielts: z.number().nullish(),
  toefl: z.number().int().nullish(),
  ib_total: z.number().int().nullish(),
  results: z.array(ResultItem).default([]),
});
type Extraction = z.infer<typeof Extraction>;

const TOOL: Anthropic.Tool = {
  name: 'save_profile',
  description: 'Save the structured admissions profile and decisions extracted from the post.',
  input_schema: {
    type: 'object',
    properties: {
      is_results_post: { type: 'boolean', description: "true only if the post shares the author's OWN stats and college admission decisions." },
      applicant_type: { type: ['string', 'null'], enum: ['domestic_us', 'international', 'unknown', null] },
      country: { type: ['string', 'null'], description: 'Country of residence/citizenship if stated.' },
      intended_major: { type: ['string', 'null'] },
      curriculum: { type: ['string', 'null'], enum: ['IB', 'A-Level', 'national', 'US-GPA', 'other', null] },
      gpa: { type: ['number', 'null'], description: 'GPA on a 4.0 scale (convert if needed).' },
      sat: { type: ['integer', 'null'], description: 'SAT total 400-1600.' },
      act: { type: ['integer', 'null'], description: 'ACT composite 1-36.' },
      ielts: { type: ['number', 'null'] },
      toefl: { type: ['integer', 'null'] },
      ib_total: { type: ['integer', 'null'], description: 'IB total 1-45.' },
      results: {
        type: 'array',
        description: 'One entry per university decision the author reports.',
        items: {
          type: 'object',
          properties: {
            school: { type: 'string', description: 'University name as written in the post.' },
            decision: { type: 'string', enum: ['accepted', 'rejected', 'waitlisted', 'deferred'] },
            quote: { type: 'string', description: 'EXACT verbatim substring from the post proving this decision. Copy it character-for-character.' },
          },
          required: ['school', 'decision', 'quote'],
        },
      },
    },
    required: ['is_results_post', 'results'],
  },
};

const SYSTEM = `You extract structured college-admissions data from Reddit posts (r/collegeresults etc.).
Rules:
- Only set is_results_post=true if the author shares THEIR OWN stats and real admission decisions.
- For every item in results, the quote MUST be an exact, verbatim, character-for-character substring of the post. Never paraphrase a quote. If you cannot find an exact supporting substring, omit that decision.
- Map "committed/attending/got in/admit" to accepted; "denied/rejected" to rejected; "WL" to waitlisted; "deferred" to deferred.
- Convert GPA to a 4.0 scale when a scale is given. Leave a field null if not clearly stated. Do not guess.
Call the save_profile tool exactly once.`;

// ── Per-post extraction ─────────────────────────────────────────────────────────
type InputPost = { source_id: string; source_url: string; post_date: string; post_title: string; raw_text: string };
type CleanRecord = {
  source_id: string; source_url: string; post_date: string; post_title: string;
  applicant_type: string | null; country: string | null; intended_major: string | null; curriculum: string | null;
  gpa: number | null; sat: number | null; act: number | null; ielts: number | null; toefl: number | null; ib_total: number | null;
  results: { school_id: string | null; school_raw: string; decision: string }[];
  _meta: { results_total: number; results_verified: number; results_matched: number };
};

let client: Anthropic | null = null;
const usage = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };

async function extractOne(post: InputPost): Promise<{ record: CleanRecord | null; triage?: string }> {
  const source = `${post.post_title}\n\n${post.raw_text}`;
  const sourceNorm = normQuote(source);

  const msg = await client!.messages.create({
    model: MODEL,
    max_tokens: 1500,
    system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
    tools: [TOOL],
    tool_choice: { type: 'tool', name: 'save_profile' },
    messages: [{ role: 'user', content: source.slice(0, 9000) }],
  });
  usage.input += msg.usage.input_tokens;
  usage.output += msg.usage.output_tokens;
  usage.cacheRead += (msg.usage as any).cache_read_input_tokens || 0;
  usage.cacheWrite += (msg.usage as any).cache_creation_input_tokens || 0;

  const block = msg.content.find((c) => c.type === 'tool_use') as Anthropic.ToolUseBlock | undefined;
  if (!block) return { record: null, triage: 'no tool_use in response' };

  const parsed = Extraction.safeParse(block.input);
  if (!parsed.success) return { record: null, triage: 'schema validation failed' };
  const e = parsed.data;
  if (!e.is_results_post) return { record: null, triage: 'not a results post' };

  // verify each decision's quote, then normalize the school name
  const results = e.results
    .filter((r) => quoteVerifies(r.quote, sourceNorm))
    .map((r) => ({ school_id: matchSchool(r.school), school_raw: r.school, decision: r.decision }));

  if (results.length === 0) return { record: null, triage: 'no decisions with a verifiable quote' };

  const record: CleanRecord = {
    source_id: post.source_id, source_url: post.source_url, post_date: post.post_date, post_title: post.post_title,
    applicant_type: e.applicant_type ?? null, country: e.country ?? null, intended_major: e.intended_major ?? null,
    curriculum: e.curriculum ?? null, gpa: e.gpa ?? null, sat: e.sat ?? null, act: e.act ?? null,
    ielts: e.ielts ?? null, toefl: e.toefl ?? null, ib_total: e.ib_total ?? null,
    results,
    _meta: { results_total: e.results.length, results_verified: results.length, results_matched: results.filter((r) => r.school_id).length },
  };
  return { record };
}

// ── Dry run: validate the school matcher on the existing regex decisions ─────────
function dryRun(posts: any[]) {
  let total = 0, matched = 0;
  const byId: Record<string, number> = {};
  const misses: string[] = [];
  for (const p of posts) {
    const ex = p.extracted || {};
    for (const arr of [ex.accepted, ex.rejected, ex.waitlisted]) {
      for (const line of arr || []) {
        total++;
        const id = matchSchool(line);
        if (id) { matched++; byId[id] = (byId[id] || 0) + 1; }
        else if (misses.length < 25) misses.push(String(line).slice(0, 60));
      }
    }
  }
  console.log(`\n=== DRY RUN — school matcher over existing regex decisions ===`);
  console.log(`decision lines: ${total} | matched to a canonical school: ${matched} (${Math.round((matched / total) * 100)}%)`);
  const top = Object.entries(byId).sort((a, b) => b[1] - a[1]).slice(0, 20);
  console.log(`top matched schools:`); top.forEach(([id, n]) => console.log(`  ${id.padEnd(16)} ${n}`));
  console.log(`\nsample UNMATCHED lines (these are noisy regex strings; the LLM pass will clean them):`);
  misses.forEach((m) => console.log(`  · ${m}`));
  console.log(`\nNote: low match% here is expected — the regex 'decisions' are dirty (essay fragments etc.).`);
  console.log(`The LLM pass extracts clean school names, so its match rate will be far higher.`);
}

async function pool<T>(items: T[], n: number, fn: (t: T, i: number) => Promise<void>) {
  let idx = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (idx < items.length) { const i = idx++; await fn(items[i], i); }
  }));
}

async function main() {
  if (!fs.existsSync(INPUT_FILE)) { console.error(`Missing ${INPUT_FILE}. Run npm run scrape:reddit:real first.`); process.exit(1); }
  const all: any[] = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
  console.log(`Loaded ${all.length} real profiles from dataset_real.json`);
  console.log(`Canonical schools available: ${VALID_IDS.size} | active aliases: ${ACTIVE_ALIASES.length}`);

  if (DRY) { dryRun(all); return; }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('\n❌ ANTHROPIC_API_KEY not set. Put it in data-pipeline/.env, then re-run.');
    console.error('   (Or test the matcher without a key:  npm run clean:real -- --dry)');
    process.exit(1);
  }
  client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 4 });

  // resume: skip already-processed source_ids
  const clean: CleanRecord[] = fs.existsSync(OUTPUT_FILE) ? JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8')) : [];
  const triage: any[] = fs.existsSync(TRIAGE_FILE) ? JSON.parse(fs.readFileSync(TRIAGE_FILE, 'utf8')) : [];
  const done = new Set([...clean.map((r) => r.source_id), ...triage.map((r) => r.source_id)]);

  const todo = all.filter((p) => !done.has(p.source_id)).slice(0, LIMIT === Infinity ? undefined : LIMIT);
  console.log(`To process: ${todo.length} (already done: ${done.size})  model=${MODEL} concurrency=${CONCURRENCY}\n`);

  let n = 0;
  const save = () => { fs.writeFileSync(OUTPUT_FILE, JSON.stringify(clean, null, 2)); fs.writeFileSync(TRIAGE_FILE, JSON.stringify(triage, null, 2)); };

  await pool(todo, CONCURRENCY, async (post) => {
    try {
      const { record, triage: reason } = await extractOne(post);
      if (record) clean.push(record);
      else triage.push({ source_id: post.source_id, source_url: post.source_url, reason });
    } catch (err: any) {
      triage.push({ source_id: post.source_id, source_url: post.source_url, reason: `error: ${err.message}` });
    }
    if (++n % 25 === 0) { save(); console.log(`  ${n}/${todo.length} done | clean ${clean.length} | triage ${triage.length}`); }
  });
  save();

  const matchedDecisions = clean.reduce((s, r) => s + r._meta.results_matched, 0);
  const totalDecisions = clean.reduce((s, r) => s + r.results.length, 0);
  console.log(`\n✅ Clean records: ${clean.length}  |  triaged: ${triage.length}`);
  console.log(`   Verified decisions: ${totalDecisions} | mapped to canonical schools: ${matchedDecisions} (${Math.round((matchedDecisions / Math.max(1, totalDecisions)) * 100)}%)`);
  console.log(`   Tokens — input ${usage.input} (cache read ${usage.cacheRead}, write ${usage.cacheWrite}), output ${usage.output}`);
  console.log(`   💾 ${OUTPUT_FILE}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
