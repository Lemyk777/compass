// Branch-campus registry — the single source of truth for "hybrid" schools:
// universities physically located in one country that run admissions under
// ANOTHER country's system. NYU Shanghai is in China but you apply through the
// Common App and are reviewed holistically like any NYU applicant, so Compass
// scores it with the US methodology — and every surface that shows its odds
// explains that split (the "evaluated differently" panel).
//
// Scope note: only US-parent campuses are listed, because the US pathway is the
// only "parent system" Compass evaluates today. UK-parent campuses (Nottingham
// Ningbo, XJTLU) would need a UK engine first. Yale-NUS (closed 2025) and
// Texas A&M Qatar (winding down) are deliberately excluded.
//
// These schools ALSO live in lib/data/universities.ts (same id/name) so the US
// pipeline — picker, AI odds, benchmarks, deterministic recommender — treats
// them as regular US-system schools. This file only carries the hybrid
// metadata the UI needs to explain them.

/** Host-country codes we can render a flag for (see components/ui/Flag.tsx). */
export type BranchHostCode = "CN" | "AE" | "QA" | "JP";

export type BranchCampus = {
  /** Matches University.id in lib/data/universities.ts. */
  id: string;
  /** Must equal University.name (and the name used in other country datasets). */
  name: string;
  /** The US parent institution whose system governs admissions. */
  parent_name: string;
  host_city: string;
  host_country: string;
  host_code: BranchHostCode;
  /** How the student actually applies, for the explainer text. */
  application: string;
};

export const BRANCH_CAMPUSES: BranchCampus[] = [
  {
    id: "nyu-shanghai",
    name: "NYU Shanghai",
    parent_name: "New York University",
    host_city: "Shanghai",
    host_country: "China",
    host_code: "CN",
    application: "the Common App",
  },
  {
    id: "nyu-abu-dhabi",
    name: "NYU Abu Dhabi",
    parent_name: "New York University",
    host_city: "Abu Dhabi",
    host_country: "the UAE",
    host_code: "AE",
    application: "the Common App",
  },
  {
    id: "duke-kunshan",
    name: "Duke Kunshan University",
    parent_name: "Duke University",
    host_city: "Kunshan",
    host_country: "China",
    host_code: "CN",
    application: "the Common App",
  },
  {
    id: "georgetown-qatar",
    name: "Georgetown University in Qatar",
    parent_name: "Georgetown University",
    host_city: "Doha",
    host_country: "Qatar",
    host_code: "QA",
    application: "the Georgetown application",
  },
  {
    id: "northwestern-qatar",
    name: "Northwestern University in Qatar",
    parent_name: "Northwestern University",
    host_city: "Doha",
    host_country: "Qatar",
    host_code: "QA",
    application: "the Common App",
  },
  {
    id: "cmu-qatar",
    name: "Carnegie Mellon University in Qatar",
    parent_name: "Carnegie Mellon University",
    host_city: "Doha",
    host_country: "Qatar",
    host_code: "QA",
    application: "the Common App",
  },
  {
    id: "temple-japan",
    name: "Temple University, Japan Campus",
    parent_name: "Temple University",
    host_city: "Tokyo",
    host_country: "Japan",
    host_code: "JP",
    application: "TUJ's own online application (rolling, year-round)",
  },
];

/**
 * Hybrid metadata for a school, matched by dataset id or exact name (the
 * analysis stores school NAMES; other country datasets use the same names, so
 * "NYU Abu Dhabi" resolves from the UAE tab too). Undefined for regular schools.
 */
export function branchCampusFor(nameOrId: string): BranchCampus | undefined {
  const q = nameOrId.trim().toLowerCase();
  return BRANCH_CAMPUSES.find(
    (b) => b.id === q || b.name.toLowerCase() === q
  );
}
