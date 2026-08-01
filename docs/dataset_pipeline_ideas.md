# System Blueprint: Dataset Ingestion & Parsing Pipeline

This document provides a comprehensive technical blueprint for the design, architecture, and extraction processes of the independent data pipeline for Compass. The primary goal of this pipeline is to gather academic and admission profiles from social platforms (Reddit, Twitter/X, and LinkedIn) to train, refine, and calibrate the Compass admissions assessment and "chance-me" algorithms.

---

## 1. Executive Summary

Compass relies on highly accurate historical admissions data to assess students' profiles and estimate their admission chances. To feed and constantly improve these predictive algorithms, we require a scalable, automated pipeline that ingests real-world admissions data (grades, standardized test scores, extracurriculars, honors, and application outcomes).

To resolve the friction between **browser-automation needs** (evading bot detection, handling client-side JavaScript rendering) and **data-processing requirements** (robust schemas, LLM-based structuring, ETL), we establish a **two-tier architecture**:

```
 ┌────────────────────────────────────────────────────────┐
 │                   INGESTION TIER                       │
 │   - Stack: Node.js, Playwright Stealth, TypeScript    │
 │   - Responsibility: Fetching DOM, bypass anti-bots     │
 └──────────────────────────┬─────────────────────────────┘
                            │
                            ▼ Writes Raw HTML / JSONL Snapshots
 ┌────────────────────────────────────────────────────────┐
 │                 OBJECT STORAGE (S3/Supabase)           │
 │   - Storage: Compressed JSONL files                    │
 │   - Purpose: Permanent audit trail, replay capability  │
 └──────────────────────────┬─────────────────────────────┘
                            │
                            ▼ Reads Raw Snapshots
 ┌────────────────────────────────────────────────────────┐
 │                    PARSER TIER                         │
 │   - Stack: Python 3.11+, Pydantic, Instructor, BS4    │
 │   - Responsibility: Structuring data, LLM parsing, db  │
 └──────────────────────────┬─────────────────────────────┘
                            │
                            ▼ Writes Parsed Profiles
 ┌────────────────────────────────────────────────────────┐
 │                    DATABASE TIER                       │
 │   - Storage: PostgreSQL (Supabase) `scraped_profiles`  │
 │   - Security: Row Level Security (RLS) + Sanitized PII │
 └────────────────────────────────────────────────────────┘
```

1. **Ingestion Tier (Node.js)**: A stateless, queue-driven browser-automation service running Playwright with stealth plugins. It bypasses auth walls, handles rate limits, and writes the raw HTML or JSON payloads directly to object storage.
2. **Parser Tier (Python)**: Reads raw HTML/JSON files from storage, cleans the markup using lightweight parsers, extracts structured fields using LLM-assisted pipelines (`instructor` + Claude 3.5 Haiku), validates them against Pydantic definitions, and writes sanitized records to PostgreSQL.

---

## 2. Platform-Specific Ingestion & Parsing Blueprints

### 2.1. Reddit Ingestion Blueprint (r/ApplyingToCollege, r/IntltoUSA)

Reddit is a rich source of user-reported academic profiles, particularly in subreddits dedicated to university applications.

*   **DOM Structure Verification**: Reddit's modern "Shreddit" architecture relies on custom Web Components (prefixed with `shreddit-` and `faceplate-`). The DOM hides data inside shadow roots and custom slots. Traditional scrapers looking for default `div` structures fail.
*   **Playwright Shadow DOM Piercing**: Playwright's locator engine natively pierces Shadow DOMs without inject-scripts. We can query custom elements directly using:
    ```typescript
    const posts = page.locator('shreddit-post');
    const title = posts.locator('h1[slot="title"]');
    const textBody = posts.locator('div[slot="text-body"] .md');
    ```
*   **Request Interception (Proxy Bandwidth Optimization)**: To lower residential proxy bandwidth consumption by over 85%, we block non-essential assets like images, videos, fonts, CSS files (optional, depending on anti-bot rules), and tracking scripts:
    ```typescript
    await page.route('**/*', (route) => {
      const resourceType = route.request().resourceType();
      if (['image', 'media', 'font', 'stylesheet'].includes(resourceType)) {
        route.abort();
      } else {
        route.continue();
      }
    });
    ```
*   **Anti-Bot & Turnstile CAPTCHA Evasion**: Unauthenticated requests are subject to strict rate limiting. We use a **rotating residential proxy network** to assign a new IP to each browser instance. When Cloudflare Turnstile triggers, we catch the challenge frame, route the sitekey to a solver API (e.g., 2Captcha/CapSolver), receive the solved token, and inject it programmatically to bypass the block.

### 2.2. Twitter / X Ingestion Blueprint

Twitter/X is a major platform for admissions results threads, but it is highly hostile to scrapers.

*   **Login Wall Detection**: X blocks all search and profile routes behind a login wall, redirecting requests to `/i/flow/login`.
*   **Burner Account Session Rotation**: Ingestion requires authentication. We maintain a pool of 20+ aged "burner" accounts. During orchestration, the scraper rotates through these accounts, loads their corresponding session cookies, and injects them into the Playwright browser context.
*   **Human Behavior Simulation**: To prevent rapid account suspensions, we simulate human interaction patterns:
    *   **GhostCursor**: We use `ghost-cursor` to generate organic, non-linear mouse paths (Bézier curves) across elements.
    *   **Jitter Delays**: Clicks and keypress events are padded with random delays (`sleep(random(1500, 4500))`).
    *   **Session Warming**: Accounts are warmed by occasionally performing actions like liking tweets or scrolling random feeds.
*   **Automated Health Checks**: Before launching an ingestion job, we test account cookies against a lightweight API endpoint (e.g., `/i/api/1.1/guide.json`). If the response indicates authorization failure, the account is flagged as "Needs Re-auth", removed from the active rotation pool, and a webhook alert (e.g., Slack) is dispatched.
*   **Hybrid Commercial Fallback**: Due to high account burn rates, the pipeline maintains a failover routing switch. If active burner account counts drop below a threshold, the orchestrator delegates requests to commercial scraping services (Apify/ScrapingBee) to prevent operational downtime.

### 2.3. LinkedIn Ingestion Blueprint

LinkedIn contains professional and academic profiles but represents the highest legal and technical risk.

*   **Direct Scraping Ban Rationale**: Direct server-side scraping of LinkedIn is strictly prohibited. LinkedIn aggressively blocks IPs, restricts accounts within minutes, and pursues legal enforcement (violating LinkedIn User Agreement). Additionally, storing public PII without explicit consent exposes the product to GDPR/CCPA compliance risks.
*   **User-Initiated Ingestion Flow**: Compass circumvents direct LinkedIn scraping for logged-in users by utilizing an intake wizard:
    1.  **Copy-Paste Profile Text**: The user navigates to their profile page, presses `Ctrl+A` -> `Ctrl+C`, and pastes the plain text into a text area on the Compass onboarding page.
    2.  **PDF Resume Upload**: The user uploads their exported LinkedIn PDF resume.
    This unstructured text is passed directly to the Python parser tier. It eliminates scraping infrastructure, proxy costs, account ban risks, and operates with explicit user consent.
*   **Discovery Data Enrichment Fallback**: For aggregate, non-user-initiated research data (e.g. compiling benchmarks of historical applicants), Compass delegates lookup queries to **Proxycurl API** ($0.01 per profile). This guarantees legal isolation and 100% data delivery uptime without engineering overhead.

---

## 3. Mock DOM Snippets

To ensure parser logic robustness, here are the mock HTML structures the parser tier targets:

### 3.1. Reddit Stats Post (r/ApplyingToCollege)
```html
<shreddit-post 
  id="t3_123456" 
  author="college_applicant_2026" 
  score="45" 
  comment-count="23"
  post-title="Decision Roll Call / Stats Post for Intl Student"
  permalink="/r/ApplyingToCollege/comments/123456/decision_roll_call_stats_post_for_intl_student/"
  class="relative flex flex-col"
>
  <div slot="header" class="flex items-center text-neutral-content">
    <span class="text-xs">Posted by u/college_applicant_2026</span>
    <time datetime="2026-06-15T14:30:00.000Z">8 days ago</time>
  </div>

  <h1 slot="title" id="post-title-t3_123456" class="text-xl font-bold">
    Decision Roll Call / Stats Post for Intl Student
  </h1>

  <div slot="text-body" class="text-neutral-content-strong text-14 feed-card-text-preview">
    <div class="md">
      <p>Here are my stats for US/UK applications this year!</p>
      
      <h2>Demographics</h2>
      <ul>
        <li><strong>Gender:</strong> Male</li>
        <li><strong>Race/Ethnicity:</strong> Asian</li>
        <li><strong>Residence:</strong> India (International)</li>
        <li><strong>Income:</strong> ~$40k (Needs financial aid)</li>
        <li><strong>School Type:</strong> Highly competitive private school</li>
      </ul>

      <h2>Academics</h2>
      <ul>
        <li><strong>GPA:</strong> 97/100 (Unweighted)</li>
        <li><strong>Curriculum:</strong> CBSE (Indian National Board)</li>
        <li><strong>Standardized Tests:</strong> SAT: 1540 (760 EBRW, 780 Math), APs: 5 on Calculus BC</li>
      </ul>

      <h2>Decisions</h2>
      <ul>
        <li><strong>Acceptances:</strong> Georgia Tech (CS), University of Wisconsin-Madison (CS)</li>
        <li><strong>Rejections:</strong> MIT (Early Action), Stanford (Regular Decision)</li>
      </ul>
    </div>
  </div>
</shreddit-post>
```

### 3.2. Twitter / X Tweet
```html
<article data-testid="tweet" role="article" tabindex="0" class="css-175oi2r r-1loqt21 r-16y2u6a">
  <div class="css-175oi2r">
    <!-- User Info Header -->
    <div class="css-175oi2r r-1wbh5a2 r-18u37iz r-1w6e6d8">
      <div data-testid="User-Name" class="css-175oi2r r-1awozwy r-18u37iz r-1wbh5a2">
        <a href="/johndoe_apps" role="link" class="css-175oi2r">
          <span class="css-1q9goqc">John Doe (A2C)</span>
        </a>
        <span class="css-901oao r-18u37iz">@johndoe_apps</span>
      </div>
    </div>

    <!-- Tweet Content -->
    <div data-testid="tweetText" class="css-901oao r-18jsz2b r-37j5jr r-a023e6 r-16dba41">
      <span class="css-901oao css-16my406">
        COLLEGE RESULTS 2026 THREAD 🎓🇺🇸<br><br>
        Intl (Vietnam), CS Major, Aid needed.<br>
        GPA: 9.8/10 (Valedictorian)<br>
        SAT: 1560 (800M/760ERW)<br><br>
        ACCEPTED: <br>
        - Amherst College (Full Ride! 💸)<br><br>
        REJECTED: <br>
        - Harvard (REA)
      </span>
    </div>
  </div>
</article>
```

### 3.3. LinkedIn Public Profile
```html
<main class="core-rail">
  <!-- Hero Card Section -->
  <section class="top-card-layout border-bottom">
    <div class="top-card-layout__card">
      <div class="top-card-layout__entity-info">
        <h1 class="top-card-layout__title font-sans text-xl font-bold">Jane Nguyen</h1>
        <h2 class="top-card-layout__headline text-md text-neutral-light">
          Incoming Freshman at Stanford University | IB Diploma (44/45)
        </h2>
        <div class="top-card-layout__first-subline text-sm">Ho Chi Minh City, Vietnam</div>
      </div>
    </div>
  </section>

  <!-- Experience Section -->
  <section class="experience section-layout" id="experience-section">
    <h2 class="section-title">Experience</h2>
    <ul class="experience-list">
      <li class="experience-item">
        <div class="experience-item__details">
          <h3 class="experience-item__title font-bold text-sm">Software Engineering Intern</h3>
          <p class="experience-item__subtitle text-xs">VNG Corporation</p>
          <span class="experience-item__duration text-xs">Jun 2025 - Aug 2025 (3 mos)</span>
        </div>
      </li>
    </ul>
  </section>

  <!-- Education Section -->
  <section class="education section-layout" id="education-section">
    <h2 class="section-title">Education</h2>
    <ul class="education-list">
      <li class="education-item">
        <div class="education-item__details">
          <h3 class="education-item__school-name font-bold text-sm">British International School Ho Chi Minh</h3>
          <p class="education-item__degree-title text-xs">International Baccalaureate (IB)</p>
          <span class="education-item__duration text-xs">2022 - 2026</span>
        </div>
      </li>
    </ul>
  </section>
</main>
```

---

## 4. Storage & Database Schema Specifications

### 4.1. Raw Storage Tier
Raw scraped content (full HTML snapshots, API JSON responses) is preserved directly to ensure auditability, debugging, and parsing replayability.
*   **Service**: Supabase Storage / AWS S3
*   **Format**: Compressed JSON Lines (`JSONL` or `.json.gz`)
*   **Pathing Convention**: `raw_scrapes/{platform}/{year}-{month}-{day}/{item_id}.json.gz`
    *(Example: `raw_scrapes/reddit/2026-06-23/t3_123456.json.gz`)*

### 4.2. Database DDL Schema (PostgreSQL)
Parsed and structured profiles are inserted into the database. PII (usernames, social handles, precise location coordinates) is sanitized from the public-facing application layers using strict Row Level Security (RLS) policies.

```sql
-- DDL for scraped_profiles table
CREATE TABLE IF NOT EXISTS scraped_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_platform VARCHAR(50) NOT NULL,                 -- 'reddit' | 'twitter' | 'linkedin'
    source_id VARCHAR(255) NOT NULL,                       -- Unique identifier (e.g., post ID, tweet ID)
    raw_storage_path VARCHAR(512),                         -- Pointer to file in S3/Supabase Storage
    parsed_profile JSONB NOT NULL,                         -- JSON payload mapping to StudentProfileInput
    extracted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    parser_version VARCHAR(50) NOT NULL,                  -- Version tag of the parsing schema/prompt
    metadata JSONB,                                        -- Engagement stats (likes, views, retweets)
    CONSTRAINT unique_source_item UNIQUE(source_platform, source_id)
);

-- Indexing for high-performance query lookups
CREATE INDEX IF NOT EXISTS idx_scraped_profiles_platform_id 
    ON scraped_profiles(source_platform, source_id);
    
CREATE INDEX IF NOT EXISTS idx_scraped_profiles_extracted 
    ON scraped_profiles(extracted_at);

-- Enable Row Level Security (RLS)
ALTER TABLE scraped_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service-role to perform all CRUD operations
CREATE POLICY service_role_all_access ON scraped_profiles
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Policy: Restrict public read access to anonymized records only
CREATE POLICY public_anonymized_read_only ON scraped_profiles
    FOR SELECT
    TO anon, authenticated
    USING (
        (parsed_profile->>'is_anonymized')::BOOLEAN = true 
        AND (parsed_profile->>'pii_redacted')::BOOLEAN = true
    );
```

---

## 5. Structured Data Mapping Matrix

The parser maps raw extracted fields into the Compass `StudentProfileInput` schema structure (`lib/types.ts`).

| Social Media Raw Field | Compass Target Field (`StudentProfileInput`) | Type | Parsing Strategy & Transformations |
| :--- | :--- | :--- | :--- |
| **Demographics: Residence** | `country` | `string` | Regex/LLM extracts the country (e.g., "Vietnam", "India"). Maps to standard ISO-3166 strings. |
| **Demographics: Citizenship** | `citizenship` | `string` | Extracts citizenship details if mentioned (e.g., "US Citizen", "Dual"). |
| **Target Majors** | `majors` | `string[]` | Normalizes text to target major listings (e.g., "CS Major" -> `["Computer Science"]`). |
| **Application Outcomes** | `destinations` | `Array<{school_id, status}>` | Filters university names under "Accepted" / "Rejected". Resolves school names to standard IDs via fuzzy match. |
| **Academic Curriculum** | `curriculum` | `enum` | Categorizes to `'IB' \| 'A-Level' \| 'national' \| 'US-GPA' \| 'other'`. |
| **High School GPA** | `grades.raw` & `grades.gpa` | `string` & `number` | Store original text in `grades.raw` (e.g., "9.8/10", "97/100"). Parse numeric normalized scale value into `grades.gpa`. |
| **IB Diploma Points** | `grades.ib_total` | `number` | Extracts numeric total score (e.g., "44/45" -> `44`) when curriculum is "IB". |
| **SAT Score** | `tests.sat` | `object` | Match pattern `SAT:\s?(\d{4})` or breakdown `Math: (\d{3}), EBRW: (\d{3})`. Validate constraints (1600 max, 400 min). |
| **ACT Score** | `tests.act` | `number` | Extracts composite score (e.g., "ACT: 35" -> `35`). Max value capped at 36. |
| **AP Score List** | `tests.aps` | `Array<{subject, score}>` | Parses subject name and scores (e.g., "5 on Calc BC" -> `{subject: "Calculus BC", score: 5}`). |
| **Extracurricular Activities** | `activities` | `Array<{position, organization, description, duration}>` | LLM tokenizes and maps bullet lists to structured activity objects. |
| **Honors & Awards** | `honors` | `Array<{title, level}>` | Tokenizes list items, categorizes level to `'international' \| 'national' \| 'state' \| 'school'`. |
| **Financial Need Indicator** | `needs_aid` | `boolean` | Scans for terms like "Full Ride", "Need financial aid", "Requested aid". Sets flag to `true` or `false`. |

---

## 6. Directory Layout of the `/data-pipeline` Module

The standalone pipeline resides in the `/data-pipeline` root folder, isolated from the core Next.js application:

```
/data-pipeline/
├── README.md                  # Setup, dependencies, and execution guide
├── package.json               # Node.js dependencies (Playwright, TS compiler, ts-node)
├── requirements.txt           # Python dependencies (pydantic, instructor, beautifulsoup4, selectolax, supabase)
├── pyproject.toml             # Pytest and linter configuration details
├── config.yaml                # Shared proxy thresholds, burner pools, and API keys
├── ingestion/                 # Node.js Ingestion Tier (Ephemerally Scheduled Workers)
│   ├── src/
│   │   ├── index.ts           # Orchestrator runner (jobs scheduler)
│   │   ├── reddit-scraper.ts  # Reddit crawler script
│   │   ├── twitter-scraper.ts # Twitter scraper (cookie context loader, GhostCursor)
│   │   └── utils/
│   │       ├── proxy.ts       # Proxy connection and rotation helper
│   │       └── auth-session.ts # Session validator & rotating cookie pool manager
│   └── tests/                 # Playwright script testing
├── parser/                    # Python Parsing & Validation Tier (ETL Engine)
│   ├── src/
│   │   ├── __init__.py
│   │   ├── main.py            # Reads raw data from S3/JSONL and coordinates LLM parser
│   │   ├── extractors/
│   │   │   ├── reddit_parser.py  # Cleans Reddit markup and builds prompts
│   │   │   ├── twitter_parser.py # Processes tweet threads and text streams
│   │   │   └── resume_parser.py  # Handles client profile text pastes and PDFs
│   │   ├── models/
│   │   │   └── profile_schema.py # Pydantic model for validation & Instructor matching
│   │   └── utils/
│   │       ├── db.py          # Database operations (Supabase connector)
│   │       └── llm.py         # Anthropic SDK wrapper using Instructor
│   └── tests/                 # Pytest suite for models and extraction logic
└── shared/
    └── schemas/
        └── student_profile.json # Compiled JSON Schema of StudentProfileInput
```

### 6.1. Vercel Exclusion Details
To prevent Vercel from attempting to bundle heavy Python binaries, Playwright libraries, or Chromium packages during standard Next.js deployments, the `/data-pipeline` directory must be excluded in the `.vercelignore` file at the project root:

```text
# .vercelignore
data-pipeline/
```

---

## 7. Data Integrity & Validation Safeguards

AI hallucinations present a severe threat to benchmark dataset reliability. To guarantee premium quality, we enforce three levels of programmatic validation:

### 7.1. Pydantic Structural Validation
The Python parser tier forces the LLM to output structural JSON matching the `StudentProfileInput` schema. Pydantic validates field constraints (e.g. SAT scores must be divisible by 10 and in the range `[400, 1600]`; ACT scores must be integers between `1` and `36`). Any failure immediately shunts the profile into a manual triage queue.

### 7.2. Citation Validation (Verifiability Check)
To ensure the LLM does not fabricate credentials, the prompt structure requires it to populate a corresponding `rationale` citation object for each extracted metric. This citation must contain a verbatim quote directly from the raw content.

```json
{
  "sat": {
    "score": 1540,
    "quote": "SAT: 1540 (760 EBRW, 780 Math)"
  },
  "curriculum": {
    "value": "national",
    "quote": "Curriculum: CBSE (Indian National Board)"
  }
}
```

### 7.3. Cross-Reference Checking
A post-processing script executes an automated string alignment check:
1.  It retrieves the `quote` field from the LLM response.
2.  It verifies that the quote exists verbatim (allowing minor whitespace normalization) within the original raw text body/HTML.
3.  If a quote cannot be found in the raw text, the record is flagged as a potential hallucination and rejected from database insertion.
