import { Link } from "@/components/ui/Link";
import { ButtonLink } from "@/components/ui/Button";

// The empty state is not a dead end.
//
// A blank board with a link in it hands the work back to the student, which is
// the failure this product exists to avoid — the one repeated finding in the
// college-access literature is that information alone moves nothing and doing
// part of the work moves 25–30%. So this names two things they can actually
// enter, resolved on the server from their own matched list.
export function EmptyPlanner({
  suggestions,
}: {
  suggestions: { id: string; name: string; deadline: string }[];
}) {
  return (
    <div className="rounded-2xl border border-line bg-card p-5">
      <h2 className="text-base font-semibold text-ink">Nothing here yet</h2>
      <p className="mt-1 max-w-[60ch] text-sm leading-relaxed text-ink-soft">
        Your plan fills itself in. Say &ldquo;I&rsquo;m doing this&rdquo; on anything in
        Opportunities and it turns up here with its deadline, and you can add your own
        tasks alongside it.
      </p>

      {suggestions.length > 0 && (
        <>
          <p className="mt-4 text-xs font-medium uppercase tracking-[0.12em] text-ink-faint">
            You could start with
          </p>
          <ul className="mt-2 space-y-1.5">
            {suggestions.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/opportunities/${s.id}`}
                  className="text-sm font-medium text-accent-ink underline-offset-2 hover:underline focus-visible:focus-ring"
                >
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="mt-5">
        <ButtonLink href="/opportunities" variant="primary" size="sm">
          See what you can enter
        </ButtonLink>
      </div>
    </div>
  );
}
