/**
 * Robust Reddit JSON extractor.
 * The raw files from read_url_content have markdown headers + raw Reddit JSON.
 * Reddit's JSON has literal newlines inside string values (selftext_html).
 * We fix this by processing character by character.
 */
const fs = require('fs');
const path = require('path');

const rawDir = path.join(__dirname, 'data-pipeline', 'raw');

function fixRedditJson(raw) {
  // Find the JSON start
  const start = raw.indexOf('{"kind"');
  if (start === -1) return null;
  
  let str = raw.substring(start);
  
  // Strategy: process char by char, fix newlines inside JSON strings
  let result = '';
  let inString = false;
  let escaped = false;
  
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    const code = str.charCodeAt(i);
    
    if (escaped) {
      result += ch;
      escaped = false;
      continue;
    }
    
    if (ch === '\\' && inString) {
      escaped = true;
      result += ch;
      continue;
    }
    
    if (ch === '"' && !escaped) {
      inString = !inString;
      result += ch;
      continue;
    }
    
    if (inString) {
      // Replace control characters inside strings
      if (code === 0x0A) { result += '\\n'; continue; }  // \n
      if (code === 0x0D) { result += '\\r'; continue; }  // \r
      if (code === 0x09) { result += '\\t'; continue; }  // \t
      if (code < 0x20) { result += ' '; continue; }      // other control chars
    }
    
    result += ch;
  }
  
  return result;
}

const files = ['page1.json', 'search1.json'];
const allPosts = [];
const seenIds = new Set();

for (const file of files) {
  const filePath = path.join(rawDir, file);
  if (!fs.existsSync(filePath)) continue;
  
  console.log('Processing ' + file + '...');
  const raw = fs.readFileSync(filePath, 'utf8');
  const fixedJson = fixRedditJson(raw);
  
  if (!fixedJson) { console.log('  No JSON found'); continue; }
  
  try {
    const json = JSON.parse(fixedJson);
    const children = (json.data && json.data.children) || [];
    let added = 0;
    
    for (const child of children) {
      const d = child.data;
      if (!d || !d.selftext || d.selftext.length < 100) continue;
      if (d.selftext.startsWith('[removed]') || d.selftext.startsWith('[deleted]')) continue;
      if (seenIds.has(d.id)) continue;
      
      seenIds.add(d.id);
      allPosts.push({
        id: d.id,
        title: d.title || '',
        selftext: d.selftext,
        author: d.author || '[deleted]',
        created_utc: d.created_utc || 0,
        score: d.score || 0,
        num_comments: d.num_comments || 0,
        subreddit: d.subreddit || '',
        permalink: d.permalink || '',
      });
      added++;
    }
    
    console.log('  Parsed OK! ' + children.length + ' entries, ' + added + ' usable, after=' + (json.data && json.data.after));
  } catch (err) {
    console.log('  Parse error: ' + err.message.substring(0, 150));
  }
}

console.log('\nTotal unique posts: ' + allPosts.length);

// ---- PARSER ----
function extractSAT(text) {
  const patterns = [/\bSAT\s*[:\-–]?\s*(\d{4})\b/i, /\b(\d{4})\s*SAT\b/i, /\bSAT\s*\([^)]*\)\s*[:\-–]?\s*(\d{4})/i];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) { const s = parseInt(m[1] || m[2]); if (s >= 400 && s <= 1600) return s; }
  }
  return null;
}
function extractACT(text) {
  const m = text.match(/\bACT\s*[:\-–]?\s*(\d{2})\b/i);
  if (m) { const s = parseInt(m[1]); if (s >= 1 && s <= 36) return s; }
  return null;
}
function extractGPA(text) {
  const m = text.match(/\bgpa\s*[:\-–]?\s*([\d.]+\s*(?:UW|unweighted|uw)?\s*\/?\s*[\d.]*\s*(?:W|weighted|w)?)/i);
  return m ? m[0].replace(/^gpa\s*[:\-–]?\s*/i, '').trim() : null;
}
function extractMajor(text) {
  const m = text.match(/\b(?:intended\s+)?major(?:\(s\))?s?\s*[:\-–]?\s*([^\n]{3,80})/i);
  return m ? m[1].trim().replace(/^\*\*\s*/, '').replace(/\s*\*\*$/, '') : null;
}
function extractCountry(text) {
  const lower = text.toLowerCase();
  const map = {
    'India': ['india', 'indian'], 'China': ['china', 'chinese'],
    'Vietnam': ['vietnam', 'vietnamese'], 'South Korea': ['korea', 'korean'],
    'Turkey': ['turkey', 'turkish'], 'Pakistan': ['pakistan'],
    'Nigeria': ['nigeria'], 'Brazil': ['brazil'],
    'Hong Kong': ['hong kong'], 'Singapore': ['singapore'],
    'USA': ['domestic', 'u.s. citizen', 'us citizen'],
    'Bangladesh': ['bangladesh'], 'Nepal': ['nepal'],
    'Canada': ['canada', 'canadian'],
    'UK': ['united kingdom', 'british'],
  };
  for (const [country, kws] of Object.entries(map)) {
    for (const kw of kws) { if (lower.includes(kw)) return country; }
  }
  if (/\binternational\b/i.test(lower)) return 'International';
  return null;
}
function extractGender(text) {
  const m = text.match(/\bgender\s*[:\-–]?\s*(male|female|non[- ]?binary|nb|ftm|mtf)/i);
  return m ? m[1].trim() : null;
}
function extractRace(text) {
  const m = text.match(/\b(?:race|ethnicity)\s*[:\-–\/]?\s*([^\n,]{2,40})/i);
  return m ? m[1].trim() : null;
}
function extractDecisions(text) {
  const accepted = [], rejected = [], waitlisted = [];
  const lines = text.split('\n');
  let cat = null;
  
  for (const line of lines) {
    const lower = line.toLowerCase().trim();
    
    // Category headers
    if (/^#{1,3}\s*accept/i.test(line) || /^\*\*\s*accept/i.test(line) || lower === 'accepted' || lower === 'acceptances' || lower === 'acceptances:') { cat = 'a'; continue; }
    if (/^#{1,3}\s*reject/i.test(line) || /^\*\*\s*reject/i.test(line) || lower === 'rejected' || lower === 'rejections' || lower === 'rejections:') { cat = 'r'; continue; }
    if (/^#{1,3}\s*waitlist/i.test(line) || /^\*\*\s*waitlist/i.test(line) || lower === 'waitlisted' || lower === 'waitlists' || lower === 'waitlisted:') { cat = 'w'; continue; }
    if (/^#{1,3}\s*(?:other|decision|result|final|essay|ec|award|demo|academic|standard|letter|additional|hook)/i.test(line) || /^\*\*\s*(?:other|decision|result|final|essay)/i.test(line)) { cat = null; continue; }
    
    if (cat && lower.length > 2) {
      const cleaned = line.replace(/^[\s\-*\\•·]+/, '').trim();
      if (cleaned.length < 3) continue;
      if (cat === 'a') accepted.push(cleaned);
      else if (cat === 'r') rejected.push(cleaned);
      else if (cat === 'w') waitlisted.push(cleaned);
    }
    
    // Inline detection: "northwestern, rejected"
    if (!cat) {
      if (/,\s*rejected/i.test(lower)) { rejected.push(line.split(',')[0].trim()); }
      else if (/,\s*(?:accepted|admitted)/i.test(lower)) { accepted.push(line.split(',')[0].trim()); }
      else if (/,\s*waitlist/i.test(lower)) { waitlisted.push(line.split(',')[0].trim()); }
    }
  }
  return { accepted, rejected, waitlisted };
}

const profiles = [];
for (const post of allPosts) {
  const text = post.title + '\n' + post.selftext;
  const decisions = extractDecisions(text);
  const total = decisions.accepted.length + decisions.rejected.length + decisions.waitlisted.length;
  if (total === 0) continue;
  
  const postDate = new Date(post.created_utc * 1000);
  if (postDate.getFullYear() < 2024) continue;
  
  profiles.push({
    source_id: 'reddit_' + post.id,
    source_url: 'https://reddit.com' + post.permalink,
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
      gpa_raw: extractGPA(text),
      sat: extractSAT(text),
      act: extractACT(text),
      intended_major: extractMajor(text),
      accepted: decisions.accepted,
      rejected: decisions.rejected,
      waitlisted: decisions.waitlisted,
      needs_aid: /financial\s*aid/i.test(text) || /need[- ]based/i.test(text) || /full\s*ride/i.test(text),
    },
  });
}

const outFile = path.join(__dirname, 'data-pipeline', 'dataset_real.json');
fs.writeFileSync(outFile, JSON.stringify(profiles, null, 2));
console.log('\n=== RESULTS ===');
console.log('Parsed profiles: ' + profiles.length);

if (profiles.length > 0) {
  const withSAT = profiles.filter(function(p) { return p.extracted.sat; }).length;
  const withGPA = profiles.filter(function(p) { return p.extracted.gpa_raw; }).length;
  const withCountry = profiles.filter(function(p) { return p.extracted.country; }).length;
  console.log('With SAT: ' + withSAT + ', With GPA: ' + withGPA + ', With Country: ' + withCountry);
  
  profiles.slice(0, 5).forEach(function(p) {
    console.log('---');
    console.log('  Title: ' + p.post_title.substring(0, 70));
    console.log('  URL: ' + p.source_url);
    console.log('  Date: ' + p.post_date.substring(0, 10) + ', Score: ' + p.post_score);
    console.log('  SAT: ' + (p.extracted.sat || 'N/A') + ', GPA: ' + (p.extracted.gpa_raw || 'N/A'));
    console.log('  Major: ' + (p.extracted.intended_major || 'N/A'));
    console.log('  Accepted (' + p.extracted.accepted.length + '): ' + p.extracted.accepted.slice(0, 3).join(' | '));
    console.log('  Rejected (' + p.extracted.rejected.length + '): ' + p.extracted.rejected.slice(0, 3).join(' | '));
  });
}
console.log('\nSaved to: ' + outFile);
