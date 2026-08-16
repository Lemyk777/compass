import type { GuideSectionId } from "@/lib/data/guide-sections";

// WHAT THE STUDENT TOOK OUT OF THE GUIDE.
//
// The guide asks four questions about the world. This is the other half of that
// sentence: the answers a student claimed as theirs. Before it, the only thing
// the plan knew about the guide was four COUNTS on an empty state that vanished
// the moment anything was committed — so the section that promised to be a
// continuation of the guide could not name a single thing you had read.
//
// A pick is a fact and nothing more: *you put this on your plan*. It carries no
// rank, no score and no reason, because everything else about a country or an
// area of work already lives in a registry the guide owns, and a second copy
// here would be a snapshot of prose that gets revised. Same argument as the
// spine being a function rather than a table.
//
// PURE, and it imports one type. The guide's registries are ~4,000 lines of
// prose and must not follow a chip into a client bundle — the plan renders a
// pick from its stored label and href, which is all a chip needs.

/**
 * The four things a student can claim, and they are the guide's four steps.
 *
 * The kinds ARE the sections, deliberately: the join is only legible if the
 * plan groups what you picked the way the guide grouped what you read. A fifth
 * kind added here without a step in `GUIDE_SECTIONS` would be a thing the plan
 * can hold and the guide cannot produce.
 */
export type PickKind = "work" | "major" | "place" | "hub" | "route";

export type PickKindMeta = {
  kind: PickKind;
  /** The guide section this came out of. Same id, on purpose. */
  section: GuideSectionId;
  /** Position in the guide's zoom — what the student saw as "step N". */
  step: number;
  /** The heading over this group, in the student's own voice. */
  heading: string;
  /** One of them: "country", "city". Used for counts. */
  noun: string;
  nounPlural: string;
  /** Back to the full list, so a group is never a dead end. */
  listHref: string;
};

/**
 * In the guide's own order — work, then countries, then the cities inside them,
 * then what needs no move at all. That order is a zoom IN and it shipped
 * backwards once; it is not re-derived here, it is the same sequence
 * `GUIDE_SECTIONS` carries, and a unit test pins the two together.
 */
export const PICK_KINDS: PickKindMeta[] = [
  {
    kind: "work",
    section: "work",
    step: 1,
    heading: "Work you're looking at",
    noun: "kind of work",
    nounPlural: "kinds of work",
    listHref: "/guide/work",
  },
  {
    // No migration was needed for this one, and that is the no-`kind`-column
    // decision paying for itself: a pick's kind is the prefix of its `ref`, so
    // `major:computer-science` was storable the day the registry existed.
    kind: "major",
    section: "majors",
    step: 2,
    heading: "Subjects you’d study",
    noun: "subject",
    nounPlural: "subjects",
    listHref: "/guide/majors",
  },
  {
    kind: "place",
    section: "places",
    step: 3,
    heading: "Countries you're weighing",
    noun: "country",
    nounPlural: "countries",
    listHref: "/guide/places",
  },
  {
    kind: "hub",
    section: "cities",
    step: 4,
    heading: "Cities inside them",
    noun: "city",
    nounPlural: "cities",
    listHref: "/guide/cities",
  },
  {
    kind: "route",
    section: "from-home",
    step: 5,
    heading: "Ways in from where you are",
    noun: "route",
    nounPlural: "routes",
    listHref: "/guide/from-home",
  },
];

const KIND_SET = new Set<string>(PICK_KINDS.map((k) => k.kind));


/** One thing the student claimed, as stored. */
export type PlanPick = {
  /** "<kind>:<id>" — the row's identity, and where its kind comes from. */
  ref: string;
  label: string;
  href: string;
};

/** A pick with its kind resolved. */
export type ResolvedPick = PlanPick & { kind: PickKind; id: string };

/**
 * The row's identity. Composite because an area slug and a country id come out
 * of different registries and could collide — `law` is a plausible id in more
 * than one of them.
 */
export function pickRef(kind: PickKind, id: string): string {
  return `${kind}:${id}`;
}

/**
 * The reverse, and the reason there is no `kind` column: a stored type is a
 * second copy of something already written down, and two copies eventually
 * disagree. Same argument as `mapNodeKind` deriving a node's type from where it
 * points.
 *
 * Returns null for anything it does not recognise — a row written by an older
 * version, or a kind since removed. Callers DROP those rather than guessing,
 * because a chip whose kind we cannot name has no group to sit in.
 */
export function parsePickRef(ref: string): { kind: PickKind; id: string } | null {
  const at = ref.indexOf(":");
  if (at <= 0) return null;
  const kind = ref.slice(0, at);
  const id = ref.slice(at + 1);
  if (!KIND_SET.has(kind) || id.length === 0) return null;
  return { kind: kind as PickKind, id };
}

/**
 * Where a pick points, computed from the pick itself.
 *
 * The server action does NOT accept an href from the caller, and that is a
 * security property rather than tidiness: a server action is a public HTTP
 * endpoint, so a client-supplied path would let anyone store `/admin` under the
 * label "Germany" and have the plan render it as a country chip. The only paths
 * this table can hold are the ones this function can produce.
 *
 * The routes from home share one page — step 4 is a single list, not a page per
 * route — so every `route:` pick lands on the same href. That is correct rather
 * than a limitation: the ref stays unique, and the chip still opens the place
 * the student read it.
 */
export function pickHref(kind: PickKind, id: string): string {
  switch (kind) {
    case "work":
      return `/guide/work/${id}`;
    case "major":
      return `/guide/majors/${id}`;
    case "place":
      return `/guide/places/${id}`;
    case "hub":
      return `/guide/cities/${id}`;
    case "route":
      return "/guide/from-home";
  }
}

/**
 * Ids are slugs and nothing else. Bounded here rather than at the call site
 * because both the action and the tests need the same answer, and because a ref
 * is half of a database key.
 */
export function isPickId(id: string): boolean {
  return /^[a-z0-9][a-z0-9-]{0,63}$/.test(id);
}

export function isPickKind(v: string): v is PickKind {
  return KIND_SET.has(v);
}

export type PickGroup = PickKindMeta & { picks: ResolvedPick[] };

/**
 * The picks, grouped the way the guide groups its steps.
 *
 * **Empty groups are dropped, and that is the owner's call rather than an
 * omission.** A group headed "Countries you're weighing — nothing yet" is a
 * stop on a path with the paint changed, and the decision was that the plan
 * gets no path: what is missing is said ONCE, at the top, by the single next
 * move. A list of four half-empty headings would say it four times and mean it
 * less each time.
 *
 * Order within a group is the order they were given in — the loader sorts by
 * when they were added, so the newest thought is not buried under the oldest.
 * Nothing here ranks anything.
 */
export function groupPicks(picks: PlanPick[]): PickGroup[] {
  const resolved: ResolvedPick[] = [];
  for (const p of picks) {
    const parsed = parsePickRef(p.ref);
    // Unrecognised kinds are dropped, not coerced. There is no group for them.
    if (!parsed) continue;
    resolved.push({ ...p, kind: parsed.kind, id: parsed.id });
  }

  const groups: PickGroup[] = [];
  for (const meta of PICK_KINDS) {
    const mine = resolved.filter((p) => p.kind === meta.kind);
    if (mine.length > 0) groups.push({ ...meta, picks: mine });
  }
  return groups;
}

/** How many of each kind, for the rules that decide the next move. */
export type PickCounts = Record<PickKind, number>;

export function countPicks(picks: PlanPick[]): PickCounts {
  const counts: PickCounts = { work: 0, major: 0, place: 0, hub: 0, route: 0 };
  for (const p of picks) {
    const parsed = parsePickRef(p.ref);
    if (parsed) counts[parsed.kind] += 1;
  }
  return counts;
}
