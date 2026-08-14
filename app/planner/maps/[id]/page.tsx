import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { Link } from "@/components/ui/Link";
import { loadMap } from "@/lib/planner/maps-load";
import { MapWorkspace } from "@/components/planner/MapWorkspace";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "A map — Compass",
  robots: { index: false, follow: false },
};

export default async function MapPage({ params }: { params: { id: string } }) {
  const session = await requireSession(`/planner/maps/${params.id}`);
  const root = await loadMap(session.id, params.id);

  // Someone else's map id, or one that has been deleted, is a real 404 — not a
  // 200 carrying "not found", which is the one status a wrong address must not
  // return. Same rule the guide's subject pages follow.
  if (!root) notFound();

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/planner/maps"
          className="text-xs text-ink-faint underline-offset-2 hover:underline focus-visible:focus-ring"
        >
          ← Your maps
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
          {root.label}
        </h1>
      </div>

      <MapWorkspace root={root} mapId={params.id} />
    </div>
  );
}
