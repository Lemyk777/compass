export type FacultyValue =
  | "engineering"
  | "computer_science"
  | "business_economics"
  | "natural_sciences"
  | "humanities_social"
  | "medicine_health"
  | "law"
  | "arts_design";

export type AssessmentAnswers = {
  grade: string | null;
  interests: string[];
  struggle: string | null;
  ambition: string | null;
};

export type Option = {
  id: string;
  title: string;
  hint?: string;
  facultyValue?: FacultyValue;
};

export type Question = {
  id: "grade" | "interests" | "struggle" | "ambition";
  prompt: string;
  subtitle: string;
  multiSelect?: boolean;
  maxSelect?: number;
  options: Option[];
};

export const ASSESSMENT_QUESTIONS: Question[] = [
  {
    id: "grade",
    prompt: "First things first — where are you in your school journey right now?",
    subtitle:
      "There is no 'behind' or 'ahead'. Knowing your horizon helps us filter out deadlines you don't need to worry about yet.",
    options: [
      { id: "grade_9", title: "Grade 8–9 (Freshman)", hint: "Early exploration · 2028+ graduation" },
      { id: "grade_10", title: "Grade 10 (Sophomore)", hint: "Foundations & skill-building · 2027 graduation" },
      { id: "grade_11", title: "Grade 11 (Junior)", hint: "High-impact year · Olympiads & SAT/ACT · 2026 graduation" },
      { id: "grade_12", title: "Grade 12 (Senior / Final Year)", hint: "Application cycle & final deadlines · 2025/2026" },
      { id: "gap_year", title: "Gap Year / Independent", hint: "Targeted portfolios & direct application focus" },
    ],
  },
  {
    id: "interests",
    prompt: "When you have free time, what kind of problems or topics pull you in?",
    subtitle: "Pick 1 to 3 that spark your curiosity. You don't have to choose a lifelong major today.",
    multiSelect: true,
    maxSelect: 3,
    options: [
      { id: "cs", title: "Coding, AI & Software", hint: "Algorithms, web apps, machine learning", facultyValue: "computer_science" },
      { id: "eng", title: "Building, Robotics & Hardware", hint: "Mechanics, electronics, physical prototyping", facultyValue: "engineering" },
      { id: "biz", title: "Startups, Economics & Leadership", hint: "Markets, business models, team initiatives", facultyValue: "business_economics" },
      { id: "sci", title: "Natural Sciences & Physics", hint: "Space, biology, chemistry discoveries", facultyValue: "natural_sciences" },
      { id: "humanities", title: "Writing, Debate & Policy", hint: "Philosophy, international relations, law", facultyValue: "humanities_social" },
      { id: "med", title: "Medicine & Health Sciences", hint: "Human biology, neuroscience, patient care", facultyValue: "medicine_health" },
      { id: "design", title: "Arts, Architecture & Design", hint: "Visual storytelling, UI/UX, spatial design", facultyValue: "arts_design" },
      { id: "undecided", title: "I'm exploring broadly (and that's totally fine!)", hint: "We'll spotlight multi-disciplinary starter opportunities" },
    ],
  },
  {
    id: "struggle",
    prompt: "What feels like the biggest roadblock or source of stress right now?",
    subtitle: "Be honest. Almost every ambitious student faces these exact hurdles.",
    options: [
      { id: "clutter", title: "I don't know which extracurriculars or competitions are actually legit.", hint: "Avoiding pay-to-play schemes & finding accredited contests" },
      { id: "direction", title: "I have no idea what career or major suits me.", hint: "Finding a clear spike or narrative thread" },
      { id: "timeline", title: "I'm overwhelmed by tests, dates, and deadlines.", hint: "Balancing school coursework with extracurricular milestones" },
      { id: "cost", title: "I'm worried about university costs and need full financial aid.", hint: "Targeting need-blind, merit & tuition-free paths" },
      { id: "guidance", title: "My school provides zero counseling, so I'm navigating alone.", hint: "Needing an objective, honest step-by-step roadmap" },
    ],
  },
  {
    id: "ambition",
    prompt: "If everything went right, where would you love to see yourself studying?",
    subtitle: "Dream big. We'll show you the real benchmarks to get there.",
    options: [
      { id: "us_top", title: "Top US Universities", hint: "Ivy League, Stanford, MIT, Top 50 with generous financial aid" },
      { id: "europe_italy", title: "Europe & Italy", hint: "Politecnico di Milano, Bocconi, Bologna, affordable excellence (DSU)" },
      { id: "asia_global", title: "Top Asian Hubs", hint: "HKU, NUS, KAIST, Tokyo, Seoul National" },
      { id: "full_aid", title: "Anywhere with 100% Scholarship / Tuition-Free", hint: "Maximizing funding & zero student debt" },
      { id: "open", title: "Open to any high-quality program", hint: "Focus on best academic fit and student community" },
    ],
  },
];

export type ActionItem = {
  title: string;
  detail: string;
  tag: string;
};

export type BlueprintResult = {
  archetype: string;
  stageTitle: string;
  mentorVerdict: string;
  strategicNote: string;
  topActions: ActionItem[];
  matchedFaculties: FacultyValue[];
};

export function calculateBlueprint(answers: AssessmentAnswers): BlueprintResult {
  const interests = Array.isArray(answers?.interests) ? answers.interests : [];
  const isEarly = answers?.grade === "grade_9" || answers?.grade === "grade_10";
  const isJunior = answers?.grade === "grade_11";
  const isSenior = answers?.grade === "grade_12";

  // Archetype derivation based on interests & horizon
  let archetype = "The Curious Explorer";
  if (interests.includes("cs") || interests.includes("eng")) {
    archetype = isEarly ? "The Future Builder" : "The Technical Innovator";
  } else if (interests.includes("biz")) {
    archetype = answers?.ambition === "us_top" || answers?.ambition === "full_aid"
      ? "The Strategic Pioneer"
      : "The Venture Architect";
  } else if (interests.includes("humanities")) {
    archetype = "The Voice & Policy Thinker";
  } else if (interests.includes("med") || interests.includes("sci")) {
    archetype = "The Research Investigator";
  } else if (interests.includes("design")) {
    archetype = "The Creative Visionary";
  } else if (interests.length > 1) {
    archetype = "The Multidisciplinary Polymath";
  }

  // Stage title based on grade horizon
  let stageTitle = "Foundation & Spike Exploration Window";
  if (isJunior) {
    stageTitle = "High-Impact Competition & Portfolio Year";
  } else if (isSenior) {
    stageTitle = "Execution & Application Sprint";
  } else if (answers.grade === "gap_year") {
    stageTitle = "Independent Differentiation & Polish Cycle";
  }

  // Mentor verdict based on core struggle
  let mentorVerdict =
    "You don't need 15 generic clubs. Admissions officers and top universities look for genuine curiosity and depth in 1–2 spike areas.";
  if (answers.struggle === "clutter") {
    mentorVerdict =
      "Skip unaccredited summer pay-to-play programs. You don't need 15 generic certificates; top universities and scholarship committees value 2–3 recognized, verified competitions where you proved real depth.";
  } else if (answers.struggle === "cost") {
    mentorVerdict =
      "World-class education does not require six-figure debt. With strong standardized scores and targeted merit competitions, full-ride scholarships in the US (need-blind/need-based), Italy (DSU regional grants), and Asia (KAIST/HKU) are within reach.";
  } else if (answers.struggle === "direction") {
    mentorVerdict =
      "It is completely normal not to know your life's calling at 16 or 17. The fastest way to find clarity isn't overthinking—it's testing small hypotheses through 1–2 beginner-friendly hackathons or research projects to see what actually energizes you.";
  } else if (answers.struggle === "timeline") {
    mentorVerdict =
      "Stop trying to do everything at once. Admissions success comes from phased execution: first lock in your testing baseline, then sprint on 1 flagship competition, then draft your personal narrative.";
  } else if (answers.struggle === "guidance") {
    mentorVerdict =
      "Navigating alone without a school counselor is daunting, but you are not behind. By following an objective calendar of verified deadlines and building a focused extracurricular spike, you can compete with students from elite private academies.";
  }

  // Strategic guidance note
  let strategicNote =
    "Focus on curiosity-driven experiments and skill mastery rather than resume padding. The learning curve is your greatest advantage right now.";
  if (isEarly) {
    strategicNote =
      "Because you are in early high school, the pressure is low and your learning window is huge. Focus on curiosity-driven experiments and skill mastery rather than resume padding.";
  } else if (isJunior) {
    strategicNote =
      "You are entering the pivotal junior sprint. This is the optimal window to compete in national/international olympiads and lock down your SAT/ACT targets before senior year begins.";
  } else if (isSenior || answers.grade === "gap_year") {
    strategicNote =
      "Application deadlines are in sight. Ruthlessly prioritize high-yield milestones: finalize test score submissions, polish your 1–2 standout achievement stories, and submit early financial aid documentation.";
  }

  // 3 high-priority action milestones
  const action1: ActionItem = {
    title: "Filter Your Verified Competitions",
    detail:
      "Explore verified competitions filtered for your grade and interests that are free, legitimate, and currently open for registration.",
    tag: "Immediate",
  };

  let action2: ActionItem;
  if (isEarly) {
    action2 = {
      title: "Take a Stress-Free SAT Diagnostic",
      detail:
        "Take an untimed practice test on Khan Academy to benchmark your reading and math foundations without pressure.",
      tag: "Milestone",
    };
  } else if (isJunior) {
    action2 = {
      title: "Lock In Your Standardized Testing Calendar",
      detail:
        "Finalize target test dates for the Digital SAT/ACT and schedule a structured 8-week preparation block.",
      tag: "Milestone",
    };
  } else {
    action2 = {
      title: "Audit Application Deadlines & Narrative Spikes",
      detail:
        "Draft your central personal statement hook highlighting your primary interest spike, and map out Early Action / Regular Decision deadlines.",
      tag: "Critical",
    };
  }

  let action3: ActionItem;
  if (answers.ambition === "full_aid" || answers.struggle === "cost") {
    action3 = {
      title: "Assemble Your Financial Aid & Scholarship Checklist",
      detail:
        "Identify full-ride opportunities (CSS Profile, Italian DSU income brackets, HKU/NUS merit scholarships) to ensure tuition-free pathways.",
      tag: "Funding",
    };
  } else if (answers.ambition === "europe_italy") {
    action3 = {
      title: "Verify Italian / European Entrance Exam Timelines",
      detail:
        "Review CISIA / TOLC / TIL exam requirements and application intake windows for Italian public universities.",
      tag: "Strategy",
    };
  } else {
    action3 = {
      title: "Launch One Signature Spike Project",
      detail:
        "Turn your curiosity into a tangible, verifiable artifact (an open-source codebase, an empirical research preprint, or a community initiative).",
      tag: "Differentiator",
    };
  }

  // Faculty mapping
  const facultyMap: Record<string, FacultyValue> = {
    cs: "computer_science",
    eng: "engineering",
    biz: "business_economics",
    sci: "natural_sciences",
    humanities: "humanities_social",
    med: "medicine_health",
    design: "arts_design",
  };

  const matchedFaculties: FacultyValue[] = Array.from(
    new Set(
      interests
        .filter((id): id is keyof typeof facultyMap => Object.prototype.hasOwnProperty.call(facultyMap, id))
        .map((id) => facultyMap[id])
    )
  );

  return {
    archetype,
    stageTitle,
    mentorVerdict,
    strategicNote,
    topActions: [action1, action2, action3],
    matchedFaculties,
  };
}
