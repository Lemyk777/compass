export type JobSimulation = {
  id: string;
  title: string;
  provider: string;
  url: string;
  /**
   * Matches the slugs used in the guide (e.g. from lib/data/careers).
   */
  relatedWork: string[];
};

export const SIMULATIONS: JobSimulation[] = [
  {
    id: "jpmorgan-ib",
    title: "Investment Banking Virtual Experience",
    provider: "J.P. Morgan (Forage)",
    url: "https://www.theforage.com/virtual-experience/jpmorgan",
    relatedWork: ["money-markets", "business-economics"],
  },
  {
    id: "bcg-strategy",
    title: "Strategy Consulting Virtual Experience",
    provider: "BCG (Forage)",
    url: "https://www.theforage.com/virtual-experience/bcg",
    relatedWork: ["strategy-consulting", "business-economics"],
  },
  {
    id: "software-engineering",
    title: "Software Engineering Virtual Experience",
    provider: "Goldman Sachs (Forage)",
    url: "https://www.theforage.com/virtual-experience/goldman-sachs-swe",
    relatedWork: ["building-software-products", "computer-science"],
  },
  {
    id: "data-analytics",
    title: "Data Analytics Virtual Experience",
    provider: "Accenture (Forage)",
    url: "https://www.theforage.com/virtual-experience/accenture-data",
    relatedWork: ["data-ai", "computer-science"],
  },
];

export function recommendSimulation(pickIds: string[]): JobSimulation | null {
  for (const sim of SIMULATIONS) {
    if (sim.relatedWork.some((w) => pickIds.includes(w))) {
      return sim;
    }
  }
  return null;
}
