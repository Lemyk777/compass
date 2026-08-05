import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { OpportunitiesView } from "@/components/dashboard/views/OpportunitiesView";

export const dynamic = "force-dynamic";

// Opportunities inside the report shell — kept ONLY for a student who already
// has an analysis.
//
// The reasoning: for them the report is a place they built and come back to,
// and pulling a panel out of it mid-flight would look like the feature was
// deleted. They keep this panel, with a door across to the dedicated section
// (see SectionDoor in OpportunitiesView) where the questionnaires and the guide
// live and everything is arranged around Opportunities rather than around a
// profile score.
//
// A student with no analysis has no report to speak of, so this address would
// hand them an eight-tab analysis console for a product they never asked for —
// they go straight to the dedicated section instead.
export default async function Page() {
  const session = await requireSession("/dashboard/opportunities");
  const supabase = createClient();
  const { count } = await supabase
    .from("analyses")
    .select("id", { count: "exact", head: true })
    .eq("user_id", session.id);

  if (!count) redirect("/opportunities");

  return <OpportunitiesView />;
}
