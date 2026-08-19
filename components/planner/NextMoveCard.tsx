import { ButtonLink } from "@/components/ui/Button";
import { Link } from "@/components/ui/Link";
import type { NextMove } from "@/lib/data/next-move";

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
export function NextMoveCard({ move }: { move: NextMove }) {
  const urgent = move.tone === "urgent";

  return (
    <section
      aria-labelledby="next-move"
      // The border carries the tone, not a fill: a tinted panel this large
      // would compete with every card underneath it, and `reach-soft` behind
      // body copy is the sort of thing that passes a contrast test on the light
      // theme and fails on the dark one.
      // NO entrance animation, deliberately. A fade-up holds its content at
      // opacity 0 until the animation runs, and this is the most important
      // thing on the page — the section's whole guidance. The guide learned
      // this once already with its card list.
      className={`rounded-2xl border bg-card p-5 shadow-card sm:p-6 ${
        urgent ? "border-reach/45" : "border-accent/40"
      }`}
    >
      <p
        className={`flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide ${
          urgent ? "text-reach-ink" : "text-accent-ink"
        }`}
      >
        <Needle />
        {urgent ? "Deal with this first" : "Your next move"}
      </p>

      <h2
        id="next-move"
        className="mt-2.5 max-w-[34ch] text-balance text-xl font-semibold leading-snug tracking-tight text-ink sm:text-2xl"
      >
        {move.headline}
      </h2>

      <p className="mt-2.5 max-w-[54ch] text-pretty text-[0.95rem] leading-relaxed text-ink-soft">
        {move.why}
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
        <ButtonLink href={move.action.href} size="md">
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
