// Structured eligibility — who can ACTUALLY enter an opportunity.
//
// Until now eligibility was a human sentence shown on the card, and matching
// ignored it entirely. That produced two visibly wrong recommendations for our
// audience: US-only competitions ("Grades 9–12 at a US school") offered to
// students in Kazakhstan, and senior-only programmes marked "Recommended for
// you" for a 9th grader.
//
// The gate below is derived from that same sentence by a deliberately strict
// parser: it only fires on patterns we actually write, and anything it cannot
// read confidently yields no constraint, i.e. the old permissive behaviour.
// An entry can also carry an explicit `gate`, which always wins.

export type EligibilityGate = {
  /** ISO-2 codes an entrant must belong to. Absent = no country restriction. */
  countries?: string[];
  /** Entry is through a national team/olympiad, not a direct application. */
  viaNationalSelection?: boolean;
  /** School-grade bounds, as the organizer states them (9–12 style). */
  gradeMin?: number;
  gradeMax?: number;
  /** Age bounds, used when the rule is an age rather than a grade. */
  ageMin?: number;
  ageMax?: number;
};

// "US school", "US citizens", "US congressional districts", "(US)"…
const US_ONLY =
  /\bat a US school\b|\bUS citizens?\b|\bU\.S\. citizens?\b|congressional districts?|\(US\)/i;

// Phrases that mean "your country picks a team" rather than "apply yourself".
const VIA_NATIONAL =
  /via (?:your )?(?:country'?s? )?national|national (?:team )?selection|via national|through your country|your country's (?:JA|national)|national round|affiliate programs?/i;

// …but several entries say the opposite in the same words ("no national
// selection needed"). Without this the negation was read as a requirement.
const NOT_VIA_NATIONAL =
  /no national selection|without national selection|no national team|enter directly|apply directly/i;

/**
 * Read a curated eligibility sentence into a structured gate.
 * Conservative by design — an unreadable sentence returns an empty gate.
 */
export function parseEligibility(text: string | undefined): EligibilityGate {
  const gate: EligibilityGate = {};
  if (!text) return gate;

  if (US_ONLY.test(text)) gate.countries = ["US"];
  if (VIA_NATIONAL.test(text) && !NOT_VIA_NATIONAL.test(text)) {
    gate.viaNationalSelection = true;
  }

  // ── Grades ───────────────────────────────────────────────────────────────
  // "Grades 9–12", "Grades 6-12", "grade ≤10", "Grades 9–12 at a US school"
  const gradeRange = text.match(/grades?\s*(\d{1,2})\s*[–\-—]\s*(\d{1,2})/i);
  if (gradeRange) {
    gate.gradeMin = Number(gradeRange[1]);
    gate.gradeMax = Number(gradeRange[2]);
  } else {
    const gradeMax = text.match(/grade\s*(?:≤|<=|up to |no more than )\s*(\d{1,2})/i);
    if (gradeMax) gate.gradeMax = Number(gradeMax[1]);
  }
  // "Final-year (grade 12) students only", "rising seniors"
  if (/final[-\s]year|grade 12\) students only/i.test(text)) {
    gate.gradeMin = Math.max(gate.gradeMin ?? 0, 12);
    gate.gradeMax = 12;
  }

  // ── Ages ─────────────────────────────────────────────────────────────────
  // Accepts "Ages 13–18", "aged 12–20", "ages ~13–18".
  const ageRange = text.match(/age[sd]?\s*~?\s*(\d{1,2})\s*[–\-—]\s*(\d{1,2})/i);
  if (ageRange) {
    gate.ageMin = Number(ageRange[1]);
    gate.ageMax = Number(ageRange[2]);
  } else {
    // "Under 20" — but NOT "under 4 years of secondary school remaining",
    // which is a school-progress rule, not an age.
    const under = text.match(/\bunder\s*(\d{1,2})\b(?!\s*years)/i);
    if (under) gate.ageMax = Number(under[1]) - 1;
    // "Age 15 or under on 31 December"
    const orUnder = text.match(/age\s*(\d{1,2})\s*or\s*under/i);
    if (orUnder) gate.ageMax = Number(orUnder[1]);
    // "Age 16+", "aged 16+", "Age 17+ by the program start"
    const plus = text.match(/age[sd]?\s*(\d{1,2})\s*\+/i);
    if (plus) gate.ageMin = Number(plus[1]);
  }

  return gate;
}

export type EligibilityVerdict =
  | { ok: true }
  | { ok: false; reason: "country"; detail: string }
  | { ok: false; reason: "too_old"; detail: string }
  | { ok: false; reason: "too_young"; detail: string };

/**
 * Can this student enter, given what we know about them? Unknown facts never
 * exclude: a student with no country or no graduation year sees everything,
 * exactly as before.
 */
export function checkEligibility(
  gate: EligibilityGate,
  student: { country?: string | null; grade?: number | null; age?: number | null },
): EligibilityVerdict {
  // Country: only excludes when we know BOTH sides. A restricted opportunity
  // stays visible to a student whose country we don't know — we'd rather show
  // one they can't enter than hide one they can.
  if (gate.countries && gate.countries.length > 0 && student.country) {
    if (!gate.countries.includes(student.country)) {
      return {
        ok: false,
        reason: "country",
        detail: `open to ${gate.countries.join(", ")} students only`,
      };
    }
  }

  if (student.grade != null) {
    if (gate.gradeMax != null && student.grade > gate.gradeMax) {
      return { ok: false, reason: "too_old", detail: `up to grade ${gate.gradeMax}` };
    }
    if (gate.gradeMin != null && student.grade < gate.gradeMin) {
      return { ok: false, reason: "too_young", detail: `from grade ${gate.gradeMin}` };
    }
  }

  if (student.age != null) {
    if (gate.ageMax != null && student.age > gate.ageMax) {
      return { ok: false, reason: "too_old", detail: `up to age ${gate.ageMax}` };
    }
    if (gate.ageMin != null && student.age < gate.ageMin) {
      return { ok: false, reason: "too_young", detail: `from age ${gate.ageMin}` };
    }
  }

  return { ok: true };
}

/**
 * The student's school grade for the academic year the opportunities on offer
 * belong to. A "Class of 2027" student is in grade 12 across 2026–27.
 *
 * The rollover is June, not September, on purpose: someone browsing in the
 * summer holidays is deciding about the year ahead, and every deadline they
 * can still act on falls after the new year starts. Counting them as the
 * grade they just left would wrongly exclude a rising senior from
 * final-year-only programmes whose applications close in the autumn.
 */
export function gradeFromGraduationYear(
  graduationYear: number | undefined,
  today: Date,
): number | null {
  if (!graduationYear) return null;
  const JUNE = 5; // month index
  const academicYearEnd =
    today.getMonth() >= JUNE ? today.getFullYear() + 1 : today.getFullYear();
  const grade = 12 - (graduationYear - academicYearEnd);
  if (grade < 1 || grade > 13) return null;
  return grade;
}
