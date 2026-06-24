/**
 * Reddit Real Data Scraper v3
 * Fetches REAL posts from r/collegeresults (and a couple of related subs) via
 * PullPush.io — the public Pushshift-successor archive. No Reddit "script" app,
 * OAuth, or login required: PullPush is credential-free and serves the full
 * historical archive, paged backwards by `before` timestamp.
 * Run with `tsx`:  npm run scrape:reddit:real
 */

import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';

const OUTPUT_DIR = path.join(__dirname, '..', '..', 'raw');
const DATASET_FILE = path.join(__dirname, '..', '..', 'dataset_real.json');

// ── Data source: PullPush.io (Pushshift successor) ─────────────────────────────
// PullPush is a public, credential-free archive of Reddit. We use it instead of
// the official Reddit API so no "script" app / OAuth login is required. It serves
// the full historical archive of a subreddit, paged backwards via `before`.
// Rate limits: ~15 req/min soft, 30/min hard, 1000/hour — we sleep ~4.5s/request.
const USER_AGENT = process.env.REDDIT_USER_AGENT || 'compass-research/1.0 (admissions dataset)';
const PULLPUSH = 'https://api.pullpush.io/reddit/search/submission/';
const PAGE_SIZE = 100;
// Keep the 2022+ admission cycles for more volume (parsePost enforces year >= 2022).
const CUTOFF_UTC = Math.floor(new Date('2022-01-01T00:00:00Z').getTime() / 1000);

function pullpushUrl(params: Record<string, string | number | undefined>): string {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&');
  return `${PULLPUSH}?${qs}`;
}

// Target universities from Compass database
const TARGET_UNIVERSITIES_LOWER = [
  'mit', 'massachusetts institute of technology',
  'stanford', 'harvard', 'yale', 'princeton', 'columbia',
  'university of pennsylvania', 'upenn', 'penn',
  'cornell', 'brown', 'dartmouth',
  'uc berkeley', 'berkeley', 'ucla', 'uc san diego', 'ucsd', 'uc davis',
  'nyu', 'new york university',
  'caltech', 'california institute of technology',
  'university of michigan', 'umich',
  'georgia tech', 'carnegie mellon', 'cmu',
  'university of illinois', 'uiuc',
  'university of washington',
  'usc', 'university of southern california',
  'boston university',
  'northeastern',
  'university of wisconsin', 'purdue',
  'university of texas', 'ut austin',
  'johns hopkins', 'duke', 'northwestern',
  'rice', 'vanderbilt', 'emory', 'georgetown',
  'university of virginia', 'uva',
  'university of north carolina', 'unc',
  'washington university', 'washu',
  'tufts', 'university of rochester',
  'bocconi', 'politecnico di milano', 'polimi',
  'sapienza', 'bologna', 'padova',
  'hku', 'hkust', 'cuhk', 'polyu', 'cityu',
  'hong kong university', 'chinese university of hong kong',
  'uc santa barbara', 'ucsb', 'uc irvine',
  'university of florida', 'ohio state',
  'penn state', 'virginia tech', 'nc state',
  'university of maryland', 'rutgers',
  'indiana university', 'university of pittsburgh',
  'case western', 'tulane', 'wake forest',
  'boston college', 'brandeis', 'fordham',
  'rit', 'drexel', 'temple',
  // expanded pool — UC system
  'uc irvine', 'uci', 'uc davis', 'uc santa barbara', 'ucsb',
  'uc riverside', 'ucr', 'uc santa cruz', 'ucsc', 'uc merced',
  // expanded pool — public flagships
  'university of florida', 'university of maryland', 'umd',
  'university of georgia', 'texas a&m', 'tamu', 'nc state', 'north carolina state',
  'virginia tech', 'rutgers', 'university of minnesota', 'minnesota',
  'colorado boulder', 'cu boulder', 'uconn', 'university of connecticut',
  'umass', 'university of massachusetts', 'stony brook', 'binghamton',
  'university of arizona', 'clemson', 'syracuse', 'penn state', 'ohio state',
  'michigan state', 'arizona state', 'asu', 'university of washington',
  // expanded pool — tech-focused privates
  'rensselaer', 'rpi', 'stevens institute', 'worcester polytechnic', 'wpi',
  'villanova', 'santa clara', 'southern methodist', 'smu',
  // expanded pool — selective liberal arts colleges
  'williams college', 'amherst college', 'swarthmore', 'pomona',
  'bowdoin', 'middlebury', 'wellesley', 'carleton', 'harvey mudd',
  'claremont mckenna', 'colgate', 'hamilton college', 'davidson',
  'vassar', 'grinnell', 'barnard',
];

interface RawPost {
  id: string;
  title: string;
  selftext: string;
  author: string;
  created_utc: number;
  score: number;
  num_comments: number;
  subreddit: string;
  permalink: string;
}

interface ParsedProfile {
  source_id: string;
  source_url: string;
  source_subreddit: string;
  scraped_at: string;
  post_date: string;
  post_title: string;
  post_score: number;
  raw_text: string;
  extracted: {
    gender: string | null;
    race_ethnicity: string | null;
    country: string | null;
    income: string | null;
    school_type: string | null;
    hooks: string | null;
    gpa_raw: string | null;
    sat: number | null;
    act: number | null;
    ielts: number | null;
    toefl: number | null;
    ib_score: number | null;
    curriculum: string | null;
    intended_major: string | null;
    num_aps: number | null;
    activities_raw: string[];
    honors_raw: string[];
    accepted: string[];
    rejected: string[];
    waitlisted: string[];
    needs_aid: boolean | null;
  };
}

function httpsGet(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json',
      },
    };
    https.get(url, options, (res) => {
      if (res.statusCode === 429) {
        const retryAfter = parseInt(res.headers['retry-after'] || '10', 10);
        console.log(`  ⏳ Rate limited. Waiting ${retryAfter}s...`);
        setTimeout(() => httpsGet(url).then(resolve).catch(reject), retryAfter * 1000);
        return;
      }
      if (res.statusCode === 302 || res.statusCode === 301) {
        const loc = res.headers['location'];
        if (loc) {
          console.log(`  ↪ Redirect to: ${loc.substring(0, 80)}`);
          httpsGet(loc).then(resolve).catch(reject);
          return;
        }
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url.substring(0, 100)}`));
        return;
      }
      let data = '';
      res.on('data', (chunk: string) => (data += chunk));
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// --- Extractors ---

function extractGender(text: string): string | null {
  const m = text.match(/\bgender\s*[:\-–]?\s*(male|female|non[- ]?binary|nb|ftm|mtf|trans\w*)/i);
  return m ? m[1].trim() : null;
}

function extractRace(text: string): string | null {
  const m = text.match(/\b(?:race|ethnicity)\s*[:\-–\/]?\s*([^\n,]{2,40})/i);
  return m ? m[1].trim() : null;
}

function extractCountry(text: string): string | null {
  const countries: Record<string, string[]> = {
    'India': ['india', 'indian'],
    'China': ['china', 'chinese'],
    'Vietnam': ['vietnam', 'vietnamese'],
    'South Korea': ['korea', 'korean'],
    'Turkey': ['turkey', 'turkish'],
    'Pakistan': ['pakistan', 'pakistani'],
    'Nigeria': ['nigeria', 'nigerian'],
    'Brazil': ['brazil', 'brazilian'],
    'Hong Kong': ['hong kong'],
    'Singapore': ['singapore'],
    'Bangladesh': ['bangladesh'],
    'Indonesia': ['indonesia'],
    'Thailand': ['thailand', 'thai'],
    'Philippines': ['philippines', 'filipino'],
    'Mexico': ['mexico', 'mexican'],
    'Iran': ['iran', 'iranian'],
    'Egypt': ['egypt', 'egyptian'],
    'USA': ['domestic', 'u.s. citizen', 'us citizen', 'american'],
  };
  const lower = text.toLowerCase();
  for (const [country, keywords] of Object.entries(countries)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return country;
    }
  }
  if (/\binternational\b/i.test(lower) && !/\bdomestic\b/i.test(lower)) return 'International (unspecified)';
  return null;
}

function extractIncome(text: string): string | null {
  const m = text.match(/\b(?:income|bracket)\s*[:\-–]?\s*([^\n]{3,60})/i);
  return m ? m[1].trim() : null;
}

function extractSchoolType(text: string): string | null {
  const m = text.match(/\b(?:type of school|school type|school)\s*[:\-–]?\s*([^\n]{3,60})/i);
  return m ? m[1].trim() : null;
}

function extractHooks(text: string): string | null {
  const m = text.match(/\bhooks?\s*[:\-–]?\s*([^\n]{3,100})/i);
  return m ? m[1].trim() : null;
}

function extractGPA(text: string): string | null {
  const patterns = [
    /\bgpa\s*[:\-–]?\s*([\d.]+\s*(?:UW|unweighted)?\s*\/?\s*[\d.]*\s*(?:W|weighted)?)/i,
    /\b([\d.]+)\s*(?:UW|unweighted)\s*\/\s*([\d.]+)\s*(?:W|weighted)/i,
    /\bgpa\s*[:\-–]?\s*([\d.]+)/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[0].replace(/^gpa\s*[:\-–]?\s*/i, '').trim();
  }
  return null;
}

function extractSAT(text: string): number | null {
  const patterns = [
    /\bSAT\s*[:\-–]?\s*(\d{4})\b/i,
    /\b(\d{4})\s*SAT\b/i,
    /\bSAT\s+(?:score\s*)?[:\-–]?\s*(\d{4})\b/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const score = parseInt(m[1], 10);
      if (score >= 400 && score <= 1600) return score;
    }
  }
  return null;
}

function extractACT(text: string): number | null {
  const m = text.match(/\bACT\s*[:\-–]?\s*(\d{2})\b/i);
  if (m) {
    const score = parseInt(m[1], 10);
    if (score >= 1 && score <= 36) return score;
  }
  return null;
}

function extractIELTS(text: string): number | null {
  const m = text.match(/\bIELTS\s*[:\-–]?\s*([\d.]+)/i);
  if (m) {
    const s = parseFloat(m[1]);
    if (s >= 1 && s <= 9) return s;
  }
  return null;
}

function extractTOEFL(text: string): number | null {
  const m = text.match(/\bTOEFL\s*[:\-–]?\s*(\d{2,3})/i);
  if (m) {
    const s = parseInt(m[1], 10);
    if (s >= 1 && s <= 120) return s;
  }
  return null;
}

function extractIB(text: string): number | null {
  const patterns = [
    /\bIB\s*(?:predicted|score|total|diploma)?\s*[:\-–]?\s*(\d{2})\s*(?:\/\s*45)?/i,
    /\b(\d{2})\s*\/\s*45\b/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const s = parseInt(m[1], 10);
      if (s >= 24 && s <= 45) return s;
    }
  }
  return null;
}

function extractCurriculum(text: string): string | null {
  if (/\bIB\b/.test(text) && /\b\d{2}\s*\/\s*45\b/.test(text)) return 'IB';
  if (/\bA[\s-]?Level/i.test(text)) return 'A-Level';
  if (/\bAP\b/.test(text) || /\bGPA\b/i.test(text)) return 'US-GPA';
  if (/\bCBSE\b/i.test(text) || /\bICSE\b/i.test(text)) return 'national';
  return 'other';
}

function extractMajor(text: string): string | null {
  const m = text.match(/\b(?:intended\s+)?major(?:\(s\))?s?\s*[:\-–]?\s*([^\n]{3,80})/i);
  if (m) return m[1].trim();
  return null;
}

function extractNumAPs(text: string): number | null {
  const m = text.match(/\b(\d{1,2})\s*APs?\b/i);
  if (m) return parseInt(m[1], 10);
  return null;
}

function extractActivitiesRaw(text: string): string[] {
  const activities: string[] = [];
  const sections = text.split(/\*\*(?:ECs?|Extracurriculars?|Activities)\*\*/i);
  if (sections.length < 2) return activities;

  const ecSection = sections[1].split(/\*\*/)[0]; // until next bold section
  const lines = ecSection.split('\n');
  for (const line of lines) {
    const cleaned = line.replace(/^[\s\-*\\•·]+/, '').trim();
    if (cleaned.length > 5 && cleaned.length < 300) {
      activities.push(cleaned);
    }
  }
  return activities.slice(0, 15);
}

function extractHonorsRaw(text: string): string[] {
  const honors: string[] = [];
  const sections = text.split(/\*\*(?:Awards?|Honors?)\*\*/i);
  if (sections.length < 2) return honors;

  const section = sections[1].split(/\*\*/)[0];
  const lines = section.split('\n');
  for (const line of lines) {
    const cleaned = line.replace(/^[\s\-*\\•·\d.]+/, '').trim();
    if (cleaned.length > 3 && cleaned.length < 200) {
      honors.push(cleaned);
    }
  }
  return honors.slice(0, 10);
}

function extractDecisions(text: string): { accepted: string[]; rejected: string[]; waitlisted: string[] } {
  const accepted: string[] = [];
  const rejected: string[] = [];
  const waitlisted: string[] = [];

  const lines = text.split(/\n/);
  let category: 'accepted' | 'rejected' | 'waitlisted' | null = null;

  for (const line of lines) {
    const lower = line.toLowerCase().trim();

    // Detect category headers
    if (/^#+\s*accept/i.test(line) || /^\*\*accept/i.test(line) || /^accept/i.test(lower)) {
      category = 'accepted';
      continue;
    }
    if (/^#+\s*reject/i.test(line) || /^\*\*reject/i.test(line) || /^reject/i.test(lower) || /^denied/i.test(lower)) {
      category = 'rejected';
      continue;
    }
    if (/^#+\s*waitlist/i.test(line) || /^\*\*waitlist/i.test(line) || /^waitlist/i.test(lower)) {
      category = 'waitlisted';
      continue;
    }
    // Also detect inline: "Northwestern, rejected"
    if (!category) {
      for (const uni of TARGET_UNIVERSITIES_LOWER) {
        if (lower.includes(uni)) {
          if (/reject/i.test(lower)) {
            rejected.push(line.trim().replace(/^[\s\-*\\•·]+/, '').trim());
          } else if (/accept/i.test(lower) || /admit/i.test(lower)) {
            accepted.push(line.trim().replace(/^[\s\-*\\•·]+/, '').trim());
          } else if (/waitlist/i.test(lower)) {
            waitlisted.push(line.trim().replace(/^[\s\-*\\•·]+/, '').trim());
          }
          break;
        }
      }
    }

    if (category && lower.length > 2) {
      const cleanedLine = line.replace(/^[\s\-*\\•·]+/, '').trim();
      if (cleanedLine.length > 2) {
        // Check if this line mentions a university
        const hasUni = TARGET_UNIVERSITIES_LOWER.some(u => lower.includes(u));
        if (hasUni) {
          if (category === 'accepted') accepted.push(cleanedLine);
          else if (category === 'rejected') rejected.push(cleanedLine);
          else waitlisted.push(cleanedLine);
        }
      }
    }
  }

  return { accepted, rejected, waitlisted };
}

function parsePost(post: RawPost): ParsedProfile | null {
  const text = `${post.title}\n${post.selftext}`;

  // Must have at least some stats-related content
  const hasStats = /\bgpa\b/i.test(text) || /\bsat\b/i.test(text) || /\bact\b/i.test(text);
  const hasDecisions = /\baccepted\b/i.test(text) || /\brejected\b/i.test(text) || /\baccept/i.test(text) || /\breject/i.test(text);
  if (!hasStats && !hasDecisions) return null;

  const decisions = extractDecisions(text);
  const totalDecisions = decisions.accepted.length + decisions.rejected.length + decisions.waitlisted.length;
  if (totalDecisions === 0) return null;

  const postDate = new Date(post.created_utc * 1000);
  if (postDate.getFullYear() < 2022) return null;

  return {
    source_id: `reddit_${post.id}`,
    source_url: `https://reddit.com${post.permalink}`,
    source_subreddit: post.subreddit,
    scraped_at: new Date().toISOString(),
    post_date: postDate.toISOString(),
    post_title: post.title,
    post_score: post.score,
    raw_text: post.selftext.substring(0, 8000),
    extracted: {
      gender: extractGender(text),
      race_ethnicity: extractRace(text),
      country: extractCountry(text),
      income: extractIncome(text),
      school_type: extractSchoolType(text),
      hooks: extractHooks(text),
      gpa_raw: extractGPA(text),
      sat: extractSAT(text),
      act: extractACT(text),
      ielts: extractIELTS(text),
      toefl: extractTOEFL(text),
      ib_score: extractIB(text),
      curriculum: extractCurriculum(text),
      intended_major: extractMajor(text),
      num_aps: extractNumAPs(text),
      activities_raw: extractActivitiesRaw(text),
      honors_raw: extractHonorsRaw(text),
      accepted: decisions.accepted,
      rejected: decisions.rejected,
      waitlisted: decisions.waitlisted,
      needs_aid: /\bfinancial\s*aid\b/i.test(text) || /\bneed[- ]based/i.test(text) || /\bfull\s*ride\b/i.test(text) ? true : null,
    },
  };
}

// PullPush returns a flat `data: [...]` array of post objects (Pushshift shape),
// not Reddit's `data.children[].data`. We also report the oldest created_utc on
// the page so the caller can page backwards via `before`, and the raw item count
// so it knows when the archive is exhausted.
async function fetchPage(url: string): Promise<{ posts: RawPost[]; oldestUtc: number | null; rawCount: number }> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw = await httpsGet(url);
      const json = JSON.parse(raw);
      const items: any[] = Array.isArray(json?.data) ? json.data : [];
      const posts: RawPost[] = [];
      let oldestUtc: number | null = null;

      for (const d of items) {
        if (typeof d.created_utc === 'number' && (oldestUtc === null || d.created_utc < oldestUtc)) {
          oldestUtc = d.created_utc;
        }
        const body = typeof d.selftext === 'string' ? d.selftext : '';
        if (body.length > 100 && !body.startsWith('[removed]') && !body.startsWith('[deleted]')) {
          posts.push({
            id: d.id,
            title: d.title || '',
            selftext: body,
            author: d.author || '[deleted]',
            created_utc: d.created_utc || 0,
            score: d.score || 0,
            num_comments: d.num_comments || 0,
            subreddit: d.subreddit || '',
            permalink: d.permalink || '',
          });
        }
      }

      return { posts, oldestUtc, rawCount: items.length };
    } catch (err: any) {
      console.error(`  ❌ Error: ${err.message}${attempt === 0 ? ' — retrying in 6s' : ''}`);
      if (attempt === 0) await sleep(6000);
    }
  }
  return { posts: [], oldestUtc: null, rawCount: 0 };
}

async function scrapeSubreddit(subreddit: string, maxPages: number = 40): Promise<RawPost[]> {
  const allPosts: RawPost[] = [];
  let before: number | undefined;

  for (let page = 0; page < maxPages; page++) {
    const url = pullpushUrl({ subreddit, size: PAGE_SIZE, sort: 'desc', before });

    console.log(`  📄 Page ${page + 1}/${maxPages} (${allPosts.length} posts so far)...`);
    const { posts, oldestUtc, rawCount } = await fetchPage(url);
    allPosts.push(...posts);

    if (rawCount < PAGE_SIZE || oldestUtc === null) {
      console.log(`  📭 Reached the end of the archive.`);
      break;
    }
    if (oldestUtc < CUTOFF_UTC) {
      console.log(`  ⏹  Reached the ${new Date(CUTOFF_UTC * 1000).getUTCFullYear()} cutoff.`);
      break;
    }
    const next = oldestUtc - 1; // strictly older, to guarantee backward progress
    if (before !== undefined && next >= before) break;
    before = next;
    await sleep(4500); // stay under PullPush's ~15 req/min soft limit
  }

  return allPosts;
}

async function searchSubreddit(subreddit: string, query: string, maxPages: number = 5): Promise<RawPost[]> {
  const allPosts: RawPost[] = [];
  let before: number | undefined;

  for (let page = 0; page < maxPages; page++) {
    const url = pullpushUrl({ subreddit, q: query, size: PAGE_SIZE, sort: 'desc', before });

    console.log(`  🔍 Search "${query}" page ${page + 1} (${allPosts.length} posts)...`);
    const { posts, oldestUtc, rawCount } = await fetchPage(url);
    allPosts.push(...posts);

    if (rawCount < PAGE_SIZE || oldestUtc === null) break;
    if (oldestUtc < CUTOFF_UTC) break;
    const next = oldestUtc - 1;
    if (before !== undefined && next >= before) break;
    before = next;
    await sleep(4500);
  }

  return allPosts;
}

async function main() {
  console.log('=== Reddit REAL Data Scraper (PullPush) ===');
  console.log(`Started at: ${new Date().toISOString()}\n`);
  console.log('📚 Source: PullPush.io public archive — no Reddit app / login required.\n');

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const seenIds = new Set<string>();
  const allPosts: RawPost[] = [];

  // 1. r/collegeresults — the best source (structured posts), full 2024+ archive
  console.log('📡 [1/3] Scraping r/collegeresults (2024+ archive)...');
  const crPosts = await scrapeSubreddit('collegeresults', 70);
  for (const p of crPosts) {
    if (!seenIds.has(p.id)) { seenIds.add(p.id); allPosts.push(p); }
  }
  console.log(`  ✅ Got ${crPosts.length} posts from r/collegeresults\n`);
  await sleep(5000);

  // 2. r/ApplyingToCollege — search for results
  console.log('📡 [2/3] Searching r/ApplyingToCollege...');
  for (const q of ['college results SAT', 'decision results GPA', 'accepted rejected stats']) {
    const posts = await searchSubreddit('ApplyingToCollege', q, 3);
    for (const p of posts) {
      if (!seenIds.has(p.id)) { seenIds.add(p.id); allPosts.push(p); }
    }
    await sleep(3000);
  }
  console.log(`  ✅ Total unique posts so far: ${allPosts.length}\n`);
  await sleep(5000);

  // 3. r/IntltoUSA
  console.log('📡 [3/3] Searching r/IntltoUSA...');
  for (const q of ['results accepted', 'chance me SAT', 'stats']) {
    const posts = await searchSubreddit('IntltoUSA', q, 3);
    for (const p of posts) {
      if (!seenIds.has(p.id)) { seenIds.add(p.id); allPosts.push(p); }
    }
    await sleep(3000);
  }

  console.log(`\n📦 Total unique raw posts: ${allPosts.length}`);

  // Save raw
  const rawFile = path.join(OUTPUT_DIR, 'reddit_raw_posts.json');
  fs.writeFileSync(rawFile, JSON.stringify(allPosts, null, 2));
  console.log(`💾 Raw posts saved: ${rawFile}\n`);

  // Parse
  console.log('🔬 Parsing posts...');
  const profiles: ParsedProfile[] = [];
  let skipped = 0;

  for (const post of allPosts) {
    const profile = parsePost(post);
    if (profile) {
      profiles.push(profile);
    } else {
      skipped++;
    }
  }

  // Save parsed
  fs.writeFileSync(DATASET_FILE, JSON.stringify(profiles, null, 2));
  console.log(`\n✅ Parsed profiles: ${profiles.length}`);
  console.log(`⏭️  Skipped (no match): ${skipped}`);
  console.log(`💾 Dataset saved: ${DATASET_FILE}`);

  // Stats
  if (profiles.length > 0) {
    const withSAT = profiles.filter(p => p.extracted.sat).length;
    const withGPA = profiles.filter(p => p.extracted.gpa_raw).length;
    const withCountry = profiles.filter(p => p.extracted.country).length;
    const withMajor = profiles.filter(p => p.extracted.intended_major).length;
    const avgDecisions = profiles.reduce((sum, p) => sum + p.extracted.accepted.length + p.extracted.rejected.length, 0) / profiles.length;

    console.log('\n📊 Summary:');
    console.log(`  With SAT: ${withSAT} (${Math.round(withSAT / profiles.length * 100)}%)`);
    console.log(`  With GPA: ${withGPA} (${Math.round(withGPA / profiles.length * 100)}%)`);
    console.log(`  With Country: ${withCountry}`);
    console.log(`  With Major: ${withMajor}`);
    console.log(`  Avg decisions per profile: ${avgDecisions.toFixed(1)}`);

    const dateRange = profiles.map(p => p.post_date).sort();
    console.log(`  Date range: ${dateRange[0]?.substring(0, 10)} → ${dateRange[dateRange.length - 1]?.substring(0, 10)}`);

    console.log('\n📝 First 3 profiles preview:');
    for (const p of profiles.slice(0, 3)) {
      console.log(`  ---`);
      console.log(`  Title: ${p.post_title.substring(0, 70)}`);
      console.log(`  URL: ${p.source_url}`);
      console.log(`  SAT: ${p.extracted.sat || 'N/A'}, GPA: ${p.extracted.gpa_raw || 'N/A'}`);
      console.log(`  Major: ${p.extracted.intended_major || 'N/A'}`);
      console.log(`  Accepted (${p.extracted.accepted.length}): ${p.extracted.accepted.slice(0, 3).join('; ')}`);
      console.log(`  Rejected (${p.extracted.rejected.length}): ${p.extracted.rejected.slice(0, 3).join('; ')}`);
    }
  }

  console.log(`\n🏁 Done at: ${new Date().toISOString()}`);
}

main().catch(console.error);
