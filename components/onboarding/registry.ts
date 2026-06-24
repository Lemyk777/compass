import type { StepConfig } from "./types";
import { stepSchemas } from "./schemas";

import StepSource from "./steps/StepSource";
import StepOrigin from "./steps/StepOrigin";
import StepDestinations from "./steps/StepDestinations";
import StepFaculties from "./steps/StepFaculties";
import StepGrades from "./steps/StepGrades";
import StepTests from "./steps/StepTests";
import StepActivities from "./steps/StepActivities";
import StepHonors from "./steps/StepHonors";
import StepUSTargets from "./steps/StepUSTargets";
import StepItalyTargets from "./steps/StepItalyTargets";
import StepHKTargets from "./steps/StepHKTargets";
import StepReview from "./steps/StepReview";

export const STEP_REGISTRY: Record<string, StepConfig> = {
  source: {
    key: "source",
    titleKey: "ob.tSource",
    subKey: "ob.sSource",
    schema: stepSchemas.source,
    component: StepSource,
  },
  origin: {
    key: "origin",
    titleKey: "ob.tOrigin",
    subKey: "ob.sOrigin",
    schema: stepSchemas.origin,
    component: StepOrigin,
  },
  destinations: {
    key: "destinations",
    titleKey: "ob.tDest",
    subKey: "ob.sDest",
    schema: stepSchemas.destinations,
    component: StepDestinations,
  },
  faculties: {
    key: "faculties",
    titleKey: "ob.tFac",
    subKey: "ob.sFac",
    schema: stepSchemas.faculties,
    component: StepFaculties,
  },
  grades: {
    key: "grades",
    titleKey: "ob.t1",
    subKey: "ob.s1",
    schema: stepSchemas.grades,
    component: StepGrades,
  },
  tests: {
    key: "tests",
    titleKey: "ob.t2",
    subKey: "ob.s2",
    schema: stepSchemas.tests,
    component: StepTests,
  },
  activities: {
    key: "activities",
    titleKey: "ob.t3",
    subKey: "ob.s3",
    schema: stepSchemas.activities,
    component: StepActivities,
  },
  honors: {
    key: "honors",
    titleKey: "ob.tHonors",
    subKey: "ob.sHonors",
    schema: stepSchemas.honors,
    component: StepHonors,
  },
  us: {
    key: "us",
    titleKey: "ob.tUS",
    subKey: "ob.sUS",
    schema: stepSchemas.us,
    component: StepUSTargets,
    shouldShow: (data) => data.destinations.includes("US"),
  },
  it: {
    key: "it",
    titleKey: "ob.tIT",
    subKey: "ob.sIT",
    schema: stepSchemas.it,
    component: StepItalyTargets,
    shouldShow: (data) => data.destinations.includes("IT"),
  },
  hk: {
    key: "hk",
    titleKey: "ob.tHK",
    subKey: "ob.sHK",
    schema: stepSchemas.hk,
    component: StepHKTargets,
    shouldShow: (data) => data.destinations.includes("HK"),
  },
  review: {
    key: "review",
    titleKey: "ob.t5",
    subKey: "ob.s5",
    schema: stepSchemas.review,
    component: StepReview,
  },
};
