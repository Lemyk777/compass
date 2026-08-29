import { ButtonLink } from "@/components/ui/Button";
import { Link } from "@/components/ui/Link";
import type { NextMove } from "@/lib/data/next-move";

import type { JobSimulation } from "@/lib/data/simulations";

// THE ONE LOUD THING ON THE PAGE.
//
// The plan's whole guidance is a single move, so a single object carries it,
// and everything around it is quiet by comparison. Spending the section's
// emphasis anywhere else — a tinted board column, a coloured lens switcher —
// would put two things at the top of the hierarchy, which is the same as
// putting nothing there.
//
// **The `why` line is not decoration and never collapses.** "Go and read about
// countries" is an instruction; "you marked Data & AI — five countries actually
// hire for it" is a reason, and a reason is the thing a consultant gives that a
// form does not. It is what the founder meant by "there is no accompaniment":
// the product told students what it could do and never once said why it was
// saying it to them.
//
// A server component. It renders a value computed by a pure function, so there
// is nothing here to hydrate.
export function NextMoveCard({ move, simulation }: { move: NextMove; simulation?: JobSimulation | null }) {
  const urgent = move.tone === "urgent";

  return (
    <section
      aria-labelledby="next-move"
      className={`rounded-2xl border bg-gradient-to-br from-card via-card to-accent-soft/20 p-6 shadow-card hover:shadow-lift transition-all duration-300 sm:p-7 ${
        urgent ? "border-reach/50" : "border-accent/40"
      }`}
    >
      <div className="flex items-center">
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-semibold uppercase tracking-wider ${
            urgent ? "bg-reach-soft text-reach-ink" : "bg-accent-soft text-accent-ink"
          }`}
        >
          <Needle />
          {urgent ? "Deal with this first" : "Your strategic move"}
        </span>
      </div>

      <h2
        id="next-move"
        className="mt-3.5 max-w-[34ch] text-balance text-xl font-bold leading-snug tracking-tight text-ink sm:text-2xl"
      >
        {move.headline}
      </h2>

      <p className="mt-2.5 max-w-[58ch] text-pretty text-[0.95rem] leading-relaxed text-ink-soft">
        {move.why}
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
        <ButtonLink href={move.action.href} size="md" className="shadow-sm">
          {move.action.label}
        </ButtonLink>
        {/* At most one alternative, ever. Two beside a recommendation is a
            menu, which is what this exists to replace. */}
        {move.alt && (
          <Link
            href={move.alt.href}
            className="inline-flex min-h-11 items-center text-sm font-medium text-ink-soft underline-offset-4 transition-colors hover:text-ink hover:underline focus-visible:focus-ring"
          >
            {move.alt.label}
          </Link>
        )}
      </div>

      {simulation && (
        <div className="mt-6 rounded-2xl bg-gradient-to-r from-accent-soft/80 via-accent-soft/50 to-transparent p-5 shadow-sm border border-accent/25">
          <p className="text-sm font-semibold text-accent-ink mb-1 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Recommended Simulation
          </p>
          <p className="text-sm text-ink-soft mb-3">
            Based on your interests, we recommend trying the <strong>{simulation.title}</strong> by {simulation.provider}.
          </p>
          <a
            href={simulation.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm font-medium text-accent-ink hover:underline underline-offset-4 focus-visible:focus-ring"
          >
            Try it for free &rarr;
          </a>
        </div>
      )}
    </section>
  );
}

/**
 * A compass needle, pointing along the reading direction.
 *
 * The product's own instrument rather than a generic chevron or lightbulb — it
 * is the one place in the section where an ornament is allowed, and it should
 * at least be ours.
 *
 * It paints itself with `currentColor` and sets no colour of its own, so it
 * inherits the eyebrow's text token and cannot drift from the words beside it.
 * That is also why it needs no exemption from the fill-as-foreground rule: the
 * colour it takes is already a foreground one.
 */
function Needle() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      aria-hidden="true"
      className="shrink-0"
    >
      <circle
        cx="12"
        cy="12"
        r="9.25"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        opacity="0.4"
      />
      <path d="M17 7l-3.1 7.9L6 18l3.1-7.9L17 7z" fill="currentColor" />
    </svg>
  );
}
