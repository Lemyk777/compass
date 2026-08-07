import Link from "@/components/ui/Link";
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
// Nothing here is a client component. The guide is curated data and links; the
// only interactive control in the whole section is the field chips.

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
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white"
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
            style={transitionName ? { viewTransitionName: transitionName } : undefined}
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
          className={`mt-1.5 inline-flex w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
            emphasis
              ? "bg-accent text-white"
              : "bg-accent-soft text-accent-ink"
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
        {/* Breadcrumb, not a bare "back": at three levels deep the student needs
            to know where they are, not only that there is a way out. */}
        <nav aria-label="Breadcrumb" className="text-sm">
          <ol className="flex flex-wrap items-center gap-1.5 text-ink-faint">
            {/* A 44px tap area on the breadcrumb: it is the primary way back out
                of a detail page on a phone, and at 17px it was a third of the
                minimum. */}
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
      {aside ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start lg:gap-8">
          <div className="min-w-0 space-y-4">{children}</div>
          <aside className="space-y-3 lg:sticky lg:top-20">{aside}</aside>
        </div>
      ) : (
        <div className="space-y-4">{children}</div>
      )}
    </div>
  );
}

/** One labelled idea. The tone carries the honesty rule: a catch looks like one. */
export function GuideBlock({
  label,
  tone = "plain",
  children,
}: {
  label: string;
  tone?: "plain" | "warn" | "good";
  children: React.ReactNode;
}) {
  const cls =
    tone === "warn"
      ? "border-reach/30 bg-reach-soft/40"
      : tone === "good"
        ? "border-accent/35 bg-accent-soft/25"
        : "border-line bg-card";
  return (
    <section className={`rounded-2xl border p-4 sm:p-5 ${cls}`}>
      <h2 className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
        {label}
      </h2>
      {/* Capped independently of the container: widening the shell must buy
          more columns, never longer lines. Unbounded, these ran to 131
          characters on a 1900px screen — nearly double the readable measure. */}
      <div className="mt-1.5 max-w-[60ch] text-sm leading-relaxed text-ink-soft">
        {children}
      </div>
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
        className="flex items-center justify-between gap-3 rounded-2xl bg-ink p-5 text-white transition-colors hover:bg-ink/90 focus-visible:focus-ring"
      >
        <span>
          <span className="text-sm font-semibold">
            See what you can enter this year
          </span>
          <span className="mt-0.5 block text-sm text-white/70">
            The catalog, filtered to your age and your fields.
          </span>
        </span>
        <span aria-hidden className="shrink-0">
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
