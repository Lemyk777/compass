# Guided Thread Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn Compass from a library a confused student must navigate into a guided thread that accompanies them on every screen — learning who they are from reactions to concrete work, naming the majors that were missing from the chain, and putting a job simulation two clicks from the doubt that motivates it.

**Architecture:** Three streams. **A (majors)** adds a new registry, a new guide step, and a new plan-pick kind — entirely self-contained. **B (thread)** adds a reaction registry, one migration, and a pure station function that absorbs the existing `nextMove` ladder. **C (companion)** is the UI that renders B on every page, and it consumes both. A and B are fully parallel and touch no shared file; C starts when both land. Every derived fact stays derived — the only new stored fact in the whole release is a reaction row.

**Tech Stack:** Next.js 14 App Router (RSC + server actions), TypeScript strict, Tailwind, Supabase (Postgres + RLS), `node:test` via `npm run test:unit`.

**Design of record:** [`docs/superpowers/specs/2026-08-15-guided-thread-design.md`](../specs/2026-08-15-guided-thread-design.md). Read §1 before starting — it is the verified state of what ships today.

---

## Global Constraints

Every task's requirements implicitly include this section. These are the repository's own rules, copied from `CLAUDE.md` and the spec; each one is a bug this codebase has already shipped.

- **Branching:** `main` is production and protected. Branch from `develop`, PR back into `develop`. Never commit to `main`.
- **Never run `npm run build` while `npm run dev` is running.** They share `.next/`; the dev server then dies with `Cannot find module './NNNN.js'`, which is not a code bug. Stop dev first.
- **Bundle rule:** `key-dates.ts` builds a map over ~2,700 catalog rows at module load; `careers.ts`, `world.ts`, `study-destinations.ts` and `spine.ts` are ~4,000 lines of prose and server-only in practice. **No client component may import any of them at runtime.** Type-only imports are free. Server-render and pass down as props or nodes — the pattern `PlannerWindow` already uses for `nextMove` and `mapsLens`.
- **Colour:** tokens only, channel triplets, never hex. `text-accent` is a fill, not a foreground — use `text-accent-ink`. Filled primary is `bg-cta text-cta-ink`, never `bg-ink`. Focus is `focus-visible:focus-ring`, never a hardcoded ring offset.
- **Classes:** merge caller `className` with `cn` from `lib/utils.ts`, never a template string. No `!` Tailwind escapes. `eslint-plugin-tailwindcss` fails the build on any class Tailwind cannot generate.
- **Type:** 11px floor everywhere. Body tracking comes from `--type-tracking-body`; do not set tracking on body copy.
- **Motion:** `transform` and `opacity` only. No animated `filter: blur`. Closed loops (`0%` == `100%`). `MotionSafe` mounts **inside** a component that already imports framer, never in a shell. **No entrance animation on anything the companion says.**
- **Prose registries:** no prices, no salaries, no rankings, no superlatives. No URLs — the catalog owns links because `npm run test:links` is what keeps them alive.
- **Server actions are public HTTP endpoints.** Validate in the action, not only in the form. Never accept an href from the caller.
- **Migrations are applied by hand** in the Supabase SQL editor. After adding one, tell the user to run it, and add its columns to `scripts/check-schema.ts` **in the same commit**.
- **Gate for every task:** `npm run lint` and `npx tsc --noEmit` must pass; `npm run test:unit` must pass. Full `npm run build` at the end of each stream.
- **Commit style:** conventional commits (`feat(majors):`, `test(thread):`, `fix(companion):`). Commit at every step marked Commit. Many small commits are wanted.

---

## File Structure

### Stream A — the majors layer

| File | Responsibility |
|---|---|
| `lib/data/majors.ts` | **Create.** The registry (~50 entries) + pure selectors. Prose, server-only in practice. Imports types only. |
| `lib/data/guide-sections.ts` | **Modify.** Add the `majors` step; renumber places/cities/from-home to 3/4/5. |
| `lib/data/plan-picks.ts` | **Modify.** `PickKind` gains `"major"`; `PICK_KINDS` gains its meta; `pickHref` gains one case; `PickCounts` gains the key. |
| `app/guide/majors/(list)/page.tsx` | **Create.** The list. |
| `app/guide/majors/(list)/loading.tsx` | **Create.** The skeleton, scoped to the list only. |
| `app/guide/majors/[major]/page.tsx` | **Create.** The subject page. |
| `lib/data/spine.ts` | **Modify.** A `majors` field on `SpineStop`'s parent — the chain gains the study step. |
| `app/sitemap.ts` | **Modify.** List the new step and its subject pages. |

### Stream B — the reaction engine and the thread

| File | Responsibility |
|---|---|
| `lib/data/beats.ts` | **Create.** ~24 concrete moments of work, fixed weights, pure scoring, and the observation sentence. Pure; safe in a client bundle. |
| `supabase/migrations/0031_beat_reactions.sql` | **Create.** One table, RLS, grants. |
| `scripts/check-schema.ts` | **Modify.** Expect the new table. |
| `lib/planner/reactions.ts` | **Create.** Server-only, `cache()`d read of a student's reactions. |
| `lib/data/thread.ts` | **Create.** `station()` — pure, seven stations, derived from stored facts only. |
| `lib/data/next-move.ts` | **Modify.** Two new branches (`pick-major`, `try-it`); exported signature unchanged. |

### Stream C — the companion

| File | Responsibility |
|---|---|
| `lib/companion/load.ts` | **Create.** Server-only. Gathers facts, calls `station()` + `nextMove()`, returns a serialisable view. Reaches heavy registries through dynamic `import()`. |
| `components/companion/Companion.tsx` | **Create.** Client. Rail on desktop, dock on mobile. Holds only open/collapsed state. |
| `components/companion/BeatPair.tsx` | **Create.** Client. The two cards and the three answers. |
| `app/companion/actions.ts` | **Create.** `recordReaction`, `dismissCompanion`. |
| `components/student/StudentShell.tsx` | **Modify.** Mount the companion, server-rendered content passed as a node. |
| `app/planner/page.tsx` | **Modify.** The planner reads the same thread; `NextMoveCard` unchanged. |
| `components/onboarding/sections.tsx` | **Modify.** The free-text major box becomes a registry choice plus "I don't know". |

---

# STREAM A — the majors layer

Independent. Can run start-to-finish with no knowledge of Streams B or C.

---

### Task A1: The majors registry and its selectors

**Files:**
- Create: `lib/data/majors.ts`
- Test: `scripts/test-engine.ts` (append a new section)

**Interfaces:**
- Consumes: `FacultyValue` from `lib/data/faculties.ts`; `areaSlug`, `areaBySlug`, `allCareerAreas` from `lib/data/careers.ts` (tests only — the registry itself imports types only).
- Produces:
  - `type Major`
  - `const MAJORS: Major[]`
  - `function majorById(id: string): Major | undefined`
  - `function majorsForFaculties(faculties: FacultyValue[]): Major[]` — **empty in ⇒ all**
  - `function majorsByField(faculties: FacultyValue[]): { faculty: FacultyValue; majors: Major[] }[]`
  - `function majorsForArea(slug: string): Major[]`

- [ ] **Step 1: Write the failing tests**

Append to `scripts/test-engine.ts`. Add the import beside the other registry imports at the top:

```ts
import {
  MAJORS,
  majorById,
  majorsByField,
  majorsForArea,
  majorsForFaculties,
} from "@/lib/data/majors";
```

Then append this section at the end of the file:

```ts
// ── Majors ───────────────────────────────────────────────────────────────────
// The layer that was missing from the chain entirely: a student could learn what
// work exists and where it lives, and never find out what you actually apply to.
// Held to the same rules as every other prose registry here.

test("every major has a unique id, a name, and belongs to a field", () => {
  const ids = new Set<string>();
  assert.ok(MAJORS.length >= 40, "the majors layer is too thin to be a step");
  for (const m of MAJORS) {
    assert.ok(!ids.has(m.id), `duplicate major id ${m.id}`);
    ids.add(m.id);
    assert.match(m.id, /^[a-z0-9][a-z0-9-]{0,63}$/, `${m.id} is not a slug`);
    assert.ok(m.name.trim().length > 2, `${m.id} has no name`);
    assert.ok(m.fields.length > 0, `${m.id} belongs to no field`);
  }
});

test("every major says what it actually is, what the first year is, and what school subjects it needs", () => {
  for (const m of MAJORS) {
    assert.ok(
      m.whatItActuallyIs.trim().length > 60,
      `${m.id} does not say what it actually is`,
    );
    // The field nobody writes down, and the reason half of first years leave.
    assert.ok(
      m.firstYear.trim().length > 120,
      `${m.id} does not say what the first year is really made of`,
    );
    assert.ok(
      m.schoolSubjects.length > 0,
      `${m.id} names nothing a student could start today`,
    );
  }
});

test("every major states its catch and who should look elsewhere", () => {
  const catches = new Set<string>();
  const avoid = new Set<string>();
  for (const m of MAJORS) {
    assert.ok(
      m.catch.trim().length > 100,
      `${m.id} has no catch — that is a brochure`,
    );
    assert.ok(
      m.suitsYou.trim().length > 100,
      `${m.id} does not say who it suits`,
    );
    assert.ok(
      m.notForYou.trim().length > 140,
      `${m.id} does not name who should look somewhere else`,
    );
    catches.add(m.catch.trim());
    avoid.add(m.notForYou.trim());
  }
  assert.equal(catches.size, MAJORS.length, "two majors share one catch");
  assert.equal(avoid.size, MAJORS.length, "two majors warn off the same person");
});

test("no major quotes a price, a salary or a ranking", () => {
  const forbidden =
    /(\$|€|£|₸|\bUSD\b|\bEUR\b|\bper month\b|\bper year\b|\brank(ed|ing)? (?:#|no\.?\s?)\d|\btop \d+\b|\bbest\b|\bleading\b|\bprestigious\b)/i;
  for (const m of MAJORS) {
    for (const [field, text] of Object.entries(m)) {
      if (typeof text !== "string") continue;
      assert.ok(
        !forbidden.test(text),
        `${m.id}.${field} quotes a figure, ranking or superlative: ${text.slice(0, 80)}`,
      );
    }
  }
});

test("no major carries a URL — the catalog owns links", () => {
  const src = readFileSync(
    path.join(process.cwd(), "lib/data/majors.ts"),
    "utf8",
  );
  assert.ok(
    !/https?:\/\//.test(stripComments(src)),
    "majors.ts contains a URL; test:links only knows about the catalog",
  );
});

test("the chain does not break: every major leads to a real area, and every area is reachable", () => {
  const areaSlugs = new Set(
    allCareerAreas().map(({ area }) => areaSlug(area.title)),
  );
  const reached = new Set<string>();
  for (const m of MAJORS) {
    assert.ok(m.leadsTo.length > 0, `${m.id} leads to no work at all`);
    for (const slug of m.leadsTo) {
      assert.ok(
        areaSlugs.has(slug),
        `${m.id} points at a missing area of work: ${slug}`,
      );
      reached.add(slug);
    }
  }
  for (const slug of areaSlugs) {
    assert.ok(
      reached.has(slug),
      `no major leads to ${slug} — the student reaches a dead end there`,
    );
  }
});

test("majors: empty fields in ⇒ every major; a chosen field never widens it", () => {
  assert.equal(majorsForFaculties([]).length, MAJORS.length);
  const cs = majorsForFaculties(["computer_science"]);
  assert.ok(cs.length > 0 && cs.length <= MAJORS.length);
  assert.ok(cs.every((m) => m.fields.includes("computer_science")));
});

test("majorById and majorsForArea resolve, and unknown ids return nothing", () => {
  assert.equal(majorById(MAJORS[0].id)?.id, MAJORS[0].id);
  assert.equal(majorById("no-such-major"), undefined);
  const slug = MAJORS[0].leadsTo[0];
  assert.ok(majorsForArea(slug).some((m) => m.id === MAJORS[0].id));
  assert.deepEqual(majorsForArea("no-such-area"), []);
});

test("majorsByField groups in the order given and drops empty fields", () => {
  const groups = majorsByField(["computer_science", "law"]);
  assert.equal(groups[0].faculty, "computer_science");
  assert.ok(groups.every((g) => g.majors.length > 0));
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test:unit
```

Expected: FAIL — `Cannot find module '@/lib/data/majors'`.

- [ ] **Step 3: Write the registry**

Create `lib/data/majors.ts`. Header, type and selectors are complete; the entries are the content work.

```ts
import type { FacultyValue } from "@/lib/data/faculties";

// WHAT YOU ACTUALLY APPLY TO.
//
// The guide could say what kinds of work exist, which countries host them and
// which cities inside those countries — and never once named the thing a
// student fills in on a form. A field of study is eight buckets; an area of work
// is a sphere; the MAJOR is the row on the application, and it was missing from
// the chain entirely. "What major do you want to study?" was an 80-character
// free-text box asked of people who came to us precisely because they cannot
// answer it.
//
// FOUR RULES, and three of the fields exist because nobody writes them down:
//
// 1. **`alsoCalled` is mandatory wherever the name is not self-evident.** One
//    subject is taught under three names across the countries we profile, and a
//    student who does not know that cannot tell they are looking at the same
//    door twice.
// 2. **`firstYear` says what the first year is REALLY made of** — not "you will
//    study the foundations". The first year is where people leave, and the
//    reason they leave is almost never the reason the prospectus implies.
// 3. **`schoolSubjects` is the only thing on the page that can be started
//    today.** Everything else here is about a decision years away; this is an
//    action available this afternoon.
// 4. **`catch` and `notForYou` are mandatory**, the same rule cities, countries
//    and areas of work are already held to. A layer with no catch is a brochure,
//    and a unit test enforces both halves.
//
// No prices, no salaries, no rankings, no URLs — same reasons as `world.ts` and
// `careers.ts`. Figures rot within a year; shape does not. Prose, and server-only
// in practice: import labels through a thin module if a client ever needs them,
// the way `career-titles.ts` serves the interest quiz.

export type Major = {
  /** The URL slug, and the second half of a `major:` plan pick ref. */
  id: string;
  name: string;
  /**
   * The other names this same subject is taught under. Mandatory wherever the
   * name is not self-evident — a student who does not know that "informatics"
   * and "computer science" are one door cannot see that they already found it.
   */
  alsoCalled: string[];
  /** One sentence, no jargon. What the subject IS, not what it leads to. */
  whatItActuallyIs: string;
  /**
   * What the first year is actually made of, and what makes people leave in it.
   * The single most useful paragraph on the page, and the one no prospectus
   * contains.
   */
  firstYear: string;
  /** The honest cost. Mandatory. Not "it is hard" — the specific thing. */
  catch: string;
  /** Who this suits, addressed to the reader, specific enough to recognise. */
  suitsYou: string;
  /** Who should look elsewhere, and ideally where. Mandatory. */
  notForYou: string;
  /**
   * School subjects that actually matter for admission and for surviving year
   * one. The only actionable thing on the page.
   */
  schoolSubjects: string[];
  /**
   * An honest hard exclusion, or null. "Without strong mathematics this door is
   * shut" is kinder said now than discovered in year one.
   */
  hardGate: string | null;
  /** Areas of work this opens, by `areaSlug`. Every one must resolve. */
  leadsTo: string[];
  /** The fields this sits under — the join to countries, cities and the catalog. */
  fields: FacultyValue[];
};

export const MAJORS: Major[] = [
  {
    id: "computer-science",
    name: "Computer science",
    alsoCalled: [
      "Informatics",
      "Computing",
      "CS",
      "Applied mathematics and informatics",
    ],
    whatItActuallyIs:
      "The study of what can be computed and how — algorithms, data, languages and machines — rather than training in any particular programming tool.",
    firstYear:
      "Discrete mathematics, proofs and one or two programming languages taught from the ground up, and it is the mathematics rather than the programming that thins the year out. Most people arrive able to write code and discover that the course is not about writing code; the ones who leave usually leave because nobody warned them that a term of induction proofs and asymptotic analysis comes before anything that looks like an app.",
    catch:
      "The gap between the degree and the job is wider than in almost any other subject: a graduate who has never built anything outside coursework competes badly against one who has, and the course does not require you to build anything outside coursework. The work of becoming employable happens in your own time, alongside the degree, and nobody makes you do it.",
    suitsYou:
      "You are willing to be a beginner at mathematics again for a year, and you already build things nobody asked you to build. You would rather understand why a method works than collect a list of tools that currently work.",
    notForYou:
      "You want to make software and have no appetite for the theory underneath it. Software engineering and information systems degrees reach the same jobs with far less proof-writing, and in several of the countries we profile they are the more direct route into a first role.",
    schoolSubjects: ["Mathematics", "Physics or informatics", "English"],
    hardGate:
      "Strong mathematics is not optional here. Every country we profile screens on it, and the first year assumes it.",
    leadsTo: [
      "building-software-and-products",
      "data-and-ai",
      "security-and-systems",
    ],
    fields: ["computer_science"],
  },
  {
    id: "civil-engineering",
    name: "Civil engineering",
    alsoCalled: ["Structural engineering", "Construction engineering"],
    whatItActuallyIs:
      "Designing and building the things a place is made of — bridges, water systems, roads, foundations — and proving they will stand up before anyone builds them.",
    firstYear:
      "Statics, materials and a great deal of drawing, taught alongside the mathematics that supports them. The surprise is how much of the year is spent on things that do not move: understanding how a load travels through a structure standing still is the whole foundation, and it is far less immediately satisfying than the buildings that attracted people to the subject.",
    catch:
      "The profession is licensed almost everywhere, and a licence earned in one country frequently does not travel. That makes this one of the few subjects where the country you study in largely decides the country you can practise in — a constraint most students meet years too late to act on.",
    suitsYou:
      "You want the thing you worked on to exist physically and outlast you, and you can accept that a career is measured in projects that take years rather than in releases that take weeks.",
    notForYou:
      "You expect to move country freely after graduating. Licensing rarely transfers, and if mobility matters more to you than the built environment does, software, data or general mechanical work will not fence you in the same way.",
    schoolSubjects: ["Mathematics", "Physics"],
    hardGate: null,
    leadsTo: ["infrastructure-and-construction", "machines-and-manufacturing"],
    fields: ["engineering"],
  },
  // ── The remaining ~48 entries follow exactly this shape. ──────────────────
  //
  // WRITING RULES, enforced by the tests in scripts/test-engine.ts — write to
  // the tests, not to a word count:
  //
  //   * `firstYear` > 120 characters and must name what makes people leave.
  //   * `catch` > 100, `suitsYou` > 100, `notForYou` > 140 characters, and
  //     `notForYou` must name where to go instead.
  //   * `catch` and `notForYou` must be DISTINCT across the whole registry —
  //     fifty hand-written pairs is exactly the size at which one sentence gets
  //     pasted across a field and nobody notices.
  //   * No prices, salaries, rankings, superlatives or URLs, anywhere.
  //   * Every `leadsTo` slug must resolve against `areaSlug` in careers.ts, AND
  //     every one of the 33 areas must be reached by at least one major. Run
  //     `npm run test:unit` to find the ones nothing points at.
  //
  // COVERAGE: at least 40 entries, spread so that every one of the eight
  // faculties has majors and every area of work is reachable. The reachability
  // test is the real gate — it is what stops a student with an uncommon
  // interest walking into an empty room, which is the failure this layer exists
  // to fix.
];

/** One major by id. Undefined for anything unknown. */
export function majorById(id: string): Major | undefined {
  return MAJORS.find((m) => m.id === id);
}

/**
 * Majors under the chosen fields. **Empty in ⇒ all of them**, the same rule
 * `hubsForFaculties` follows and the same rule the catalog follows: an unstated
 * fact widens the list, it never empties it.
 */
export function majorsForFaculties(faculties: FacultyValue[]): Major[] {
  if (faculties.length === 0) return MAJORS;
  return MAJORS.filter((m) => m.fields.some((f) => faculties.includes(f)));
}

/**
 * The same list grouped by field, in the order the fields were given, empties
 * dropped. Grouping is how the list page stays readable at fifty entries.
 */
export function majorsByField(
  faculties: FacultyValue[],
): { faculty: FacultyValue; majors: Major[] }[] {
  const fields = faculties.length > 0 ? faculties : [];
  const source = fields.length > 0 ? fields : uniqueFields();
  return source
    .map((faculty) => ({
      faculty,
      majors: MAJORS.filter((m) => m.fields.includes(faculty)),
    }))
    .filter((g) => g.majors.length > 0);
}

/** Every field that at least one major sits under, in registry order. */
function uniqueFields(): FacultyValue[] {
  const seen: FacultyValue[] = [];
  for (const m of MAJORS) {
    for (const f of m.fields) if (!seen.includes(f)) seen.push(f);
  }
  return seen;
}

/**
 * The majors that open one area of work — the reverse edge, and the reason the
 * chain is walkable in both directions. A student who knows what they want to
 * DO can find what to study; a student who was handed a subject can find out
 * what it leads to.
 */
export function majorsForArea(slug: string): Major[] {
  return MAJORS.filter((m) => m.leadsTo.includes(slug));
}
```

- [ ] **Step 4: Run the tests until they pass**

```bash
npm run test:unit
```

Expected: PASS. The reachability test will name every area of work no major points at — that list is the writing worklist. Iterate until green.

- [ ] **Step 5: Type-check and lint**

```bash
npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add lib/data/majors.ts scripts/test-engine.ts
git commit -m "feat(majors): the layer between what you'd do and where you'd learn it"
```

---

### Task A2: Register majors as step 2 of the guide

**Files:**
- Modify: `lib/data/guide-sections.ts`
- Modify: `lib/data/plan-picks.ts`
- Test: `scripts/test-engine.ts`

**Interfaces:**
- Consumes: `MAJORS` from Task A1.
- Produces: `GuideSectionId` gains `"majors"`; `PickKind` gains `"major"`; `pickHref("major", id)` returns `/guide/majors/${id}`; `PickCounts` gains a `major` key.

- [ ] **Step 1: Write the failing tests**

Append to `scripts/test-engine.ts`:

```ts
test("the guide's steps are 1..N with no gaps, and majors sits between work and countries", () => {
  const steps = GUIDE_SECTIONS.map((s) => s.step);
  assert.deepEqual(
    steps,
    Array.from({ length: GUIDE_SECTIONS.length }, (_, i) => i + 1),
    "the guide's step numbers have a gap or a duplicate",
  );
  const order = GUIDE_SECTIONS.map((s) => s.id);
  assert.ok(
    order.indexOf("work") < order.indexOf("majors"),
    "you cannot choose what to study before knowing what the work is",
  );
  assert.ok(
    order.indexOf("majors") < order.indexOf("places"),
    "the major is what you apply WITH — it comes before the country",
  );
});

test("every pick kind has a guide step, and every guide step can be picked", () => {
  for (const meta of PICK_KINDS) {
    const section = GUIDE_SECTIONS.find((s) => s.id === meta.section);
    assert.ok(section, `pick kind ${meta.kind} names a missing guide step`);
    assert.equal(
      meta.step,
      section!.step,
      `pick kind ${meta.kind} disagrees with the guide about which step it is`,
    );
  }
  for (const section of GUIDE_SECTIONS) {
    assert.ok(
      PICK_KINDS.some((k) => k.section === section.id),
      `guide step ${section.id} produces nothing the plan can hold`,
    );
  }
});

test("pickHref can only produce an in-app guide path, including for a major", () => {
  assert.equal(pickHref("major", "computer-science"), "/guide/majors/computer-science");
  for (const meta of PICK_KINDS) {
    const href = pickHref(meta.kind, "x");
    assert.ok(
      href.startsWith("/guide/"),
      `${meta.kind} can produce a path outside the guide: ${href}`,
    );
  }
});

test("countPicks counts a major", () => {
  const counts = countPicks([
    { ref: "major:computer-science", label: "Computer science", href: "/guide/majors/computer-science" },
    { ref: "work:data-and-ai", label: "Data & AI", href: "/guide/work/data-and-ai" },
  ]);
  assert.equal(counts.major, 1);
  assert.equal(counts.work, 1);
  assert.equal(counts.place, 0);
});
```

Add the imports beside the existing ones at the top of the test file if not already present:

```ts
import { GUIDE_SECTIONS } from "@/lib/data/guide-sections";
import { PICK_KINDS, countPicks, pickHref } from "@/lib/data/plan-picks";
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test:unit
```

Expected: FAIL — `majors` is not a `GuideSectionId`.

- [ ] **Step 3: Add the step to `lib/data/guide-sections.ts`**

Change the union and insert the entry, renumbering the three steps after it:

```ts
export type GuideSectionId =
  | "work"
  | "majors"
  | "cities"
  | "places"
  | "from-home";
```

Insert into `GUIDE_SECTIONS` immediately after the `work` entry:

```ts
  {
    id: "majors",
    step: 2,
    href: "/guide/majors",
    label: "What you'd study",
    title: "What you would actually study",
    blurb:
      "The subject you apply with — what the first year is really made of, what it costs you, and who should study something else instead. The step between knowing the work and choosing the country.",
  },
```

Then change `places` to `step: 3`, `cities` to `step: 4`, and `from-home` to `step: 5`. **Do not reorder the array** — `places` already precedes `cities`; only the numbers change.

- [ ] **Step 4: Add the pick kind in `lib/data/plan-picks.ts`**

```ts
export type PickKind = "work" | "major" | "place" | "hub" | "route";
```

Insert into `PICK_KINDS` after the `work` entry:

```ts
  {
    kind: "major",
    section: "majors",
    step: 2,
    heading: "Subjects you'd study",
    noun: "subject",
    nounPlural: "subjects",
    listHref: "/guide/majors",
  },
```

Renumber the `step` on `place` to 3, `hub` to 4, `route` to 5.

Add the `pickHref` case, above `place`:

```ts
    case "major":
      return `/guide/majors/${id}`;
```

Update the `countPicks` seed:

```ts
  const counts: PickCounts = { work: 0, major: 0, place: 0, hub: 0, route: 0 };
```

- [ ] **Step 5: Run tests and type-check**

```bash
npm run test:unit && npx tsc --noEmit
```

Expected: PASS, no type output. `PickCounts` is `Record<PickKind, number>`, so `tsc` will name every place that constructs one by hand — fix each by adding `major: 0`.

- [ ] **Step 6: Commit**

```bash
git add lib/data/guide-sections.ts lib/data/plan-picks.ts scripts/test-engine.ts
git commit -m "feat(guide): majors becomes step 2, and a thing the plan can hold"
```

---

### Task A3: The majors list route

**Files:**
- Create: `app/guide/majors/(list)/page.tsx`
- Create: `app/guide/majors/(list)/loading.tsx`

**Interfaces:**
- Consumes: `majorsByField`, `MAJORS` (A1); `guideSection("majors")` (A2); `guideView` from `lib/guide/student-fields.ts`; `withFields` from `lib/data/guide-fields.ts`; `ListHead`, `SectionIntro`, `NextStep` from `components/guide/parts.tsx`; `pageMeta` from `lib/seo.ts`; `guideMorph` from `lib/data/guide-sections.ts`.
- Produces: the route `/guide/majors`.

> **Why the `(list)` route group:** a `loading.tsx` is a Suspense boundary, and a boundary lets the server flush the response — status line included — before the page under it renders. A section-wide boundary therefore made every unknown id answer **200** carrying a not-found page. The group adds nothing to the URL and stops `/guide/majors/[major]` inheriting the skeleton. Do not tidy it away.

- [ ] **Step 1: Write the loading file**

Create `app/guide/majors/(list)/loading.tsx`:

```tsx
import { GuideSkeleton } from "@/components/guide/Skeleton";

// Scoped to the list, not to `/guide/majors/[major]` below it — a boundary
// there would turn an unknown id into a 200 carrying a "not found" page.
export default function GuideMajorsLoading() {
  return <GuideSkeleton />;
}
```

- [ ] **Step 2: Write the list page**

Create `app/guide/majors/(list)/page.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "@/components/ui/Link";
import { FieldFilter } from "@/components/guide/FieldFilter";
import { ListHead, NextStep, SectionIntro } from "@/components/guide/parts";
import { FACULTY_LABEL, FACULTY_VALUES } from "@/lib/data/faculties";
import { withFields } from "@/lib/data/guide-fields";
import { guideMorph, guideSection } from "@/lib/data/guide-sections";
import { majorsByField } from "@/lib/data/majors";
import { guideView } from "@/lib/guide/student-fields";
import { pageMeta } from "@/lib/seo";

// Step 2: the subject you actually apply with.
//
// Grouped by field rather than listed flat, for the same reason the cities step
// is grouped by country: fifty cards in one column is a wall, and the grouping
// is itself information — it says which of the eight fields this subject sits
// under, which is the thing a student is trying to work out.

const SECTION = guideSection("majors");

export const metadata: Metadata = pageMeta({
  title: "What you would actually study — Compass",
  description: SECTION.blurb,
  path: SECTION.href,
});

export default async function GuideMajorsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const { signedIn, fields, stated, defaults } = await guideView(searchParams);
  const shownFields = fields.length ? fields : FACULTY_VALUES;

  const groups = majorsByField(shownFields);
  const total = groups.reduce((n, g) => n + g.majors.length, 0);

  return (
    <div className="space-y-6">
      <ListHead
        intro={
          <SectionIntro
            step={SECTION.step}
            title={SECTION.title}
            blurb={SECTION.blurb}
            count={`${total} subjects`}
          />
        }
        aside={<FieldFilter defaultFields={defaults} signedIn={signedIn} />}
      />

      {groups.map((group) => (
        <section key={group.faculty} className="space-y-2.5">
          <h2 className="text-sm font-semibold text-ink-soft">
            {FACULTY_LABEL[group.faculty]}
          </h2>
          <ul className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {group.majors.map((major) => (
              <li key={major.id}>
                <Link
                  href={withFields(`/guide/majors/${major.id}`, stated)}
                  className="group flex h-full flex-col rounded-2xl border border-line bg-card p-4 transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-accent hover:shadow-card active:scale-[0.99] active:duration-75 focus-visible:focus-ring motion-reduce:transform-none motion-reduce:transition-none"
                >
                  <span
                    className="text-base font-semibold leading-snug text-ink"
                    style={{
                      viewTransitionName: guideMorph("major", major.id),
                    }}
                  >
                    {major.name}
                  </span>
                  {/* The other names it is taught under, said on the CARD and
                      not only on the page behind it. A student searching for
                      "informatics" has to be able to see that this is it
                      without opening fifty cards to find out. */}
                  {major.alsoCalled.length > 0 && (
                    <span className="mt-1 text-xs leading-relaxed text-ink-faint">
                      also called {major.alsoCalled.join(" · ")}
                    </span>
                  )}
                  <span className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">
                    {major.whatItActuallyIs}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <NextStep from="majors" fields={fields.length ? fields : null} />
    </div>
  );
}
```

- [ ] **Step 3: Extend `guideMorph` to accept a major**

In `lib/data/guide-sections.ts`:

```ts
export function guideMorph(
  kind: "area" | "major" | "hub" | "place",
  id: string,
): string {
  return `guide-${kind}-${id}`;
}
```

- [ ] **Step 4: Verify the route renders**

```bash
npx tsc --noEmit && npm run lint
```

Expected: no output from either.

Then, with the dev server up (`npm run dev`), open `http://localhost:3000/guide/majors` and confirm the grouped list renders and a card links through.

- [ ] **Step 5: Commit**

```bash
git add app/guide/majors lib/data/guide-sections.ts
git commit -m "feat(guide): the majors list, grouped by field"
```

---

### Task A4: The major subject page

**Files:**
- Create: `app/guide/majors/[major]/page.tsx`

**Interfaces:**
- Consumes: `majorById` (A1); `areaBySlug`, `areaSlug` from `lib/data/careers.ts`; `guidePickState` from `lib/guide/plan-state.ts`; `AddToPlan` from `components/guide/AddToPlan.tsx`; `DetailShell`, `ForYou`, `GuideBlock`, `GuidePart`, `PageContents` from `components/guide/parts.tsx`.
- Produces: the route `/guide/majors/[major]`.

- [ ] **Step 1: Write the page**

Create `app/guide/majors/[major]/page.tsx`:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "@/components/ui/Link";
import {
  DetailShell,
  ForYou,
  GuideBlock,
  GuidePart,
  PageContents,
} from "@/components/guide/parts";
import { AddToPlan } from "@/components/guide/AddToPlan";
import { areaBySlug, areaSlug } from "@/lib/data/careers";
import { FACULTY_LABEL } from "@/lib/data/faculties";
import { withFields } from "@/lib/data/guide-fields";
import { guideMorph } from "@/lib/data/guide-sections";
import { majorById } from "@/lib/data/majors";
import { guidePickState } from "@/lib/guide/plan-state";
import { statedGuideFields } from "@/lib/guide/student-fields";
import { pageMeta } from "@/lib/seo";

// One subject, in full — the page that did not exist, which is why the chain
// stopped at "what kind of work" and resumed at "which country" with nothing in
// between.

export async function generateMetadata({
  params,
}: {
  params: { major: string };
}): Promise<Metadata> {
  const major = majorById(params.major);
  if (!major) return { title: "Not found — Compass" };
  return pageMeta({
    title: `${major.name} — what it actually is, and who should study something else | Compass`,
    description: major.whatItActuallyIs,
    path: `/guide/majors/${params.major}`,
    type: "article",
  });
}

export default async function GuideMajorPage({
  params,
  searchParams,
}: {
  params: { major: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const major = majorById(params.major);
  if (!major) notFound();

  const pick = await guidePickState("major", params.major);
  const stated = statedGuideFields(searchParams);

  // The work this opens, resolved to real pages. A slug that no longer exists
  // is dropped rather than rendered as a dead link — the test in Task A1 makes
  // that impossible to ship, but the page does not assume the test ran.
  const leadsTo = major.leadsTo
    .map((slug) => ({ slug, found: areaBySlug(slug) }))
    .filter((x) => Boolean(x.found))
    .map((x) => ({ slug: x.slug, title: x.found!.area.title }));

  const parts: { id: string; title: string; body: React.ReactNode }[] = [
    {
      id: "what-it-is",
      title: "What this subject actually is",
      body: (
        <>
          {major.alsoCalled.length > 0 && (
            <GuideBlock label="You will also see it called">
              {major.alsoCalled.join(" · ")}
              <span className="mt-1 block text-xs text-ink-faint">
                Same subject, different country, different department. Search
                for all of these.
              </span>
            </GuideBlock>
          )}

          {/* The paragraph no prospectus contains, and the reason it is the
              first thing under the answer rather than the last thing on the
              page: the first year is where people leave. */}
          <GuideBlock label="What the first year is really made of">
            {major.firstYear}
          </GuideBlock>

          <GuideBlock label="The catch" tone="warn">
            {major.catch}
          </GuideBlock>

          {major.hardGate && (
            <GuideBlock label="The one hard requirement" tone="warn">
              {major.hardGate}
            </GuideBlock>
          )}
        </>
      ),
    },
    {
      id: "start-now",
      title: "What to do about it now",
      body: (
        <>
          {/* The only thing on this page available today. A decision years away
              is not an action, and a page that ends in reading is where a
              student leaves. */}
          <GuideBlock label="The school subjects that actually matter" tone="good">
            <ul className="flex flex-wrap gap-1.5">
              {major.schoolSubjects.map((s) => (
                <li
                  key={s}
                  className="rounded-lg border border-line bg-surface px-2.5 py-1 text-xs text-ink-soft"
                >
                  {s}
                </li>
              ))}
            </ul>
            <span className="mt-2 block text-xs text-ink-faint">
              What admissions screens on, and what year one assumes you already
              have.
            </span>
          </GuideBlock>
        </>
      ),
    },
    {
      id: "leads-to",
      title: "Where it leads",
      body: (
        <GuideBlock label="Kinds of work this opens">
          <ul className="space-y-2">
            {leadsTo.map((a) => (
              <li key={a.slug}>
                <Link
                  href={withFields(`/guide/work/${a.slug}`, stated)}
                  className="group flex min-h-11 items-center justify-between gap-2 text-sm font-medium text-ink-soft transition-colors hover:text-ink focus-visible:focus-ring"
                >
                  {a.title}
                  <span
                    aria-hidden
                    className="shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-accent motion-reduce:transition-none"
                  >
                    &rarr;
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <span className="mt-2 block text-xs text-ink-faint">
            A list, not a prediction. Most people in these jobs did not study
            exactly this, and most people who study this do something else.
          </span>
        </GuideBlock>
      ),
    },
  ];

  return (
    <DetailShell
      crumb="What you'd study"
      crumbHref={withFields("/guide/majors", stated)}
      title={major.name}
      transitionName={guideMorph("major", params.major)}
      sub={major.fields.map((f) => FACULTY_LABEL[f]).join(" · ")}
      lead={major.whatItActuallyIs}
      aside={
        <AddToPlan
          kind="major"
          id={params.major}
          label={major.name}
          signedIn={pick.signedIn}
          saved={pick.saved}
          maps={pick.maps}
          returnTo={`/guide/majors/${params.major}`}
        />
      }
    >
      <ForYou suits={major.suitsYou} avoid={major.notForYou} />
      <PageContents parts={parts} />
      {parts.map((part, i) => (
        <GuidePart key={part.id} id={part.id} step={i + 1} title={part.title}>
          {part.body}
        </GuidePart>
      ))}
    </DetailShell>
  );
}
```

- [ ] **Step 2: Verify an unknown id is a real 404**

With the dev server up:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/guide/majors/no-such-subject
```

Expected: `404`. If it prints `200`, a `loading.tsx` has leaked above this route — check that the skeleton is inside `(list)` and nowhere else.

- [ ] **Step 3: Type-check and lint**

```bash
npx tsc --noEmit && npm run lint
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add app/guide/majors/\[major\]
git commit -m "feat(guide): a page per subject — first year, catch, and who should study something else"
```

---

### Task A5: The major joins the spine and the sitemap

**Files:**
- Modify: `lib/data/spine.ts`
- Modify: `app/sitemap.ts`
- Test: `scripts/test-engine.ts`

**Interfaces:**
- Consumes: `MAJORS`, `majorsForFaculties` (A1).
- Produces: `Spine` gains `majors: Major[]`; the sitemap lists `/guide/majors` and every subject page.

- [ ] **Step 1: Write the failing tests**

Append to `scripts/test-engine.ts`:

```ts
test("the spine carries the study step, and every major on it is under that field", () => {
  for (const faculty of FACULTY_VALUES) {
    const spine = spineForFaculty(faculty);
    assert.ok(
      spine.majors.length > 0,
      `${faculty} has no subject to study — the chain breaks at step 2`,
    );
    assert.ok(
      spine.majors.every((m) => m.fields.includes(faculty)),
      `${faculty}'s chain lists a subject from another field`,
    );
  }
});

test("the sitemap lists the majors step and every subject page", () => {
  const urls = new Set(sitemap().map((e) => e.url));
  assert.ok(
    urls.has(`${CANONICAL_URL}/guide/majors`),
    "the majors step is not advertised to a crawler",
  );
  for (const m of MAJORS) {
    assert.ok(
      urls.has(`${CANONICAL_URL}/guide/majors/${m.id}`),
      `${m.id} has a page nothing links to from the sitemap`,
    );
  }
});
```

Add the imports if not already present:

```ts
import sitemap from "@/app/sitemap";
import { CANONICAL_URL } from "@/lib/site";
import { spineForFaculty } from "@/lib/data/spine";
import { FACULTY_VALUES } from "@/lib/data/faculties";
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test:unit
```

Expected: FAIL — `spine.majors` is undefined.

- [ ] **Step 3: Add the stop to `lib/data/spine.ts`**

Add the import at the top:

```ts
import { majorsForFaculties, type Major } from "@/lib/data/majors";
```

Add the field to the `Spine` type, between `faculty` and `stops`:

```ts
export type Spine = {
  faculty: FacultyValue;
  /**
   * What you would actually apply with. The step that was missing: the chain
   * ran from a kind of work straight to a country, skipping the one row a
   * student fills in on a form.
   */
  majors: Major[];
  /** Where this work lives, home region first. */
  stops: SpineStop[];
  homeRoutes: HomeRoute[];
  hubCount: number;
  universityCount: number;
};
```

In `spineForFaculty`, populate it in the returned object:

```ts
    majors: majorsForFaculties([faculty]),
```

> **Do not store the spine.** It stays a derivation, for the same reason as before: a saved chain is a sixth copy of the same relationships and drifts the first time a major gains a field.

- [ ] **Step 4: Add the pages to `app/sitemap.ts`**

Add the import:

```ts
import { MAJORS } from "@/lib/data/majors";
```

Inside the `paths` array, immediately after the `allCareerAreas()` spread:

```ts
    ...MAJORS.map((m) => `/guide/majors/${m.id}`),
```

`...GUIDE_SECTIONS.map((s) => s.href)` already covers `/guide/majors` itself, because the step is in the registry.

- [ ] **Step 5: Render the study step in the chain**

In `components/guide/Spine.tsx`, render `spine.majors` as the first block of the chain, above the countries. Follow the file's existing block markup; the rule that applies here is the one already in the module: **a stop with no page behind it is a name a student cannot click**, so every major renders as a link to `/guide/majors/${m.id}`.

- [ ] **Step 6: Run tests, type-check, lint**

```bash
npm run test:unit && npx tsc --noEmit && npm run lint
```

Expected: PASS, then no output from either.

- [ ] **Step 7: Commit**

```bash
git add lib/data/spine.ts app/sitemap.ts components/guide/Spine.tsx scripts/test-engine.ts
git commit -m "feat(spine): the chain gains the step you actually apply with"
```

---

### Task A6: Stream A gate

- [ ] **Step 1: Stop the dev server, then build**

```bash
npm run build
```

Expected: compiles, lints and type-checks clean. `/guide/majors` and `/guide/majors/[major]` appear in the route table.

- [ ] **Step 2: Run the whole local gate**

```bash
npm run test:unit && node --import tsx scripts/test-session-checks.ts
```

Expected: both pass.

- [ ] **Step 3: Commit any fixes and push the stream**

```bash
git add -A && git commit -m "chore(majors): stream A gate — build, unit and session checks green"
git push -u origin HEAD
```

---

# STREAM B — the reaction engine and the thread

Independent of Stream A. Touches no file Stream A touches, **except `lib/data/next-move.ts`, which needs `PickCounts` to have gained `major`** — see Task B4's note for how to proceed if A2 has not landed yet.

---

### Task B1: The beats registry and its scoring

**Files:**
- Create: `lib/data/beats.ts`
- Test: `scripts/test-engine.ts`

**Interfaces:**
- Consumes: `FacultyValue` from `lib/data/faculties.ts` (type only).
- Produces:
  - `type WorkAxis`, `type Beat`, `type BeatReaction`, `type BeatAnswers`
  - `const BEATS: Beat[]`, `const BEAT_PAIRS: [string, string][]`
  - `function nextPair(answers: BeatAnswers): [Beat, Beat] | null`
  - `function pairsAnswered(answers: BeatAnswers): number`
  - `function scoreBeats(answers: BeatAnswers): { axis: WorkAxis; score: number }[]`
  - `function topFieldsFromBeats(answers: BeatAnswers, n?: number): FacultyValue[]`
  - `function observationFromBeats(answers: BeatAnswers): string | null`

- [ ] **Step 1: Write the failing tests**

Append to `scripts/test-engine.ts`:

```ts
// ── The reaction engine ──────────────────────────────────────────────────────
// How the thread learns who a student is without asking them the question they
// came here unable to answer. Pure, fixed weights, same shape as the interest
// quiz — and, unlike a personality test, it only ever reports what they picked.

test("every beat is concrete, has a plainer version, and names no profession", () => {
  const ids = new Set<string>();
  assert.ok(BEATS.length >= 20, "too few beats to separate anything");
  for (const b of BEATS) {
    assert.ok(!ids.has(b.id), `duplicate beat id ${b.id}`);
    ids.add(b.id);
    assert.ok(
      b.text.trim().length > 60 && b.text.trim().length < 260,
      `${b.id} is not one concrete moment — it is a paragraph or a fragment`,
    );
    // The button nobody builds. A student who cannot parse the sentence must
    // have somewhere to go that is not a wrong answer.
    assert.ok(
      b.plainer.trim().length > 40,
      `${b.id} has no plainer version for "I don't get it"`,
    );
    assert.ok(
      Object.keys(b.axes).length > 0,
      `${b.id} measures nothing`,
    );
  }
});

test("no beat names a job title — that is the vocabulary the student does not have", () => {
  const titles = /\b(engineer|lawyer|doctor|analyst|consultant|banker|designer|scientist|developer|manager|architect)\b/i;
  for (const b of BEATS) {
    assert.ok(
      !titles.test(b.text),
      `${b.id} names a profession: ${b.text.slice(0, 60)}`,
    );
  }
});

test("every pair is two real, distinct beats, and no beat appears in two pairs", () => {
  const byId = new Map(BEATS.map((b) => [b.id, b]));
  const seen = new Set<string>();
  assert.ok(BEAT_PAIRS.length >= 8, "fewer than eight pairs is not a sequence");
  for (const [a, b] of BEAT_PAIRS) {
    assert.ok(byId.has(a), `pair names a missing beat: ${a}`);
    assert.ok(byId.has(b), `pair names a missing beat: ${b}`);
    assert.notEqual(a, b, "a pair asks the same thing twice");
    assert.ok(!seen.has(a) && !seen.has(b), `beat reused across pairs: ${a}/${b}`);
    seen.add(a);
    seen.add(b);
  }
});

test("nextPair walks the sequence and returns null when it is finished", () => {
  assert.deepEqual(nextPair({})?.map((b) => b.id), BEAT_PAIRS[0]);
  const first: BeatAnswers = {
    [BEAT_PAIRS[0][0]]: "picked",
    [BEAT_PAIRS[0][1]]: "passed",
  };
  assert.deepEqual(nextPair(first)?.map((b) => b.id), BEAT_PAIRS[1]);
  const all: BeatAnswers = {};
  for (const [a, b] of BEAT_PAIRS) {
    all[a] = "picked";
    all[b] = "passed";
  }
  assert.equal(nextPair(all), null);
});

test("scoring: nothing in ⇒ nothing out, and unclear contributes no signal", () => {
  assert.deepEqual(scoreBeats({}), []);
  assert.deepEqual(topFieldsFromBeats({}), []);
  const unclearOnly: BeatAnswers = Object.fromEntries(
    BEATS.slice(0, 4).map((b) => [b.id, "unclear" as const]),
  );
  assert.deepEqual(
    scoreBeats(unclearOnly),
    [],
    "an answer of 'I don't get it' was counted as a preference",
  );
});

test("scoring: only what was PICKED counts, and the result is ordered", () => {
  const b = BEATS[0];
  const scored = scoreBeats({ [b.id]: "picked" });
  assert.ok(scored.length > 0, "picking a beat measured nothing");
  for (let i = 1; i < scored.length; i += 1) {
    assert.ok(scored[i - 1].score >= scored[i].score, "not ordered");
  }
  assert.deepEqual(
    scoreBeats({ [b.id]: "passed" }),
    [],
    "passing on something was counted as choosing it",
  );
});

test("pairsAnswered counts pairs, not beats, and ignores unclear-only pairs", () => {
  assert.equal(pairsAnswered({}), 0);
  const [a1, b1] = BEAT_PAIRS[0];
  assert.equal(pairsAnswered({ [a1]: "picked", [b1]: "passed" }), 1);
  assert.equal(
    pairsAnswered({ [a1]: "unclear", [b1]: "unclear" }),
    0,
    "a pair nobody understood was counted as answered",
  );
});

test("the observation waits for three pairs, then says something, and never types the student", () => {
  const answers: BeatAnswers = {};
  for (let i = 0; i < 2; i += 1) {
    answers[BEAT_PAIRS[i][0]] = "picked";
    answers[BEAT_PAIRS[i][1]] = "passed";
  }
  assert.equal(
    observationFromBeats(answers),
    null,
    "it spoke before it had grounds to",
  );
  answers[BEAT_PAIRS[2][0]] = "picked";
  answers[BEAT_PAIRS[2][1]] = "passed";
  const said = observationFromBeats(answers);
  assert.ok(said && said.length > 30, "three pairs in and it had nothing to say");
  // Rule 1 of the engine: observations, never types. A personality label is a
  // claim we cannot support, and this product does not assert what it does not
  // know.
  assert.ok(
    !/you are (an?|the) [A-Z]/.test(said!),
    `it typed the student instead of observing them: ${said}`,
  );
});
```

Add the import at the top of the test file:

```ts
import {
  BEATS,
  BEAT_PAIRS,
  nextPair,
  observationFromBeats,
  pairsAnswered,
  scoreBeats,
  topFieldsFromBeats,
  type BeatAnswers,
} from "@/lib/data/beats";
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test:unit
```

Expected: FAIL — `Cannot find module '@/lib/data/beats'`.

- [ ] **Step 3: Write the registry and the scorer**

Create `lib/data/beats.ts`. Everything below is complete except the beat entries after the first four, which follow the same shape.

```ts
import type { FacultyValue } from "@/lib/data/faculties";

// HOW WE LEARN WHO SOMEONE IS WITHOUT ASKING THEM.
//
// The product asked "what field do you want to study?" and, when that failed,
// offered a quiz that asked slightly gentler versions of the same abstraction.
// Both require the answer the student came here BECAUSE THEY DO NOT HAVE. A
// fifteen-year-old cannot say "I value autonomy in my work"; they can say which
// of two Tuesdays sounds more like them.
//
// So: a beat is one concrete moment of real work, 15–25 words, containing no
// jargon and NAMING NO PROFESSION. Two at a time. Three answers — this one,
// neither, or "I don't get it".
//
// THREE RULES:
//
// 1. **Observations, never types.** Nothing here ever produces "you are an
//    Investigator". It produces "you picked the one where the result lands the
//    same evening, twice". A personality label is a claim we cannot support,
//    and the same discipline that keeps a countdown off an unconfirmed date
//    keeps a type off a student.
// 2. **Speak at three pairs, not eight.** A confused student will not reach the
//    eighth. Three is enough to say something true.
// 3. **"I don't get it" is a first-class answer** and contributes NO signal. It
//    is the button nobody builds, and it is also our own quality feedback: a
//    beat that collects them is badly written.
//
// The axes are the SHAPE of work, not the faculty. Faculties fall out of this
// as an output; they are never the question. Fixed per-option weights and pure
// scoring, the same pattern as `interest-quiz.ts`.
//
// PURE and free of prose registries — this one is safe in a client bundle.

/** The shape of work, which is what a person can actually recognise. */
export type WorkAxis =
  | "result_today"
  | "result_years"
  | "with_people"
  | "with_things"
  | "inside_rules"
  | "inside_fog"
  | "making_new"
  | "keeping_alive"
  | "alone"
  | "in_a_group";

export type Beat = {
  id: string;
  /** One concrete Tuesday. No jargon, no job title. */
  text: string;
  /** The same thing in plainer words, for "I don't get it". */
  plainer: string;
  /** What picking this says about the shape of work they lean toward. */
  axes: Partial<Record<WorkAxis, number>>;
  /** The fields this leans toward. An output, never the question. */
  fields: Partial<Record<FacultyValue, number>>;
};

export type BeatReaction = "picked" | "passed" | "unclear";

/** beatId → what they did with it. */
export type BeatAnswers = Record<string, BeatReaction>;

export const BEATS: Beat[] = [
  {
    id: "numbers-lie",
    text: "You sit with a company's own numbers and look for the place where it is lying to itself. By evening, you find it.",
    plainer:
      "Reading a company's financial records to spot what does not add up, and finding it the same day.",
    axes: { result_today: 2, with_things: 1, inside_rules: 1, alone: 1 },
    fields: { business_economics: 2 },
  },
  {
    id: "holds-by-morning",
    text: "Your work has to hold ten thousand people by morning. Right now it does not. You spend the night finding out why.",
    plainer:
      "Something you built keeps breaking under heavy use, and you have until morning to work out the cause.",
    axes: { result_today: 2, with_things: 2, inside_fog: 1, alone: 1 },
    fields: { computer_science: 2 },
  },
  {
    id: "same-question-fortieth",
    text: "The same frightened question, for the fortieth time this week, from someone who has never been told the answer plainly.",
    plainer:
      "Explaining something worrying and complicated to one anxious person after another, all day.",
    axes: { with_people: 2, result_today: 1, keeping_alive: 1 },
    fields: { medicine_health: 2, humanities_social: 1 },
  },
  {
    id: "one-sentence-fought",
    text: "One sentence, argued over for three days, because whichever way it is written decides what thousands of people may do.",
    plainer:
      "Spending days on the exact wording of a rule, because small changes to it change what people are allowed to do.",
    axes: { inside_rules: 2, with_people: 1, result_years: 1 },
    fields: { law: 2 },
  },
  // ── The remaining ~20 beats follow this shape. ────────────────────────────
  //
  // WRITING RULES, enforced by the tests:
  //   * 60–260 characters. One moment, not a job description.
  //   * No profession names — the test regex rejects engineer, lawyer, doctor,
  //     analyst, consultant, banker, designer, scientist, developer, manager,
  //     architect.
  //   * `plainer` is mandatory and > 40 characters, and it is allowed to be
  //     duller. Its job is comprehension, not appeal.
  //   * Every beat measures at least one axis.
  //   * Across the whole registry, cover all eight faculties and both ends of
  //     every axis — a set of beats that only offers "result today" measures
  //     nothing.
];

/**
 * The order the pairs are asked in, and it is a curated sequence rather than a
 * shuffle: the first pair has to be the one that is easiest to have an opinion
 * about, because it is the first thing the student ever does here.
 *
 * Each beat appears in exactly one pair — a beat seen twice would be counted
 * twice, and a student who saw it twice would think the product had lost track.
 */
export const BEAT_PAIRS: [string, string][] = [
  ["numbers-lie", "holds-by-morning"],
  ["same-question-fortieth", "one-sentence-fought"],
  // ── The remaining pairs, one per two beats. ───────────────────────────────
];

const PAIR_INDEX = new Map<string, number>();
BEAT_PAIRS.forEach(([a, b], i) => {
  PAIR_INDEX.set(a, i);
  PAIR_INDEX.set(b, i);
});

const BY_ID = new Map(BEATS.map((b) => [b.id, b]));

/** A pair counts as answered when at least one of its beats got a real verdict. */
export function pairsAnswered(answers: BeatAnswers): number {
  const done = new Set<number>();
  for (const [id, reaction] of Object.entries(answers)) {
    if (reaction === "unclear") continue;
    const i = PAIR_INDEX.get(id);
    if (i !== undefined) done.add(i);
  }
  return done.size;
}

/** The next pair to ask, or null when the sequence is finished. */
export function nextPair(answers: BeatAnswers): [Beat, Beat] | null {
  for (const [a, b] of BEAT_PAIRS) {
    if (answers[a] === undefined && answers[b] === undefined) {
      const left = BY_ID.get(a);
      const right = BY_ID.get(b);
      // A pair naming a missing beat is skipped rather than thrown on: the test
      // makes it impossible to ship, and a student is not the right person to
      // find out about it.
      if (left && right) return [left, right];
    }
  }
  return null;
}

/**
 * The axes they lean toward, strongest first.
 *
 * **Only `picked` counts.** Passing on something is not evidence about the
 * other thing — a student can dislike both — and `unclear` is explicitly not a
 * preference. Iterating the registry rather than the answers is what makes an
 * unknown key inert, the same property `scoreInterestQuiz` has.
 */
export function scoreBeats(
  answers: BeatAnswers,
): { axis: WorkAxis; score: number }[] {
  const totals = new Map<WorkAxis, number>();
  for (const beat of BEATS) {
    if (answers[beat.id] !== "picked") continue;
    for (const [axis, weight] of Object.entries(beat.axes) as [
      WorkAxis,
      number,
    ][]) {
      totals.set(axis, (totals.get(axis) ?? 0) + weight);
    }
  }
  return [...totals.entries()]
    .map(([axis, score]) => ({ axis, score }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
}

/** The fields those choices lean toward — an output of the engine, never its question. */
export function topFieldsFromBeats(
  answers: BeatAnswers,
  n = 3,
): FacultyValue[] {
  const totals = new Map<FacultyValue, number>();
  for (const beat of BEATS) {
    if (answers[beat.id] !== "picked") continue;
    for (const [faculty, weight] of Object.entries(beat.fields) as [
      FacultyValue,
      number,
    ][]) {
      totals.set(faculty, (totals.get(faculty) ?? 0) + weight);
    }
  }
  return [...totals.entries()]
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([faculty]) => faculty);
}

/**
 * What we noticed, said back to them — and the reason the engine reads as a
 * person rather than as a form.
 *
 * It waits for three pairs, it names the axis they actually leaned on, and it
 * NEVER names a type. There is one line per axis and it describes the choosing,
 * not the chooser.
 */
const AXIS_OBSERVATION: Record<WorkAxis, string> = {
  result_today:
    "Twice now you have picked the one where the result lands the same evening. That is rarer than you would think, and it rules a lot of work in and out on its own.",
  result_years:
    "You keep choosing the work whose result arrives years later. Most people cannot stand that, and the fields that need it are short of people who can.",
  with_people:
    "Every one you picked has another person in it. That is a preference about the whole shape of a working day, not about a subject.",
  with_things:
    "You keep choosing the ones where the thing you are working on is not a person. It makes the day quieter, and it is worth knowing about yourself early.",
  inside_rules:
    "You lean toward work with a rule you can check yourself against. That is not caution — it is a real and useful preference about how you like to be judged.",
  inside_fog:
    "You keep picking the ones where nobody knows the answer yet. Most jobs are not like that, and the ones that are will not feel like a leap to you.",
  making_new:
    "Every one you chose starts with a blank page. That is a specific appetite, and it is worth aiming at deliberately rather than hoping to find it.",
  keeping_alive:
    "You keep choosing the work of keeping something running rather than starting something. That work is undersold and it is where most of the world actually is.",
  alone:
    "You picked the ones you would do largely by yourself. Worth knowing before you choose a field where the day is mostly meetings.",
  in_a_group:
    "You keep choosing the work that happens between people. That points at whole fields, and it rules out a few that look similar from outside.",
};

export function observationFromBeats(answers: BeatAnswers): string | null {
  // Rule 2: three pairs, not eight.
  if (pairsAnswered(answers) < 3) return null;
  const [strongest] = scoreBeats(answers);
  // Everything picked was unclear or nothing was picked at all — we have no
  // grounds, so we say nothing rather than something shaped like a finding.
  if (!strongest || strongest.score < 2) return null;
  return AXIS_OBSERVATION[strongest.axis];
}
```

- [ ] **Step 4: Run the tests until they pass**

```bash
npm run test:unit
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/data/beats.ts scripts/test-engine.ts
git commit -m "feat(beats): learn who someone is from what they react to, not what they can name"
```

---

### Task B2: The reactions table

**Files:**
- Create: `supabase/migrations/0031_beat_reactions.sql`
- Modify: `scripts/check-schema.ts`
- Create: `lib/planner/reactions.ts`

**Interfaces:**
- Consumes: `BeatAnswers`, `BeatReaction` (B1); `createClient` from `lib/supabase/server.ts`.
- Produces: `loadReactions(userId: string): Promise<BeatAnswers>` — `cache()`d, server-only.

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/0031_beat_reactions.sql`:

```sql
-- 0031_beat_reactions.sql
-- What a student reacted to — the ONLY new stored fact in this release.
--
-- Apply manually in the Supabase SQL editor (no migration runner is wired up),
-- then run `npm run db:check`.
--
-- WHY THIS IS STORED AND NOTHING ELSE IS. The thread's stage, the observation
-- it makes and the move it offers are all DERIVED — from the profile, from
-- planner_path, from opportunity_intents and from these rows. A saved stage
-- would be a second copy of something computable, and it would drift the first
-- time the ladder changed, which is the same argument that keeps the spine a
-- function and keeps `kind` off planner_path.
--
-- A reaction is the exception because it cannot be derived from anything: it is
-- a fact about the person that exists nowhere else.
--
-- WHAT IS NOT HERE, deliberately:
--
--   * No score, no axis, no suggested field. All three are computed by
--     `scoreBeats` from these rows plus the registry. Storing a score would
--     freeze a student's result against a registry we intend to keep editing.
--   * No pair id. A beat belongs to exactly one pair, in the registry, and a
--     stored pair would be a second copy of that.
--   * No "profile" or "type". We do not type students. See lib/data/beats.ts.
create table if not exists beat_reactions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete cascade,
  -- The beat's id from lib/data/beats.ts. Text rather than a foreign key: the
  -- registry is code, and a row whose beat has since been retired should stay
  -- readable rather than block a delete.
  beat_id    text not null,
  -- 'picked' | 'passed' | 'unclear'. 'unclear' means "I don't get it" and is a
  -- first-class answer that contributes NO signal — it is also how we find out
  -- which beats are badly written.
  reaction   text not null check (reaction in ('picked', 'passed', 'unclear')),
  created_at timestamptz not null default now(),
  -- Reacting to the same beat twice is a correction, not a second fact. The
  -- upsert in `recordReaction` relies on this.
  unique (user_id, beat_id)
);

create index if not exists beat_reactions_user_idx on beat_reactions (user_id);

alter table beat_reactions enable row level security;

drop policy if exists "br_select_own" on beat_reactions;
create policy "br_select_own" on beat_reactions
  for select using (auth.uid() = user_id);

drop policy if exists "br_insert_own" on beat_reactions;
create policy "br_insert_own" on beat_reactions
  for insert with check (auth.uid() = user_id);

drop policy if exists "br_update_own" on beat_reactions;
create policy "br_update_own" on beat_reactions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "br_delete_own" on beat_reactions;
create policy "br_delete_own" on beat_reactions
  for delete using (auth.uid() = user_id);

-- Column-level grants. Migration 0008 locked table-wide privileges down, and a
-- missing grant here surfaces as a bare 42501 "permission denied for column"
-- that looks nothing like a permissions problem from the UI — that is the
-- profiles.full_name incident and migration 0012, and it is not repeating.
grant select, insert, update, delete on beat_reactions to authenticated;
```

- [ ] **Step 2: Add the table to `scripts/check-schema.ts`**

Open the file and find the array of expected tables. Add an entry in the same shape as the `planner_path` one, listing the columns `id`, `user_id`, `beat_id`, `reaction`, `created_at`.

> This is the standing rule: **the expected columns go in the same commit as the migration.** It is what lets defensive scaffolding be deleted instead of accumulating — code no longer has to survive an unknown schema, because the schema is checkable.

- [ ] **Step 3: Write the loader**

Create `lib/planner/reactions.ts`:

```ts
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { BeatAnswers, BeatReaction } from "@/lib/data/beats";

// Server-only. One cached read per request, so the companion asking on a guide
// page and the planner asking on its own page cost the same single query — the
// same discipline `guidePickState` and `guideView` already follow.

const REACTIONS: BeatReaction[] = ["picked", "passed", "unclear"];

function isReaction(v: unknown): v is BeatReaction {
  return REACTIONS.includes(v as BeatReaction);
}

/**
 * Everything this student has reacted to.
 *
 * A missing table means 0031 has not been applied by hand yet. That degrades to
 * "no reactions" rather than to an error, because the whole product must still
 * work for a student whose thread has simply not started — which is exactly
 * what "no reactions" already means.
 */
export const loadReactions = cache(
  async (userId: string): Promise<BeatAnswers> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("beat_reactions")
      .select("beat_id, reaction")
      .eq("user_id", userId);

    if (error || !data) return {};

    const answers: BeatAnswers = {};
    for (const row of data) {
      if (typeof row.beat_id === "string" && isReaction(row.reaction)) {
        answers[row.beat_id] = row.reaction;
      }
    }
    return answers;
  },
);
```

- [ ] **Step 4: Type-check**

```bash
npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0031_beat_reactions.sql scripts/check-schema.ts lib/planner/reactions.ts
git commit -m "feat(beats): one table for the one fact that cannot be derived"
```

- [ ] **Step 6: Tell the user to apply it**

Report exactly this: *migration `0031_beat_reactions.sql` needs to be run by hand in the Supabase SQL editor, then `npm run db:check` should report all checks passing.* Do not proceed to Stream C's reaction UI until they confirm.

---

### Task B3: The seven stations

**Files:**
- Create: `lib/data/thread.ts`
- Test: `scripts/test-engine.ts`

**Interfaces:**
- Consumes: `PickCounts` from `lib/data/plan-picks.ts` (type only).
- Produces:
  - `type StationId = "sense" | "look" | "try" | "study" | "where" | "act" | "keep"`
  - `const STATIONS: { id: StationId; index: number; label: string }[]`
  - `type StationFacts`
  - `function station(facts: StationFacts): { id: StationId; index: number; total: number }`

- [ ] **Step 1: Write the failing tests**

```ts
// ── The thread's stations ────────────────────────────────────────────────────
// Where the student is, derived — never stored. Every condition below reads a
// fact that already exists somewhere, which is the whole reason the stage
// cannot drift from the truth.

const NOWHERE: StationFacts = {
  pairsAnswered: 0,
  picks: { work: 0, major: 0, place: 0, hub: 0, route: 0 },
  tried: 0,
  committed: 0,
  started: 0,
  overdue: 0,
};

test("stations are numbered 1..7 with no gaps and no duplicates", () => {
  assert.equal(STATIONS.length, 7);
  assert.deepEqual(
    STATIONS.map((s) => s.index),
    [1, 2, 3, 4, 5, 6, 7],
  );
  assert.equal(new Set(STATIONS.map((s) => s.id)).size, 7);
});

test("a student who has done nothing is at station one", () => {
  const at = station(NOWHERE);
  assert.equal(at.id, "sense");
  assert.equal(at.index, 1);
  assert.equal(at.total, 7);
});

test("the stations advance in order as real facts accumulate", () => {
  const steps: [Partial<StationFacts>, StationId][] = [
    [{ pairsAnswered: 3 }, "look"],
    [{ pairsAnswered: 3, picks: { work: 1, major: 0, place: 0, hub: 0, route: 0 } }, "try"],
    [{ pairsAnswered: 3, picks: { work: 1, major: 0, place: 0, hub: 0, route: 0 }, tried: 1 }, "study"],
    [{ pairsAnswered: 3, picks: { work: 1, major: 1, place: 0, hub: 0, route: 0 }, tried: 1 }, "where"],
    [{ pairsAnswered: 3, picks: { work: 1, major: 1, place: 1, hub: 0, route: 0 }, tried: 1 }, "act"],
    [
      {
        pairsAnswered: 3,
        picks: { work: 1, major: 1, place: 1, hub: 0, route: 0 },
        tried: 1,
        committed: 1,
        started: 1,
      },
      "keep",
    ],
  ];
  for (const [patch, expected] of steps) {
    assert.equal(
      station({ ...NOWHERE, ...patch }).id,
      expected,
      `expected ${expected} for ${JSON.stringify(patch)}`,
    );
  }
});

test("a station is never skipped backwards by a later fact", () => {
  // Someone who commits to an opportunity before ever answering a pair is still
  // at the beginning: the stage is where they ARE, not the furthest thing they
  // have touched. Anything else would tell a lost student they were finished.
  const at = station({ ...NOWHERE, committed: 3, started: 3 });
  assert.equal(at.id, "sense");
});

test("an overdue thing does not change the station", () => {
  // Urgency is the MOVE's business, not the stage's. A stage that moved
  // backwards because a deadline lapsed would read as punishment.
  assert.equal(station({ ...NOWHERE, overdue: 2 }).id, "sense");
});
```

Add the import:

```ts
import { STATIONS, station, type StationFacts, type StationId } from "@/lib/data/thread";
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test:unit
```

Expected: FAIL — `Cannot find module '@/lib/data/thread'`.

- [ ] **Step 3: Write `lib/data/thread.ts`**

```ts
import type { PickCounts } from "@/lib/data/plan-picks";

// WHERE THE STUDENT IS, DERIVED.
//
// The companion shows "step 3 of 7", and that number must never be stored. Every
// condition below reads a fact that already exists: reactions in
// beat_reactions, picks in planner_path, commitments in opportunity_intents. A
// stored stage would be a second copy of something computable and would drift
// the first time this ladder changed — the same argument that keeps the spine a
// function and `kind` off planner_path.
//
// TWO RULES, both test-enforced, and both are ways the obvious version lies:
//
// 1. **The stage is where they ARE, not the furthest thing they have touched.**
//    A student who committed to an olympiad before ever answering a pair is
//    still at the beginning. Taking the maximum instead would tell a lost
//    person they were nearly finished.
// 2. **Nothing moves the stage backwards.** An overdue deadline is the MOVE's
//    business — see next-move.ts, where it outranks everything. A progress
//    figure that fell because something lapsed would read as punishment, and
//    this product does not treat not-entering as a verdict on a person.
//
// PURE. Nothing in this section can be checked in a browser by an agent (it
// sits behind a session), so the logic lives where a test can reach it.

export type StationId =
  | "sense"
  | "look"
  | "try"
  | "study"
  | "where"
  | "act"
  | "keep";

export const STATIONS: { id: StationId; index: number; label: string }[] = [
  { id: "sense", index: 1, label: "Who you are" },
  { id: "look", index: 2, label: "What the work is" },
  { id: "try", index: 3, label: "Trying it" },
  { id: "study", index: 4, label: "What you'd study" },
  { id: "where", index: 5, label: "Where they teach it" },
  { id: "act", index: 6, label: "Doing something real" },
  { id: "keep", index: 7, label: "Keeping it moving" },
];

export const STATION_TOTAL = STATIONS.length;

/** Everything the ladder reads. All of it already stored somewhere. */
export type StationFacts = {
  /** Pairs with a real verdict — `beat_reactions` via `pairsAnswered`. */
  pairsAnswered: number;
  /** What they claimed out of the guide — `planner_path`. */
  picks: PickCounts;
  /** Tries they have taken on — `opportunity_intents` on a try-shaped row. */
  tried: number;
  /** Opportunities they said they would enter — `opportunity_intents`. */
  committed: number;
  /** Of those, how many actually moved past "not started". */
  started: number;
  /**
   * Closed dates still sitting in "not started". Read here only so callers can
   * pass one object; it deliberately does NOT affect the station. See rule 2.
   */
  overdue: number;
};

/**
 * The station, decided by the FIRST condition that is NOT yet met.
 *
 * The order is the argument, not the implementation: it runs from the question
 * that needs no self-knowledge to the one that needs the most, which is the
 * reverse of how the product used to ask them.
 */
export function station(facts: StationFacts): {
  id: StationId;
  index: number;
  total: number;
} {
  const at = (id: StationId) => {
    const found = STATIONS.find((s) => s.id === id)!;
    return { id: found.id, index: found.index, total: STATION_TOTAL };
  };

  // 1 ── They have not told us anything about themselves yet, and we have not
  // asked them a question they cannot answer.
  if (facts.pairsAnswered < 3) return at("sense");

  // 2 ── They know something about themselves and nothing about the work.
  if (facts.picks.work === 0) return at("look");

  // 3 ── Reading about work is not the same as finding out whether you can
  // stand it, and this is the cheapest honest test there is.
  if (facts.tried === 0) return at("try");

  // 4 ── The step that was missing from the product entirely: what you actually
  // apply with.
  if (facts.picks.major === 0) return at("study");

  // 5 ── Where they teach it, and what it costs.
  if (facts.picks.place === 0) return at("where");

  // 6 ── Everything above is thinking. This is the gap the whole product
  // measures: an intention that never became an act.
  if (facts.committed === 0 || facts.started === 0) return at("act");

  // 7 ── Moving. The plan is not the point; the work is.
  return at("keep");
}
```

- [ ] **Step 4: Run tests**

```bash
npm run test:unit
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/data/thread.ts scripts/test-engine.ts
git commit -m "feat(thread): seven stations, every one derived from a fact we already store"
```

---

### Task B4: Two new branches in the move ladder

**Files:**
- Modify: `lib/data/next-move.ts`
- Test: `scripts/test-engine.ts`

> **Dependency note:** this task needs `PickCounts` to include `major`, which lands in Task A2. If Stream A has not merged yet, add `major: 0` to the `PickCounts` type locally to unblock, and rebase when A2 lands. Do not duplicate the type.

**Interfaces:**
- Consumes: `NextMoveInput`, `NextMove` (existing); `StationFacts` (B3).
- Produces: `NextMoveId` gains `"pick-major"` and `"try-it"`; `NextMoveInput` gains `tried: number` and `reachableMajors: number`. `nextMove`'s signature is otherwise unchanged.

- [ ] **Step 1: Write the failing tests**

```ts
test("a student who knows the work but has not tried it is sent to try it", () => {
  const move = nextMove({
    ...BASE_MOVE_INPUT,
    picks: { work: 1, major: 0, place: 0, hub: 0, route: 0 },
    tried: 0,
  });
  assert.equal(move.id, "try-it");
  assert.ok(move.why.length > 40, "a move without a reason is an instruction");
});

test("a student who has tried it is then asked what to study", () => {
  const move = nextMove({
    ...BASE_MOVE_INPUT,
    picks: { work: 1, major: 0, place: 0, hub: 0, route: 0 },
    tried: 1,
    reachableMajors: 4,
  });
  assert.equal(move.id, "pick-major");
  assert.match(move.action.href, /^\/guide\/majors/);
});

test("the study step is offered before the country step", () => {
  const move = nextMove({
    ...BASE_MOVE_INPUT,
    picks: { work: 1, major: 0, place: 0, hub: 0, route: 0 },
    tried: 1,
  });
  assert.notEqual(move.id, "pick-place");
});

test("an overdue thing still outranks every new branch", () => {
  const move = nextMove({
    ...BASE_MOVE_INPUT,
    overdue: 1,
    picks: { work: 1, major: 0, place: 0, hub: 0, route: 0 },
    tried: 0,
  });
  assert.equal(move.id, "overdue");
  assert.equal(move.tone, "urgent");
});

test("every move still gives exactly one reason and at most one alternative", () => {
  // Walk every branch by constructing the input that reaches it, and hold the
  // whole ladder to its three rules at once.
  const inputs: NextMoveInput[] = [
    { ...BASE_MOVE_INPUT, overdue: 1 },
    { ...BASE_MOVE_INPUT },
    { ...BASE_MOVE_INPUT, committed: 1 },
    { ...BASE_MOVE_INPUT, picks: { work: 1, major: 0, place: 0, hub: 0, route: 0 }, tried: 0 },
    { ...BASE_MOVE_INPUT, picks: { work: 1, major: 0, place: 0, hub: 0, route: 0 }, tried: 1 },
    { ...BASE_MOVE_INPUT, picks: { work: 1, major: 1, place: 0, hub: 0, route: 0 }, tried: 1 },
  ];
  for (const input of inputs) {
    const move = nextMove(input);
    assert.ok(move.why.trim().length > 40, `${move.id} gives no reason`);
    assert.ok(move.action.label.trim().length > 0, `${move.id} has no action`);
    assert.ok(
      move.action.href.startsWith("/"),
      `${move.id} points off-site: ${move.action.href}`,
    );
  }
});
```

Add the shared fixture near the top of the test file's move section:

```ts
const BASE_MOVE_INPUT: NextMoveInput = {
  fieldsStated: 1,
  picks: { work: 0, major: 0, place: 0, hub: 0, route: 0 },
  committed: 0,
  started: 0,
  tried: 0,
  overdue: 0,
  openToYou: 12,
  reachableAreas: 5,
  reachableMajors: 6,
  reachableCountries: 4,
  citiesInPicked: 0,
  nextDeadline: null,
  dated: 0,
};
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test:unit
```

Expected: FAIL — `tried` is not a property of `NextMoveInput`. **Existing move tests will also fail**, because `NextMoveInput` now requires two more fields and `PickCounts` a third. That is expected: fix each existing fixture by adding `tried: 0`, `reachableMajors: 0` and `major: 0`.

- [ ] **Step 3: Extend `lib/data/next-move.ts`**

Add to the id union:

```ts
export type NextMoveId =
  | "overdue"
  | "cold-start"
  | "pick-work"
  | "try-it"
  | "pick-major"
  | "pick-place"
  | "pick-city"
  | "commit"
  | "start"
  | "deadline"
  | "undated"
  | "steady";
```

Add to `NextMoveInput`:

```ts
  /** Tries they have taken on — a simulation, a free course, a competition. */
  tried: number;
  /** Subjects their fields open — walked out of the spine. */
  reachableMajors: number;
```

Insert two branches **between the existing `pick-work` branch and the `pick-place` branch**, in this order:

```ts
  // 3.5 ── They know what kind of work. They have never found out whether they
  // can stand it. This is the cheapest honest test that exists and it is free,
  // and until now it sat three clicks and a manual search away from the doubt
  // that motivates it.
  if (input.tried === 0) {
    return {
      id: "try-it",
      headline: "You have read about it. You haven't done any of it.",
      why: "Liking the idea of work and liking the work are different facts, and an afternoon is enough to find out which one you have. Employers build these to recruit, so they are honest about what the job actually is — and they cost nothing.",
      action: {
        label: "Try it for an afternoon",
        href: "/opportunities?kind=simulation",
      },
      tone: "open",
    };
  }

  // 3.6 ── The step the product did not have at all: what you actually apply
  // with. It comes after trying and before the country, because the subject is
  // what you carry into every admissions system on the list.
  if (picks.major === 0) {
    return {
      id: "pick-major",
      headline: "You know the work. Next is what you'd actually apply with.",
      why:
        input.reachableMajors > 0
          ? `${count(input.reachableMajors, "subject leads", "subjects lead")} to it. Each one says what the first year is really made of, what it costs you, and who should study something else — which is the half a prospectus leaves out.`
          : "A subject page says what the first year is really made of, what it costs you, and who should study something else instead — which is the half a prospectus leaves out.",
      action: {
        label: "See what you'd study",
        href: guide("/guide/majors", input.fieldsStated),
      },
      tone: "open",
    };
  }
```

- [ ] **Step 4: Run tests until green**

```bash
npm run test:unit && npx tsc --noEmit
```

Expected: PASS, then no output. Every existing `NextMoveInput` fixture will need the three new keys.

- [ ] **Step 5: Commit**

```bash
git add lib/data/next-move.ts scripts/test-engine.ts
git commit -m "feat(thread): try the work, then choose what to study — two branches the ladder lacked"
```

---

### Task B5: Stream B gate

- [ ] **Step 1: Stop dev, build, run everything**

```bash
npm run build && npm run test:unit && node --import tsx scripts/test-session-checks.ts
```

Expected: all three pass.

- [ ] **Step 2: Commit and push**

```bash
git add -A && git commit -m "chore(thread): stream B gate — build, unit and session checks green"
git push -u origin HEAD
```

---

# STREAM C — the companion

**Starts only when A and B have both merged**, and only after the user confirms migration `0031` is applied.

---

### Task C1: The server-side companion view

**Files:**
- Create: `lib/companion/load.ts`

**Interfaces:**
- Consumes: `station`, `StationFacts` (B3); `nextMove`, `NextMove` (B4); `pairsAnswered`, `nextPair`, `observationFromBeats`, `BeatAnswers` (B1); `loadReactions` (B2); `countPicks` (A2); `getSession` from `lib/auth/session.ts`.
- Produces:
  - `type CompanionView = { signedIn: boolean; station: {...}; said: string | null; move: NextMove; pair: { left: Beat; right: Beat } | null }`
  - `function loadCompanion(): Promise<CompanionView | null>` — `cache()`d, server-only.

- [ ] **Step 1: Write the loader**

```ts
import { cache } from "react";
import { getSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { loadReactions } from "@/lib/planner/reactions";
import {
  nextPair,
  observationFromBeats,
  pairsAnswered,
  type Beat,
} from "@/lib/data/beats";
import { station, type StationFacts } from "@/lib/data/thread";
import { nextMove, type NextMove } from "@/lib/data/next-move";
import { countPicks, type PlanPick } from "@/lib/data/plan-picks";

// Everything the companion needs, resolved on the SERVER.
//
// The companion renders on every page of the student's product, so this file is
// the whole reason that is affordable: the heavy registries stay here, behind
// dynamic `import()`, and the client gets serialisable values and pre-rendered
// nodes. That is the same discipline `lib/planner/load.ts` follows and the same
// trap `key-dates.ts` sets — any runtime import of the catalog, careers, world
// or the spine drags thousands of lines into every route's client bundle.
//
// One cached read per request: a guide page and the planner both ask, and they
// get one answer and one set of queries.

export type CompanionView = {
  signedIn: boolean;
  station: { id: string; index: number; total: number };
  /** What we noticed about them, or null when there is nothing new to say. */
  said: string | null;
  move: NextMove;
  /** The next two things to react to, or null when the sequence is finished. */
  pair: { left: Beat; right: Beat } | null;
};

export const loadCompanion = cache(
  async (): Promise<CompanionView | null> => {
    const session = await getSession();
    if (!session) return null;

    const supabase = createClient();

    // Every read the ladder needs, in parallel. None of them touches a prose
    // registry.
    const [answers, picksResult, intentsResult] = await Promise.all([
      loadReactions(session.id),
      supabase
        .from("planner_path")
        .select("ref, label, href")
        .eq("user_id", session.id),
      supabase
        .from("opportunity_intents")
        .select("status")
        .eq("user_id", session.id),
    ]);

    const picks: PlanPick[] = (picksResult.data ?? []) as PlanPick[];
    const intents = intentsResult.data ?? [];

    const committed = intents.length;
    const started = intents.filter(
      (i) => i.status === "doing" || i.status === "applied",
    ).length;

    const facts: StationFacts = {
      pairsAnswered: pairsAnswered(answers),
      picks: countPicks(picks),
      // A try is a commitment to something try-shaped. Counted the same way as
      // any other intent, because that is where the fact already lives — no
      // second table for "did they try", which would be the snapshot this
      // product refuses everywhere else.
      tried: started,
      committed,
      started,
      overdue: 0,
    };

    const pair = nextPair(answers);

    return {
      signedIn: true,
      station: station(facts),
      said: observationFromBeats(answers),
      move: nextMove({
        fieldsStated: session.faculties?.length ?? 0,
        picks: facts.picks,
        committed: facts.committed,
        started: facts.started,
        tried: facts.tried,
        overdue: facts.overdue,
        openToYou: 0,
        reachableAreas: 0,
        reachableMajors: 0,
        reachableCountries: 0,
        citiesInPicked: 0,
        nextDeadline: null,
        dated: 0,
      }),
      pair: pair ? { left: pair[0], right: pair[1] } : null,
    };
  },
);
```

> **On the zeroed counts:** the move's copy is written so that a zero produces the branch's number-free phrasing rather than "0 countries". That is rule 3 of the ladder — it never invents a number, and where we have nothing honest to say the copy carries none. Populating them means reaching the catalog and the spine, which is `lib/planner/load.ts`'s job; the planner passes its own richer input to the same function.

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no output. If `session.faculties` is not on the session type, read it from the profile the way `guideView` does.

- [ ] **Step 3: Commit**

```bash
git add lib/companion/load.ts
git commit -m "feat(companion): resolve the thread on the server, hand the client values"
```

---

### Task C2: The reaction pair, and the action that records it

**Files:**
- Create: `app/companion/actions.ts`
- Create: `components/companion/BeatPair.tsx`
- Test: `scripts/test-engine.ts`

**Interfaces:**
- Consumes: `BEATS`, `BeatReaction` (B1); `SaveResult` from `app/dashboard/actions.ts`.
- Produces: `recordReaction({ beatId, reaction }): Promise<SaveResult>`.

- [ ] **Step 1: Write the failing validation test**

```ts
test("the reaction action's validators reject anything not in the registry", () => {
  // A server action is a public HTTP endpoint. These are the bounds, and they
  // are asserted against the same helpers the action uses rather than against a
  // copy of them.
  assert.ok(isKnownBeat(BEATS[0].id));
  assert.ok(!isKnownBeat("../../etc/passwd"));
  assert.ok(!isKnownBeat(""));
  assert.ok(isBeatReaction("picked"));
  assert.ok(isBeatReaction("unclear"));
  assert.ok(!isBeatReaction("PICKED"));
  assert.ok(!isBeatReaction("loved"));
});
```

Add the exports to `lib/data/beats.ts` (they belong with the registry, not with the action, so the test can reach them without importing a `"use server"` module):

```ts
const REACTION_SET = new Set<string>(["picked", "passed", "unclear"]);

/** Is this an id the registry actually contains? */
export function isKnownBeat(id: string): boolean {
  return BY_ID.has(id);
}

export function isBeatReaction(v: string): v is BeatReaction {
  return REACTION_SET.has(v);
}
```

Add to the test file's beats import: `isBeatReaction, isKnownBeat`.

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test:unit
```

Expected: FAIL — `isKnownBeat` is not exported.

- [ ] **Step 3: Write the action**

Create `app/companion/actions.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isBeatReaction, isKnownBeat } from "@/lib/data/beats";
import type { SaveResult } from "@/app/dashboard/actions";

// Every bound is enforced HERE and not only in the component: a server action is
// a public HTTP endpoint and the form is a convenience. Both validators come
// from the registry itself, so an id that is not a beat cannot be stored under
// any circumstances.
//
// Note the module rule: everything exported from a "use server" file must be an
// async function. A non-function export crashes the PRODUCTION build only, as an
// opaque "Server Components render" digest.

export async function recordReaction(input: {
  beatId: string;
  reaction: string;
}): Promise<SaveResult> {
  if (!isKnownBeat(input.beatId)) return { ok: false, error: "Unknown item." };
  if (!isBeatReaction(input.reaction)) {
    return { ok: false, error: "Unknown answer." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please log in again." };

  const { error } = await supabase.from("beat_reactions").upsert(
    {
      user_id: user.id,
      beat_id: input.beatId,
      reaction: input.reaction,
    },
    { onConflict: "user_id,beat_id" },
  );

  if (error) {
    // A missing table means 0031 has not been applied by hand. Say which
    // migration — an opaque failure sends the reader looking for a code bug
    // that is not there.
    const missing = error.code === "42P01";
    return {
      ok: false,
      error: missing
        ? "Migration 0031_beat_reactions.sql has not been applied yet."
        : "Could not save that. Try again.",
    };
  }

  try {
    revalidatePath("/", "layout");
  } catch {
    // ignore cache revalidation errors
  }
  return { ok: true };
}
```

- [ ] **Step 4: Write the pair component**

Create `components/companion/BeatPair.tsx`. It is a client component; it receives two beats as props and never imports the registry.

Requirements, each of which is a rule from the spec:

- Two cards, each showing `beat.text`. Three controls: pick left, pick right, and "Neither of these".
- A fourth, quieter control per card: **"I don't get it"**, which swaps that card's text for `beat.plainer` **in place** and records `unclear`. It must not advance the pair — the student still gets to answer.
- Picking one records `picked` for it and `passed` for the other, in one round trip each, optimistically: the chosen card animates forward and the other fades. **`transform` and `opacity` only**, and `useReducedMotion()` switches the movement off while keeping the crossfade.
- Every control is at least 44px and has `focus-visible:focus-ring`.
- No entrance animation on the cards themselves.

- [ ] **Step 5: Run tests, type-check, lint**

```bash
npm run test:unit && npx tsc --noEmit && npm run lint
```

Expected: PASS, then no output.

- [ ] **Step 6: Commit**

```bash
git add lib/data/beats.ts app/companion/actions.ts components/companion/BeatPair.tsx scripts/test-engine.ts
git commit -m "feat(companion): two Tuesdays, three answers, and 'I don't get it' counts for nothing"
```

---

### Task C3: The companion itself

**Files:**
- Create: `components/companion/Companion.tsx`
- Modify: `components/student/StudentShell.tsx`
- Test: `scripts/test-engine.ts`

**Interfaces:**
- Consumes: `CompanionView` (C1); `BeatPair` (C2).
- Produces: `<Companion view={…} pair={…} />`, mounted once in `StudentShell`.

- [ ] **Step 1: Write the failing bundle test**

This is the test that protects every route in the product from the repository's most expensive recurring mistake.

```ts
test("the companion never drags a prose registry into a client bundle", () => {
  // key-dates builds a map over ~2,700 catalog rows at module load; careers,
  // world, study-destinations and spine are thousands of lines of prose. Any
  // runtime import of one of them from a client component ships it to every
  // route the companion renders on — which, by design, is all of them.
  const banned = [
    "@/lib/data/key-dates",
    "@/lib/data/careers",
    "@/lib/data/world",
    "@/lib/data/study-destinations",
    "@/lib/data/spine",
    "@/lib/data/competitions-data",
  ];
  const files = [
    "components/companion/Companion.tsx",
    "components/companion/BeatPair.tsx",
  ];
  for (const file of files) {
    const full = path.join(process.cwd(), file);
    if (!existsSync(full)) continue;
    const src = stripComments(readFileSync(full, "utf8"));
    for (const mod of banned) {
      // `import type` is free — it is erased. Anything else is not.
      const runtime = new RegExp(
        `import\\s+(?!type\\b)[^;]*from\\s+["']${mod.replace(/[/@-]/g, "\\$&")}["']`,
      );
      assert.ok(
        !runtime.test(src),
        `${file} imports ${mod} at runtime — that ships it to every page`,
      );
    }
  }
});

test("the companion says nothing twice in a row as a student advances", () => {
  // A companion that repeats itself reads as broken, and this is the only way
  // to catch it: walk the ladder and compare each utterance with the last.
  const said: string[] = [];
  const facts: StationFacts = {
    pairsAnswered: 3,
    picks: { work: 0, major: 0, place: 0, hub: 0, route: 0 },
    tried: 0,
    committed: 0,
    started: 0,
    overdue: 0,
  };
  const advance: (() => void)[] = [
    () => { facts.picks = { ...facts.picks, work: 1 }; },
    () => { facts.tried = 1; },
    () => { facts.picks = { ...facts.picks, major: 1 }; },
    () => { facts.picks = { ...facts.picks, place: 1 }; },
    () => { facts.committed = 1; facts.started = 1; },
  ];
  for (const step of advance) {
    const move = nextMove({
      ...BASE_MOVE_INPUT,
      picks: facts.picks,
      tried: facts.tried,
      committed: facts.committed,
      started: facts.started,
    });
    said.push(`${station(facts).id}|${move.headline}`);
    step();
  }
  for (let i = 1; i < said.length; i += 1) {
    assert.notEqual(
      said[i],
      said[i - 1],
      `the companion said the same thing twice: ${said[i]}`,
    );
  }
});
```

- [ ] **Step 2: Run tests to verify the no-repeat test passes and the bundle test is inert**

```bash
npm run test:unit
```

Expected: PASS. The bundle test skips missing files by design, so it goes green now and becomes a real gate the moment the components exist. This is deliberate — the test lands before the code it guards.

- [ ] **Step 3: Write the companion**

Create `components/companion/Companion.tsx`, a client component. Its props are the serialisable `CompanionView` plus the pre-rendered pair node.

Requirements, each traceable to a rule in the spec §3:

- **Desktop (`lg` and up):** a rail in the column beside the content, sticky at `top-20` (StudentNav is sticky and ~57px tall — the same reason `DetailShell`'s aside is pinned there).
- **Below `lg`:** a single line fixed to the bottom of the flow, minimum 44px, showing the station and the move's label with a chevron. Tapping it expands a sheet. **It must never cover content** — the shell reserves its height.
- **It says `view.said` when there is something to say, and renders nothing in its place when `said` is null.** Never a placeholder, never "nothing new".
- **`view.pair` renders `BeatPair` inside the companion**, not on a separate screen. This is what makes it a guide rather than a caption.
- **One dismiss control**, "I'll take it from here", collapsing it to an icon. Store the collapsed state in `localStorage` — it is a preference, not a fact about the student, and it does not belong in the database (same reasoning as the values refine).
- **No entrance animation on anything it says.**
- `aria-live="polite"` on the region that carries `said`, so a change is announced without stealing focus.

Then mount it in `components/student/StudentShell.tsx`. The shell is a **server** component; it awaits `loadCompanion()` and passes the result down, with `BeatPair` server-rendered into a node. Do not import `loadCompanion` from the client component.

- [ ] **Step 4: Verify in the browser**

Start the dev server, sign in, and check on `/opportunities`, `/guide/work`, a subject page and `/planner`:

- the companion is present on all four;
- the station number is the same on all four;
- answering a pair advances it without a full page reload;
- at 375×812 the dock is one line and covers nothing.

Then check the console and the network:

```bash
# in the browser devtools, or via the preview tools:
# read_console_messages  -> expect no errors
# read_network_requests  -> expect no request for a chunk containing the catalog
```

- [ ] **Step 5: Run the gate**

```bash
npm run test:unit && npx tsc --noEmit && npm run lint
```

Expected: PASS, then no output. The bundle test is now live against real files.

- [ ] **Step 6: Commit**

```bash
git add components/companion components/student/StudentShell.tsx scripts/test-engine.ts
git commit -m "feat(companion): the thread, present on every screen and quiet on a phone"
```

---

### Task C4: The planner and onboarding stop asking unanswerable questions

**Files:**
- Modify: `app/planner/page.tsx`
- Modify: `components/onboarding/sections.tsx`

- [ ] **Step 1: Feed the planner's richer input to the same ladder**

`lib/planner/load.ts` already gathers the catalog and spine counts. Add `tried` and `reachableMajors` to the `NextMoveInput` it builds, so the planner's card and the companion's move come from one function with the planner supplying the better numbers. **`NextMoveCard` itself does not change** — it renders whatever the ladder returns.

- [ ] **Step 2: Replace the free-text major box**

In `components/onboarding/sections.tsx` around line 109, the field labelled "What major do you want to study?" becomes a select over `MAJORS` **plus an explicit first option, "I don't know yet"**, which is a valid answer and stores null.

The label changes with it — "What major do you want to study?" presumes an answer. Use: *"Do you already know what you'd study?"*, with the honest sub-line that most people do not and that it changes nothing about what they can enter this year.

Import the labels through a thin module if the section is a client component, the way the interest quiz reaches `career-titles.ts` — **do not import `majors.ts` into a client bundle.**

- [ ] **Step 3: Verify**

```bash
npm run test:unit && npx tsc --noEmit && npm run lint
```

Expected: PASS, then no output. Then walk onboarding in the browser and confirm "I don't know yet" saves and lands the student on `/dashboard/opportunities` with the companion at station 1.

- [ ] **Step 4: Commit**

```bash
git add app/planner/page.tsx lib/planner/load.ts components/onboarding/sections.tsx
git commit -m "feat(onboarding): 'I don't know yet' is an answer, not a dead end"
```

---

### Task C5: Release gate

- [ ] **Step 1: Stop dev, full build**

```bash
npm run build
```

Expected: clean. **Check the first-load JS column**: `/opportunities`, `/guide/*` and `/planner` must not have grown by more than ~10 kB. A larger jump means a prose registry followed the companion into a client bundle — the bundle test covers direct imports, the build output covers transitive ones.

- [ ] **Step 2: Everything**

```bash
npm run test:unit && node --import tsx scripts/test-session-checks.ts && npm run test:links
```

Expected: all pass, 0 dead links.

- [ ] **Step 3: Schema**

```bash
npm run db:check
```

Expected: all checks pass, including `beat_reactions`.

- [ ] **Step 4: Walk the circle yourself**

Sign in as a fresh test user (`npm run create:test-user`) and do the whole thing: arrive → react to three pairs → read what it says about you → open a kind of work → try it → open a subject → pick a country → commit to one real opportunity → see it on the plan. **Every screen must show the companion, and the station must never go backwards.**

- [ ] **Step 5: Open the PR**

```bash
git push -u origin HEAD
gh pr create --base develop --title "feat: the guided thread — a companion, reactions, and the majors layer" --body "$(cat <<'EOF'
Implements docs/superpowers/specs/2026-08-15-guided-thread-design.md.

Three streams: the majors layer (a new guide step and plan-pick kind), the
reaction engine and the seven-station thread, and the companion that renders it
on every screen.

Verified: build clean, 200+ unit tests, session checks, test:links 0 dead,
db:check all green, and the whole circle walked by hand on a fresh account.

Migration 0031_beat_reactions.sql must be applied before deploy.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

> **Before pushing to any branch that already has a PR, run `gh pr view <n> --json state`.** A merged PR is closed and does not take new commits; commits stranded on an already-merged branch have cost this project a release twice.

---

## Self-review

**Spec coverage.** §3 the companion → C1–C3. §4 the reaction engine → B1, B2, C2. §5 the thread and its seven stations → B3, B4, C1. §5 "station 3 is never empty" → B4's `try-it` branch points at `/opportunities?kind=simulation`, which is the ladder's first two rungs; **the third and fourth rungs (competition, "ask one person") are not built in this release** — the branch degrades to the catalog filter, which is honest but thinner than the spec describes. Flagged rather than silently dropped. §6 majors → A1–A5. §7 simulations two clicks away → B4 + C3. §7 planner and onboarding → C4. §8 motion → C2 step 4, C3 step 3. §9 testing → every task's tests, plus C3's two unusual ones. §10 scope → matches.

**Placeholders.** The two content registries (`majors.ts`, `beats.ts`) ship complete types, complete selectors, complete scoring and worked exemplars, with the writing rules stated as the tests that gate them. That is the correct level: the prose is content work an engineer performs against a green/red signal, not a design decision left open. Everything else — every type, function, migration, action and test — is complete code.

**Type consistency.** `PickCounts` gains `major` in A2 and is used in B3, B4, C1 and C3. `NextMoveInput` gains `tried` and `reachableMajors` in B4 and is constructed in C1 and C4. `StationFacts` is defined in B3 and constructed in C1 and C3's test. `BeatAnswers` is defined in B1, produced by B2's loader, consumed by C1. `isKnownBeat`/`isBeatReaction` are defined in C2 step 1 in `beats.ts` and consumed by the action in the same task. `guideMorph` gains `"major"` in A3 and is used in A3 and A4.

**One known ordering hazard**, called out in B4 rather than hidden: inserting branches into the move ladder changes what an existing input returns. Existing fixtures will fail and must be updated deliberately — that is the intended behaviour change, not a regression.
