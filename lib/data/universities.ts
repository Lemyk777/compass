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
  { id: "ucla", name: "University of California, Los Angeles", acceptance_rate: 0.09, sat_p25: 1410, sat_p75: 1550, notes_international: "Very little aid for internationals; high OOS cost." },
  { id: "berkeley", name: "University of California, Berkeley", acceptance_rate: 0.11, sat_p25: 1370, sat_p75: 1530, notes_international: "Little aid for internationals; strong in most fields." },
  { id: "umich", name: "University of Michigan, Ann Arbor", acceptance_rate: 0.18, sat_p25: 1380, sat_p75: 1530, notes_international: "Limited aid for internationals; strong publics." },
  { id: "uva", name: "University of Virginia", acceptance_rate: 0.19, sat_p25: 1410, sat_p75: 1530, notes_international: "Need-aware for internationals; some aid." },
  { id: "unc", name: "University of North Carolina, Chapel Hill", acceptance_rate: 0.19, sat_p25: 1390, sat_p75: 1520, notes_international: "Few international spots; competitive aid." },
  { id: "gatech", name: "Georgia Institute of Technology", acceptance_rate: 0.17, sat_p25: 1370, sat_p75: 1520, notes_international: "Strong engineering/CS; limited aid for internationals." },
  { id: "nyu", name: "New York University", acceptance_rate: 0.12, sat_p25: 1450, sat_p75: 1570, notes_international: "Large international population; aid is limited/competitive." },
  { id: "tufts", name: "Tufts University", acceptance_rate: 0.1, sat_p25: 1450, sat_p75: 1550, notes_international: "Need-aware for internationals; meets full need if admitted." },
  { id: "bc", name: "Boston College", acceptance_rate: 0.16, sat_p25: 1420, sat_p75: 1520, notes_international: "Limited aid for internationals." },
  { id: "bu", name: "Boston University", acceptance_rate: 0.14, sat_p25: 1380, sat_p75: 1530, notes_international: "Some merit aid; large international community." },
  { id: "northeastern", name: "Northeastern University", acceptance_rate: 0.06, sat_p25: 1450, sat_p75: 1540, notes_international: "Co-op program; merit aid for internationals." },
  { id: "rochester", name: "University of Rochester", acceptance_rate: 0.36, sat_p25: 1370, sat_p75: 1520, notes_international: "Generous merit aid for internationals; strong in research." },
  { id: "case-western", name: "Case Western Reserve University", acceptance_rate: 0.27, sat_p25: 1400, sat_p75: 1520, notes_international: "Good merit aid; strong STEM." },
  { id: "wm", name: "College of William & Mary", acceptance_rate: 0.33, sat_p25: 1370, sat_p75: 1510, notes_international: "Limited international aid." },
  { id: "wake-forest", name: "Wake Forest University", acceptance_rate: 0.21, sat_p25: 1340, sat_p75: 1490, notes_international: "Test-optional; some merit aid." },
  { id: "lehigh", name: "Lehigh University", acceptance_rate: 0.29, sat_p25: 1330, sat_p75: 1480, notes_international: "Engineering/business strength; some aid." },
  { id: "brandeis", name: "Brandeis University", acceptance_rate: 0.39, sat_p25: 1350, sat_p75: 1510, notes_international: "Need-based and merit aid for internationals." },
  { id: "tulane", name: "Tulane University", acceptance_rate: 0.13, sat_p25: 1390, sat_p75: 1500, notes_international: "Merit scholarships; apply early." },
  { id: "miami", name: "University of Miami", acceptance_rate: 0.19, sat_p25: 1320, sat_p75: 1470, notes_international: "Merit scholarships available." },
  { id: "fordham", name: "Fordham University", acceptance_rate: 0.54, sat_p25: 1280, sat_p75: 1450, notes_international: "Merit aid; NYC location." },
  { id: "uw", name: "University of Washington", acceptance_rate: 0.43, sat_p25: 1240, sat_p75: 1460, notes_international: "Strong CS; very little aid for internationals." },
  { id: "wisconsin", name: "University of Wisconsin–Madison", acceptance_rate: 0.43, sat_p25: 1330, sat_p75: 1480, notes_international: "Limited international aid." },
  { id: "uiuc", name: "University of Illinois Urbana–Champaign", acceptance_rate: 0.45, sat_p25: 1300, sat_p75: 1490, notes_international: "Top engineering/CS; little need aid for internationals." },
  { id: "ut-austin", name: "University of Texas at Austin", acceptance_rate: 0.31, sat_p25: 1240, sat_p75: 1470, notes_international: "Strong business/engineering; limited aid." },
  { id: "ucsd", name: "University of California, San Diego", acceptance_rate: 0.24, sat_p25: 1310, sat_p75: 1500, notes_international: "Little aid for internationals; strong STEM." },
  { id: "purdue", name: "Purdue University", acceptance_rate: 0.5, sat_p25: 1190, sat_p75: 1440, notes_international: "Excellent engineering; affordable; some merit." },
  { id: "psu", name: "Pennsylvania State University", acceptance_rate: 0.55, sat_p25: 1160, sat_p75: 1380, notes_international: "Large school; limited international aid." },
  { id: "ohio-state", name: "Ohio State University", acceptance_rate: 0.53, sat_p25: 1240, sat_p75: 1430, notes_international: "Some merit scholarships for internationals." },
  { id: "michigan-state", name: "Michigan State University", acceptance_rate: 0.83, sat_p25: 1100, sat_p75: 1320, notes_international: "Accessible; merit aid available." },
  { id: "asu", name: "Arizona State University", acceptance_rate: 0.9, sat_p25: 1120, sat_p75: 1370, notes_international: "Very accessible; merit scholarships for internationals." },
  { id: "indiana", name: "Indiana University Bloomington", acceptance_rate: 0.82, sat_p25: 1130, sat_p75: 1350, notes_international: "Strong business (Kelley); merit aid." },
];

export const UNIVERSITY_NAMES = UNIVERSITIES.map((u) => u.name);

export function findUniversity(nameOrId: string): University | undefined {
  const q = nameOrId.trim().toLowerCase();
  return UNIVERSITIES.find(
    (u) => u.id === q || u.name.toLowerCase() === q
  );
}
