// Curated US university dataset (§8). ~50 schools across the selectivity
// spectrum. Acceptance rates are decimals (0–1); SAT p25/p75 are total scores.
//
// FOUNDER: verify/update these numbers against each school's latest Common Data
// Set before relying on them publicly. Figures here are approximate, drawn from
// recently reported public data, and are meant as a reasonable v1 seed.

export type University = {
  id: string;
  name: string;
  acceptance_rate: number; // 0–1
  sat_p25: number;
  sat_p75: number;
  notes_international: string;
};

export const UNIVERSITIES: University[] = [
  { id: "harvard", name: "Harvard University", acceptance_rate: 0.032, sat_p25: 1500, sat_p75: 1580, notes_international: "Need-blind for all applicants incl. international; generous aid." },
  { id: "stanford", name: "Stanford University", acceptance_rate: 0.036, sat_p25: 1500, sat_p75: 1580, notes_international: "Need-blind for internationals; strong aid." },
  { id: "mit", name: "Massachusetts Institute of Technology", acceptance_rate: 0.04, sat_p25: 1520, sat_p75: 1580, notes_international: "Need-blind for all; meets full need." },
  { id: "princeton", name: "Princeton University", acceptance_rate: 0.04, sat_p25: 1500, sat_p75: 1580, notes_international: "Need-blind incl. international; no-loan aid." },
  { id: "yale", name: "Yale University", acceptance_rate: 0.046, sat_p25: 1500, sat_p75: 1580, notes_international: "Need-blind for internationals; meets full need." },
  { id: "columbia", name: "Columbia University", acceptance_rate: 0.039, sat_p25: 1490, sat_p75: 1570, notes_international: "Need-blind for internationals; meets full need." },
  { id: "upenn", name: "University of Pennsylvania", acceptance_rate: 0.06, sat_p25: 1490, sat_p75: 1570, notes_international: "Need-aware for internationals; strong aid if admitted." },
  { id: "brown", name: "Brown University", acceptance_rate: 0.05, sat_p25: 1500, sat_p75: 1570, notes_international: "Need-blind for internationals (recent policy); meets full need." },
  { id: "dartmouth", name: "Dartmouth College", acceptance_rate: 0.06, sat_p25: 1490, sat_p75: 1570, notes_international: "Need-blind for all applicants (recent policy)." },
  { id: "cornell", name: "Cornell University", acceptance_rate: 0.075, sat_p25: 1470, sat_p75: 1560, notes_international: "Need-aware for internationals; limited aid." },
  { id: "caltech", name: "California Institute of Technology", acceptance_rate: 0.03, sat_p25: 1530, sat_p75: 1590, notes_international: "Very STEM-focused; need-blind, meets full need." },
  { id: "uchicago", name: "University of Chicago", acceptance_rate: 0.054, sat_p25: 1500, sat_p75: 1570, notes_international: "Test-optional; strong aid incl. for internationals." },
  { id: "duke", name: "Duke University", acceptance_rate: 0.06, sat_p25: 1490, sat_p75: 1570, notes_international: "Need-aware for internationals; meets full need if admitted." },
  { id: "northwestern", name: "Northwestern University", acceptance_rate: 0.07, sat_p25: 1490, sat_p75: 1560, notes_international: "Need-aware for internationals." },
  { id: "jhu", name: "Johns Hopkins University", acceptance_rate: 0.07, sat_p25: 1510, sat_p75: 1570, notes_international: "Need-aware for internationals; strong in STEM/med." },
  { id: "vanderbilt", name: "Vanderbilt University", acceptance_rate: 0.07, sat_p25: 1480, sat_p75: 1560, notes_international: "Need-based + merit aid available to internationals." },
  { id: "rice", name: "Rice University", acceptance_rate: 0.08, sat_p25: 1490, sat_p75: 1570, notes_international: "Meets full need; international aid available." },
  { id: "washu", name: "Washington University in St. Louis", acceptance_rate: 0.12, sat_p25: 1470, sat_p75: 1560, notes_international: "Limited need-based aid for internationals; some merit." },
  { id: "notre-dame", name: "University of Notre Dame", acceptance_rate: 0.12, sat_p25: 1440, sat_p75: 1550, notes_international: "Need-aware for internationals." },
  { id: "georgetown", name: "Georgetown University", acceptance_rate: 0.12, sat_p25: 1410, sat_p75: 1550, notes_international: "Need-aware for internationals; strong in IR/business." },
  { id: "cmu", name: "Carnegie Mellon University", acceptance_rate: 0.11, sat_p25: 1500, sat_p75: 1560, notes_international: "Limited aid; very strong CS/engineering." },
  { id: "emory", name: "Emory University", acceptance_rate: 0.13, sat_p25: 1450, sat_p75: 1540, notes_international: "Some need-based aid for internationals." },
  { id: "usc", name: "University of Southern California", acceptance_rate: 0.1, sat_p25: 1450, sat_p75: 1540, notes_international: "Merit scholarships available to internationals." },
  { id: "uva", name: "University of Virginia", acceptance_rate: 0.19, sat_p25: 1410, sat_p75: 1530, notes_international: "Need-aware for internationals; some aid." },
  { id: "unc", name: "University of North Carolina, Chapel Hill", acceptance_rate: 0.19, sat_p25: 1390, sat_p75: 1520, notes_international: "Few international spots; competitive aid." },
  { id: "nyu", name: "New York University", acceptance_rate: 0.12, sat_p25: 1450, sat_p75: 1570, notes_international: "Large international population; aid is limited/competitive." },
  { id: "tufts", name: "Tufts University", acceptance_rate: 0.1, sat_p25: 1450, sat_p75: 1550, notes_international: "Need-aware for internationals; meets full need if admitted." },
  { id: "bc", name: "Boston College", acceptance_rate: 0.16, sat_p25: 1420, sat_p75: 1520, notes_international: "Limited aid for internationals." },
  { id: "bu", name: "Boston University", acceptance_rate: 0.14, sat_p25: 1380, sat_p75: 1530, notes_international: "Some merit aid; large international community." },
  { id: "northeastern", name: "Northeastern University", acceptance_rate: 0.06, sat_p25: 1450, sat_p75: 1540, notes_international: "Co-op program; merit aid for internationals." },
  { id: "rochester", name: "University of Rochester", acceptance_rate: 0.36, sat_p25: 1370, sat_p75: 1520, notes_international: "Generous merit aid for internationals; strong in research." },
  { id: "case-western", name: "Case Western Reserve University", acceptance_rate: 0.27, sat_p25: 1400, sat_p75: 1520, notes_international: "Good merit aid; strong STEM." },
  { id: "wake-forest", name: "Wake Forest University", acceptance_rate: 0.21, sat_p25: 1340, sat_p75: 1490, notes_international: "Test-optional; some merit aid." },
  { id: "lehigh", name: "Lehigh University", acceptance_rate: 0.29, sat_p25: 1330, sat_p75: 1480, notes_international: "Engineering/business strength; some aid." },
  { id: "brandeis", name: "Brandeis University", acceptance_rate: 0.39, sat_p25: 1350, sat_p75: 1510, notes_international: "Need-based and merit aid for internationals." },
  { id: "tulane", name: "Tulane University", acceptance_rate: 0.13, sat_p25: 1390, sat_p75: 1500, notes_international: "Merit scholarships; apply early." },
  { id: "miami", name: "University of Miami", acceptance_rate: 0.19, sat_p25: 1320, sat_p75: 1470, notes_international: "Merit scholarships available." },
  { id: "fordham", name: "Fordham University", acceptance_rate: 0.54, sat_p25: 1280, sat_p75: 1450, notes_international: "Merit aid; NYC location." },
  { id: "purdue", name: "Purdue University", acceptance_rate: 0.5, sat_p25: 1190, sat_p75: 1440, notes_international: "Excellent engineering; affordable; some merit." },

  // ── Expanded pool: public flagships & large publics ───────────────────────
  { id: "pitt", name: "University of Pittsburgh", acceptance_rate: 0.49, sat_p25: 1250, sat_p75: 1440, notes_international: "Strong in health sciences; some merit aid." },
  { id: "syracuse", name: "Syracuse University", acceptance_rate: 0.52, sat_p25: 1180, sat_p75: 1380, notes_international: "Strong comms/architecture; merit aid available." },

  // ── Expanded pool: tech-focused & mid-selective privates ──────────────────
  { id: "rpi", name: "Rensselaer Polytechnic Institute", acceptance_rate: 0.65, sat_p25: 1320, sat_p75: 1500, notes_international: "Strong engineering; merit aid for internationals." },
  { id: "rit", name: "Rochester Institute of Technology", acceptance_rate: 0.71, sat_p25: 1230, sat_p75: 1430, notes_international: "Co-op focus; merit aid available." },
  { id: "drexel", name: "Drexel University", acceptance_rate: 0.78, sat_p25: 1170, sat_p75: 1380, notes_international: "Co-op program; merit aid for internationals." },
  { id: "stevens", name: "Stevens Institute of Technology", acceptance_rate: 0.51, sat_p25: 1320, sat_p75: 1490, notes_international: "Strong engineering near NYC; merit aid." },
  { id: "wpi", name: "Worcester Polytechnic Institute", acceptance_rate: 0.58, sat_p25: 1300, sat_p75: 1470, notes_international: "Project-based engineering; merit aid." },
  { id: "villanova", name: "Villanova University", acceptance_rate: 0.25, sat_p25: 1340, sat_p75: 1500, notes_international: "Strong business/engineering; some aid." },
  { id: "santa-clara", name: "Santa Clara University", acceptance_rate: 0.45, sat_p25: 1290, sat_p75: 1450, notes_international: "Silicon Valley location; merit aid." },
  { id: "smu", name: "Southern Methodist University", acceptance_rate: 0.52, sat_p25: 1290, sat_p75: 1450, notes_international: "Merit scholarships available to internationals." },

  // ── Expanded pool: selective liberal arts colleges ────────────────────────
  { id: "williams", name: "Williams College", acceptance_rate: 0.085, sat_p25: 1410, sat_p75: 1550, notes_international: "Top LAC; need-blind for internationals, meets full need." },
  { id: "amherst", name: "Amherst College", acceptance_rate: 0.07, sat_p25: 1410, sat_p75: 1550, notes_international: "Need-blind for internationals; meets full need." },
  { id: "swarthmore", name: "Swarthmore College", acceptance_rate: 0.07, sat_p25: 1400, sat_p75: 1540, notes_international: "Need-aware for internationals; meets full need if admitted." },
  { id: "pomona", name: "Pomona College", acceptance_rate: 0.07, sat_p25: 1410, sat_p75: 1540, notes_international: "Need-blind for internationals; meets full need." },
  { id: "bowdoin", name: "Bowdoin College", acceptance_rate: 0.09, sat_p25: 1380, sat_p75: 1520, notes_international: "Need-aware for internationals; strong aid." },
  { id: "middlebury", name: "Middlebury College", acceptance_rate: 0.13, sat_p25: 1360, sat_p75: 1520, notes_international: "Need-aware for internationals; strong languages." },
  { id: "wellesley", name: "Wellesley College", acceptance_rate: 0.13, sat_p25: 1390, sat_p75: 1530, notes_international: "Women's college; need-blind for internationals." },
  { id: "carleton", name: "Carleton College", acceptance_rate: 0.17, sat_p25: 1380, sat_p75: 1530, notes_international: "Strong sciences; meets full need." },
  { id: "harvey-mudd", name: "Harvey Mudd College", acceptance_rate: 0.1, sat_p25: 1490, sat_p75: 1570, notes_international: "Elite STEM LAC; need-aware for internationals." },
  { id: "cmc", name: "Claremont McKenna College", acceptance_rate: 0.1, sat_p25: 1400, sat_p75: 1530, notes_international: "Econ/government focus; some aid for internationals." },
  { id: "colgate", name: "Colgate University", acceptance_rate: 0.12, sat_p25: 1370, sat_p75: 1520, notes_international: "Need-aware for internationals; strong aid if admitted." },
  { id: "hamilton", name: "Hamilton College", acceptance_rate: 0.12, sat_p25: 1400, sat_p75: 1530, notes_international: "Strong writing; need-aware for internationals." },
  { id: "davidson", name: "Davidson College", acceptance_rate: 0.17, sat_p25: 1340, sat_p75: 1490, notes_international: "Meets full need; honor code." },
  { id: "vassar", name: "Vassar College", acceptance_rate: 0.19, sat_p25: 1370, sat_p75: 1520, notes_international: "Need-blind for internationals (recent); meets full need." },
  { id: "grinnell", name: "Grinnell College", acceptance_rate: 0.11, sat_p25: 1400, sat_p75: 1530, notes_international: "Generous aid for internationals; strong sciences." },
  { id: "barnard", name: "Barnard College", acceptance_rate: 0.09, sat_p25: 1390, sat_p75: 1530, notes_international: "Women's college partnered with Columbia; need-aware for internationals." },
];

export const UNIVERSITY_NAMES = UNIVERSITIES.map((u) => u.name);

export function findUniversity(nameOrId: string): University | undefined {
  const q = nameOrId.trim().toLowerCase();
  return UNIVERSITIES.find(
    (u) => u.id === q || u.name.toLowerCase() === q
  );
}
