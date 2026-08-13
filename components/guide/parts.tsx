import Link from "@/components/ui/Link";
import { DetailExit } from "@/components/guide/DetailExit";
import type { FacultyValue } from "@/lib/data/faculties";
import { withFields } from "@/lib/data/guide-fields";
import {
  nextGuideSection,
  type GuideSectionId,
} from "@/lib/data/guide-sections";

// The pieces every guide page is built from, in one file on purpose: three
// levels of depth (index → list → one subject) only read as one section if they
// are literally made of the same parts.
//
// Everything here renders on the server. The two client islands it reaches for
// are the field chips and `DetailExit` — the way out of a sub-page, which has
// to be one because it listens for Escape and watches whether it is still on
// screen.

/**
 * The band every list page opens with: the step's heading on the left, the
 * field filter on the right once there is room for it.
 *
 * Stacked, those were two full-width rows before a single card appeared. Side
 * by side they cost one row, which is most of the reason a wide screen now
 * shows content where it used to show scrollbar. `items-start` keeps the filter
 * from stretching to the heading's height, and its own column is capped so
 * expanding the chips cannot drag the layout around.
 */
export function ListHead({
  intro,
  aside,
}: {
  intro: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
      <div className="min-w-0 flex-1">{intro}</div>
      {aside && <div className="lg:w-[24rem] lg:shrink-0">{aside}</div>}
    </div>
  );
}

/** A list-page heading: what this step is, and what it will not pretend to be. */
export function SectionIntro({
  step,
  title,
  blurb,
  count,
}: {
  step: number;
  title: string;
  blurb: string;
  count?: string;
}) {
  return (
    <header>
      <div className="flex items-center gap-2.5">
        <span
          data-num
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-semibold text-surface"
        >
          {step}
        </span>
        <h1 className="text-balance text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          {title}
        </h1>
      </div>
      <p className="mt-2.5 max-w-2xl text-pretty text-base leading-relaxed text-ink-soft">
        {blurb}
      </p>
      {count && <p className="mt-1.5 text-sm text-ink-faint">{count}</p>}
    </header>
  );
}

/**
 * A card that leads somewhere. It used to be a `<button>` opening a sheet, which
 * cost the student everything an anchor gives for free — middle-click, open in a
 * new tab, copy link, and a URL they can come back to.
 */
export function GuideCard({
  href,
  title,
  /** A short qualifier that belongs ON the title line — "Almaty *Kazakhstan*". */
  sub,
  /**
   * A longer locator that does not. A destination's `where` is a full clause
   * ("Europe — London, and strong universities spread across the country"), and
   * inline it turns the title into a run-on the eye cannot break.
   */
  meta,
  line,
  badge,
  /**
   * Tints the whole card. Separate from `badge` on purpose: "Odds modelled"
   * labels half the destinations, and if a label were enough to light a card up
   * then "closest to what you said" — which is the one place in the guide that
   * points at a single answer — would stop standing out from the rest.
   */
  emphasis = false,
  /**
   * Ties this card to the `<h1>` of the page it opens: the browser morphs one
   * into the other instead of cutting. It is the one animation in the section
   * that carries information — it answers "where did this page come from?" —
   * which is the bar motion has to clear (decoration doesn't).
   *
   * Must be unique in the document, so it is derived from the subject's own id.
   * The global `prefers-reduced-motion` guard in globals.css already disables
   * `::view-transition-*`, so this costs nothing for a reader who opted out.
   */
  transitionName,
  cta,
}: {
  href: string;
  title: string;
  sub?: string;
  meta?: string;
  line: string;
  badge?: string;
  emphasis?: boolean;
  transitionName?: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      // Hover lifts half a step and takes the existing card shadow; press scales
      // down. Both are transform/shadow only, so neighbours never move and this
      // contributes nothing to CLS.
      //
      // There is deliberately NO staggered entrance here, and it was tried. Two
      // reasons it came out: a fade-up holds the card at opacity 0 until the
      // animation runs, which makes the page's actual content depend on an
      // animation finishing; and it fights the morph above — a view transition
      // snapshots the incoming page, so the card the title is flying back into
      // was itself still sliding up. One motion per view, and it is the one that
      // carries meaning.
      className={`group flex h-full flex-col rounded-2xl border p-4 transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-card active:scale-[0.99] active:duration-75 focus-visible:focus-ring motion-reduce:transform-none motion-reduce:transition-none ${
        emphasis
          ? "border-accent/50 bg-accent-soft/25 hover:border-accent"
          : "border-line bg-card hover:border-accent"
      }`}
    >
      <span className="flex items-start justify-between gap-2">
        <span className="min-w-0">
          <span
            className="text-sm font-semibold text-ink"
            style={
              transitionName
                ? { viewTransitionName: transitionName }
                : undefined
            }
          >
            {title}
          </span>
          {sub && (
            <span className="ml-1.5 text-sm font-normal text-ink-faint">
              {sub}
            </span>
          )}
        </span>
        <span
          aria-hidden
          className="mt-0.5 shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-accent motion-reduce:transition-none"
        >
          &rarr;
        </span>
      </span>
      {meta && (
        <span className="mt-1 text-xs leading-relaxed text-ink-faint">
          {meta}
        </span>
      )}
      {badge && (
        <span
          className={`mt-1.5 inline-flex w-fit rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
            emphasis ? "bg-accent text-on-fill" : "bg-accent-soft text-accent-ink"
          }`}
        >
          {badge}
        </span>
      )}
      <span className="mt-1 line-clamp-3 text-sm leading-relaxed text-ink-soft">
        {line}
      </span>
      <span className="mt-2.5 text-xs font-medium text-accent">{cta}</span>
    </Link>
  );
}

/**
 * The frame every level-three page shares: where you are, what this is, and one
 * line of it before any detail. Copied from the destination profile, which had
 * the right shape already — the area and city pages were sheets and had none.
 */
export function DetailShell({
  crumb,
  crumbHref,
  title,
  sub,
  lead,
  /** The other half of the card→page morph. Must match the card's exactly. */
  transitionName,
  /**
   * The onward links — where else to go from this subject. Below `lg` it simply
   * follows the content, as it always did. From `lg` it becomes a rail beside
   * it, which is the single biggest cut to the scroll on a wide screen: the
   * "where next" material stops being three more screens of height and becomes
   * the empty column that was there anyway.
   *
   * Sticky at `top-20` rather than `top-6` because StudentNav is itself sticky
   * and about 57px tall — a rail pinned higher slides underneath it.
   */
  aside,
  children,
}: {
  crumb: string;
  crumbHref: string;
  title: string;
  sub?: string;
  lead?: string;
  transitionName?: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div>
        {/* Where you are on the left, the way out on the right. Both, because
            they answer different questions: at three levels deep a student
            needs to know where they are, and a breadcrumb still reads as
            navigation rather than as "this closes". */}
        <div className="flex items-center justify-between gap-3">
          <nav aria-label="Breadcrumb" className="min-w-0 text-sm">
            <ol className="flex flex-wrap items-center gap-1.5 text-ink-faint">
              {/* A 44px tap area on the breadcrumb: it is the primary way back
                  out of a detail page on a phone, and at 17px it was a third of
                  the minimum. */}
              <li>
                <Link
                  href="/guide"
                  className="inline-flex min-h-11 items-center underline-offset-2 transition-colors hover:text-ink hover:underline focus-visible:focus-ring"
                >
                  The guide
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li>
                <Link
                  href={crumbHref}
                  className="inline-flex min-h-11 items-center underline-offset-2 transition-colors hover:text-ink hover:underline focus-visible:focus-ring"
                >
                  {crumb}
                </Link>
              </li>
            </ol>
          </nav>
          <DetailExit href={crumbHref} label={crumb} />
        </div>
        <h1
          className="mt-3 text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl"
          style={
            transitionName ? { viewTransitionName: transitionName } : undefined
          }
        >
          {title}
        </h1>
        {sub && <p className="mt-1 text-sm text-ink-faint">{sub}</p>}
        {lead && (
          <p className="mt-3 max-w-[60ch] text-pretty text-base leading-relaxed text-ink-soft">
            {lead}
          </p>
        )}
      </div>
      {/* `space-y-8` and not `space-y-4`, and it is half of the page's rhythm.
          The other half is the rule `GuidePart` carries: 32px here plus its own
          32px of top padding puts 64px and a hairline between two topics —
          balanced, half above the line and half below — against 20px between
          two blocks inside one. It used to be 16px against 12px: a 1.33:1
          ratio, which is proximity switched off, and it is why nineteen boxes
          read as one flat list rather than as six answers to six questions. */}
      {aside ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start lg:gap-8">
          <div className="min-w-0 space-y-8">{children}</div>
          <aside className="space-y-3 lg:sticky lg:top-20">{aside}</aside>
        </div>
      ) : (
        <div className="space-y-8">{children}</div>
      )}
    </div>
  );
}

/**
 * A named part of a subject page, with an anchor.
 *
 * The subject pages were a stack of seven to nine equally-weighted boxes, and a
 * reader could not tell from any height what the page contained or where they
 * were in it — the "wall of text" complaint, which was really a complaint about
 * having no skeleton. Two or three parts give the page a shape, and the shape is
 * what `PageContents` above then lists.
 *
 * `scroll-mt-24` because StudentNav is sticky: without it, jumping to a part
 * puts its heading underneath the bar.
 */
export function GuidePart({
  id,
  step,
  title,
  children,
}: {
  id: string;
  /**
   * Its place in the page's own map. `PageContents` has numbered the parts 1..n
   * at the top of every subject page for as long as it has existed, and the
   * sections themselves carried no number — so the map promised a structure the
   * page then refused to confirm. Passed from the same array both of them read.
   */
  step?: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    // The rule is the point. A topic change used to be announced by 16px of air
    // and an 18px heading — 4px larger than the headings of its own children —
    // which on a phone is a 2%-of-a-screen signal for "a new subject starts
    // here". Now: a hairline the full width of the column, 32px before the
    // heading, the number the contents list promised, and 22px of type.
    <section id={id} className="scroll-mt-24 border-t border-line pt-8">
      <h2 className="flex items-center gap-2.5 text-xl font-semibold tracking-tight text-ink sm:text-[1.375rem]">
        {step != null && (
          <span
            data-num
            aria-hidden
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-semibold text-surface"
          >
            {step}
          </span>
        )}
        {title}
      </h2>
      <div className="mt-4 space-y-5">{children}</div>
    </section>
  );
}

/**
 * The map of the page, at the top of it.
 *
 * Deliberately in the content column and not in the sticky rail: below `lg` the
 * rail stacks BELOW the content, so a contents list living there would arrive
 * after the thing it was meant to introduce — useless for exactly the phone
 * reader who needs it most.
 *
 * Plain `<a href="#…">`, so it costs no JavaScript and works before hydration.
 */
export function PageContents({
  parts,
}: {
  parts: { id: string; title: string }[];
}) {
  if (parts.length < 2) return null;
  return (
    <nav
      aria-label="On this page"
      className="rounded-2xl border border-line bg-card px-4 py-3 sm:px-5"
    >
      <h2 className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
        On this page
      </h2>
      {/* One scrolling row on a phone, wrapping from `sm`.
          Wrapping, these chips carry long titles ("Research and writing that
          publishes you"), so each one took a row of its own: six parts made a
          344px map on an 812px screen — 42% of the viewport spent telling a
          reader what was below it, which pushed the first actual section past
          the fold. Same treatment the section tabs and the category tabs
          already use, and for the same reason. The chips keep their 44px.
          `-mx-1 px-1` so a focus ring on the first chip is not clipped by the
          scroll container. */}
      <ol className="-mx-1 mt-2 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:pb-0 [&::-webkit-scrollbar]:hidden">
        {parts.map((part, i) => (
          <li key={part.id} className="shrink-0">
            <a
              href={`#${part.id}`}
              className="inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-full border border-line bg-surface px-3.5 text-sm font-medium text-ink-soft transition-colors hover:border-accent hover:text-ink focus-visible:focus-ring sm:whitespace-normal"
            >
              <span aria-hidden className="text-xs text-ink-faint">
                {i + 1}
              </span>
              {part.title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/**
 * Who the subject is for, and who it is not — the one piece of a profile that
 * points at a reader rather than describing a place.
 *
 * It opens the page now. It used to close it, under seven blocks of prose: the
 * student who left halfway down never reached the only two sentences addressed
 * to them, and the page read as an encyclopaedia entry because its answer was
 * buried under its description.
 *
 * `avoid` is optional because a city states both halves in one field; a country
 * states them separately, and there the two sit level — an appeal without its
 * catch beside it is an advert, which is the rule the whole layer is built on.
 */
export function ForYou({
  suits,
  avoid,
  suitsLabel = "This suits you if…",
  avoidLabel = "Look elsewhere if…",
}: {
  suits: string;
  avoid?: string;
  suitsLabel?: string;
  avoidLabel?: string;
}) {
  return (
    <section className={`grid gap-3 ${avoid ? "sm:grid-cols-2" : ""}`}>
      <div className="rounded-2xl border border-accent/40 bg-accent-soft/25 p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-ink">{suitsLabel}</h2>
        <p className="mt-1.5 max-w-[60ch] text-sm leading-relaxed text-ink-soft">
          {suits}
        </p>
      </div>
      {avoid && (
        <div className="rounded-2xl border border-reach/40 bg-reach-soft/25 p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-ink">{avoidLabel}</h2>
          <p className="mt-1.5 max-w-[60ch] text-sm leading-relaxed text-ink-soft">
            {avoid}
          </p>
        </div>
      )}
    </section>
  );
}

/**
 * One labelled idea. The tone carries the honesty rule: a catch looks like one.
 *
 * Its label is an `h3`: these sit inside a `GuidePart`, and a page whose
 * headings all claim the same level is a wall to a screen reader even when it
 * looks structured on screen.
 *
 * **A plain block is bare, and that is the fix for "wall of cards".** A country
 * profile drew nineteen bordered boxes, fifteen of them pixel-identical — same
 * white, same `#E6E2DA`, same 20px radius, same padding — spending a fifth of
 * the page's height on card chrome and telling a reader nothing, because a
 * surface that means everything means nothing. Prose is not an object; it does
 * not need a container. Only a block that makes a CLAIM about the reader keeps
 * a tint, which is what makes the catch visible at a glance instead of uniform.
 *
 * Hierarchy inside a bare block therefore comes from weight and colour rather
 * than size — 14px/600 on `ink` over 14px/400 on `ink-soft`. Size is spent one
 * level up, where `GuidePart` now has 22px, a number and a rule to itself.
 */
export function GuideBlock({
  label,
  tone = "plain",
  children,
}: {
  label: string;
  tone?: "plain" | "warn" | "good";
  children: React.ReactNode;
}) {
  const heading = <h3 className="text-sm font-semibold text-ink">{label}</h3>;
  // Capped independently of the container: widening the shell must buy more
  // columns, never longer lines. Unbounded, these ran to 131 characters on a
  // 1900px screen — nearly double the readable measure.
  const body = (
    <div className="mt-1.5 max-w-[60ch] text-sm leading-relaxed text-ink-soft">
      {children}
    </div>
  );

  if (tone === "plain") {
    return (
      <section>
        {heading}
        {body}
      </section>
    );
  }

  return (
    <section
      className={`rounded-2xl border p-4 sm:p-5 ${
        tone === "warn"
          ? "border-reach/30 bg-reach-soft/40"
          : "border-accent/35 bg-accent-soft/25"
      }`}
    >
      {heading}
      {body}
    </section>
  );
}

/**
 * The footer that keeps the zoom moving. Splitting one page into four made each
 * one end somewhere, and a page that ends with nothing to do is where a student
 * leaves; this names the next step by what it answers.
 */
export function NextStep({
  from,
  fields,
}: {
  from: GuideSectionId;
  fields: FacultyValue[] | null;
}) {
  const next = nextGuideSection(from);
  if (!next) {
    return (
      <Link
        href="/opportunities"
        // `bg-accent`, not `bg-ink`. `ink` is nearly white in dark mode, so a
        // p-5 slab of it was a 336×106 white block on a dark page — the classic
        // inversion trap, and at CARD size it reads as broken rather than as a
        // primary button. The rule that came out of it: `bg-ink text-surface` is
        // fine for a control (a pill, a badge, an h-10 button), never for a
        // surface. Anything that fills an area uses the accent, which themes.
        className="group flex items-center justify-between gap-3 rounded-2xl bg-accent p-5 text-on-fill transition-[background-color,transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lift focus-visible:focus-ring motion-reduce:transform-none motion-reduce:transition-none"
      >
        <span>
          <span className="text-sm font-semibold">
            See what you can enter this year
          </span>
          <span className="mt-0.5 block text-sm text-on-fill/75">
            The catalog, filtered to your age and your fields.
          </span>
        </span>
        <span
          aria-hidden
          className="shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none"
        >
          &rarr;
        </span>
      </Link>
    );
  }
  return (
    <Link
      href={withFields(next.href, fields)}
      className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-card p-5 transition-colors hover:border-accent focus-visible:focus-ring"
    >
      <span>
        <span className="text-xs font-medium uppercase tracking-[0.1em] text-ink-faint">
          Step {next.step}
        </span>
        <span className="mt-0.5 block text-sm font-semibold text-ink">
          {next.title}
        </span>
      </span>
      <span aria-hidden className="shrink-0 text-ink-faint">
        &rarr;
      </span>
    </Link>
  );
}
