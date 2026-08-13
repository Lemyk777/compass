import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { Link } from "@/components/ui/Link";
import { loadMaps } from "@/lib/planner/maps-load";
import { plannerSection } from "@/lib/data/planner-sections";
import { NewMap } from "@/components/planner/NewMap";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your maps — Compass",
  robots: { index: false, follow: false },
};

export default async function MapsPage() {
  const session = await requireSession("/planner/maps");
  const maps = await loadMaps(session.id);
  const section = plannerSection("maps");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{section.title}</h1>
        <p className="mt-1 max-w-[60ch] text-sm leading-relaxed text-ink-soft">
          {section.blurb}
        </p>
      </div>

      {maps.length === 0 ? (
        <NewMap empty />
      ) : (
        <>
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {maps.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/planner/maps/${m.id}`}
                  className="block rounded-xl border border-line bg-card p-4 transition-colors hover:border-accent focus-visible:focus-ring"
                >
                  <span className="block text-sm font-medium text-ink">{m.label}</span>
                  <span data-num className="mt-1 block text-xs tabular-nums text-ink-faint">
                    {m.nodeCount === 0
                      ? "nothing on it yet"
                      : `${m.nodeCount} ${m.nodeCount === 1 ? "branch" : "branches"}`}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <NewMap />
        </>
      )}
    </div>
  );
}
