// Per-country VIEW registry for the dashboard result pages.
//
// The odds page and the costs page both used to carry a 4–5-way per-country
// switch (which breakdown component to render, which section copy, how to price
// each target, which currency). Both now read this one registry, so a new
// deterministic country is a single entry here instead of edits in several files.

import type { ReactNode } from "react";
import type { Analysis } from "@/lib/ai/schema";
import type { DestinationCode } from "@/lib/data/destinations";
import { ItalyBreakdown } from "@/components/report/ItalyBreakdown";
import { HkBreakdown } from "@/components/report/HkBreakdown";
import { UaeBreakdown } from "@/components/report/UaeBreakdown";
import { KoreaBreakdown } from "@/components/report/KoreaBreakdown";
import {
  usApplicationFee,
  uaeApplicationFee,
  koreaApplicationFee,
} from "@/lib/data/application-fees";

export type Currency = "USD" | "EUR" | "HKD";

/** Format a fee amount in a country's currency (0 shows as free via the caller). */
export function formatFee(currency: Currency, n: number): string {
  if (currency === "USD") return `$${n.toLocaleString()}`;
  if (currency === "EUR") return `€${n.toLocaleString()}`;
  return `${n.toLocaleString()} HKD`;
}

type CountryView = {
  code: DestinationCode;
  // Odds page: section copy + the breakdown renderer. US omits this (custom view).
  odds?: {
    titleKey: string;
    hintKey: string;
    render(a: Analysis): ReactNode;
  };
  // Costs page: how to price this country's targets + section copy.
  cost: {
    hintKey: string;
    currency: Currency;
    rows(a: Analysis): { name: string; fee: number }[];
  };
};

// Program label shared by every deterministic country's cost row.
const programLabel = (university: string, program: string) =>
  `${university} — ${program}`;

export const COUNTRY_VIEWS: Record<DestinationCode, CountryView | undefined> = {
  US: {
    code: "US",
    // Odds handled by the bespoke UsOdds view (gauges, comparison, benchmarks).
    cost: {
      hintKey: "report.costHintUS",
      currency: "USD",
      rows: (a) =>
        a.schools.map((s) => ({ name: s.name, fee: usApplicationFee(s.name) })),
    },
  },
  IT: {
    code: "IT",
    odds: {
      titleKey: "report.italyTitle",
      hintKey: "report.italyHint",
      render: (a) => <ItalyBreakdown programs={a.italy_programs ?? []} />,
    },
    cost: {
      hintKey: "report.costHintIT",
      currency: "EUR",
      rows: (a) =>
        (a.italy_programs ?? []).map((p) => ({
          name: programLabel(p.university, p.program_name),
          fee: p.application_fee_eur ?? 0,
        })),
    },
  },
  HK: {
    code: "HK",
    odds: {
      titleKey: "report.hkTitle",
      hintKey: "report.hkHint",
      render: (a) => <HkBreakdown programs={a.hk_programs ?? []} />,
    },
    cost: {
      hintKey: "report.costHintHK",
      currency: "HKD",
      rows: (a) =>
        (a.hk_programs ?? []).map((p) => ({
          name: programLabel(p.university, p.program_name),
          fee: 450,
        })),
    },
  },
  AE: {
    code: "AE",
    odds: {
      titleKey: "report.uaeTitle",
      hintKey: "report.uaeHint",
      render: (a) => <UaeBreakdown programs={a.uae_programs ?? []} />,
    },
    cost: {
      hintKey: "report.costHintAE",
      currency: "USD",
      rows: (a) =>
        (a.uae_programs ?? []).map((p) => ({
          name: programLabel(p.university, p.program_name),
          fee: uaeApplicationFee(),
        })),
    },
  },
  KR: {
    code: "KR",
    odds: {
      titleKey: "report.krTitle",
      hintKey: "report.krHint",
      render: (a) => <KoreaBreakdown programs={a.kr_programs ?? []} />,
    },
    cost: {
      hintKey: "report.costHintKR",
      currency: "USD",
      rows: (a) =>
        (a.kr_programs ?? []).map((p) => ({
          name: programLabel(p.university, p.program_name),
          fee: koreaApplicationFee(),
        })),
    },
  },
  // Not yet analyzed — no result views.
  CN: undefined,
  CA: undefined,
};
