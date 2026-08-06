import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { loadStudentContext } from "@/lib/dashboard/load";
import { OpportunitiesView } from "@/components/dashboard/views/OpportunitiesView";

export const dynamic = "force-dynamic";

// Opportunities inside the report shell — kept only for a student who already
// has an analysis. For them the report is something they built and return to,
// so the panel stays, with a door across to the dedicated section.
//
// The same loader the layout uses, so "has an analysis" means the same thing
// here as it does to the sidebar. React `cache` makes the second call free.
export default async function Page() {
  const session = await requireSession("/dashboard/opportunities");
  const { analysis } = await loadStudentContext(session);
  if (!analysis) redirect("/opportunities");
  return <OpportunitiesView />;
}
