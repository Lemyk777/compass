import { Link } from "@/components/ui/Link";
import {
  TRY_IT_OPPORTUNITY_ID,
  TRY_IT_PLATFORM,
  type JobSimulation,
} from "@/lib/data/try-it";

// A few hours of the actual job, on the page about that job.
//
// It sits inside "Test it this month" — the one part of an area page a reader
// can act on today — and under the prose that was already there, because the
// prose says what to do generally and this says what to go and do now.
//
// **It names the employer and describes the task, and links only to the
// platform.** Two separate reasons, and neither is fussiness: the catalog owns
// links because `test:links` is what keeps them alive, and the individual
// company pages sit behind bot protection that gate cannot pass; and a product
// title is the half that rots, while "J.P. Morgan built one where you value a
// company and put the pitch together" survives a rename. So the employer is the
// search key, said out loud.
//
// A server component. Its registry is prose and it takes the list as props, the
// same rule `WorkList` follows.
export function TryTheWork({
  simulations,
  /** For the sentence that says what these are a try AT. */
  areaTitle,
}: {
  simulations: JobSimulation[];
  areaTitle: string;
}) {
  if (simulations.length === 0) return null;

  return (
    <section className="rounded-2xl border border-line bg-card p-4 sm:p-5">
      <h3 className="text-base font-semibold text-ink">
        Do the job for an afternoon, before you pick a degree
      </h3>
      <p className="mt-1.5 max-w-[54ch] text-base leading-relaxed text-ink-soft">
        Employers build these to recruit, which is why they are honest about
        what the work is. You do the real tasks, unpaid and ungraded, and find
        out whether you can stand it. Free, no deadline, nothing to win.
      </p>

      <ul className="mt-4 space-y-3">
        {simulations.map((s, i) => (
          <li
            // The employer is not unique — one company can build a try at two
            // different areas — so the index takes part in the key. Nothing here
            // reorders, so it is stable.
            key={`${s.employer}-${i}`}
            className="border-t border-line pt-3 first:border-t-0 first:pt-0"
          >
            <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-[0.95rem] font-semibold text-ink">
                {s.employer}
              </span>
              <span data-num className="text-xs tabular-nums text-ink-faint">
                {s.hours}
              </span>
            </p>
            <p className="mt-1 max-w-[54ch] text-base leading-relaxed text-ink-soft">
              {s.what}
            </p>
          </li>
        ))}
      </ul>

      <p className="mt-4 max-w-[54ch] text-base leading-relaxed text-ink-soft">
        {/* The honest caveat, and it doubles as the instruction: the employer is
            the stable half of the claim and it is also the search term. */}
        These are on {TRY_IT_PLATFORM}. Search it by the employer&rsquo;s name —
        what each one is called changes, and who built it does not.
      </p>

      <Link
        href={`/opportunities/${TRY_IT_OPPORTUNITY_ID}`}
        className="mt-1 inline-flex min-h-11 items-center text-sm font-medium text-accent-ink underline-offset-4 transition hover:underline focus-visible:focus-ring"
      >
        Open {TRY_IT_PLATFORM} from the catalog
        <span aria-hidden className="ml-1">
          &rarr;
        </span>
      </Link>

      <p className="sr-only">
        These are ways to try {areaTitle} before committing to it.
      </p>
    </section>
  );
}
