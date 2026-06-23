"use client";

import type { Analysis } from "@/lib/ai/schema";
import { Section, Card } from "@/components/report/Section";
import { usApplicationFee } from "@/lib/data/application-fees";
import type { DestinationCode } from "@/lib/data/destinations";
import { useT } from "@/lib/i18n/client";

// "What does it cost just to apply?" — one-time application/submission fees per
// target, plus a country total. Figures are approximate (see application-fees.ts).
export function CostBreakdown({
  analysis,
  country,
}: {
  analysis: Analysis;
  country: DestinationCode;
}) {
  const t = useT();

  const rows: { name: string; fee: number }[] =
    country === "US"
      ? analysis.schools.map((s) => ({
          name: s.name,
          fee: usApplicationFee(s.name),
        }))
      : country === "IT"
        ? (analysis.italy_programs ?? []).map((p) => ({
            name: `${p.university} — ${p.program_name}`,
            fee: p.application_fee_eur ?? 0,
          }))
        : country === "HK"
          ? (analysis.hk_programs ?? []).map((p) => ({
              name: `${p.university} — ${p.program_name}`,
              fee: 450,
            }))
          : [];

  if (rows.length === 0) return null;

  const total = rows.reduce((sum, r) => sum + r.fee, 0);
  const fmt = (n: number) =>
    n === 0
      ? t("report.costFree")
      : country === "US"
        ? `$${n.toLocaleString()}`
        : country === "IT"
          ? `€${n.toLocaleString()}`
          : `${n.toLocaleString()} HKD`;

  return (
    <Section
      title={t("report.costTitle")}
      hint={
        country === "US"
          ? t("report.costHintUS")
          : country === "IT"
            ? t("report.costHintIT")
            : t("report.costHintHK")
      }
    >
      <Card>
        <ul className="divide-y divide-line">
          {rows.map((r) => (
            <li
              key={r.name}
              className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
            >
              <span className="min-w-0 truncate text-sm text-ink">{r.name}</span>
              <span data-num className="shrink-0 text-sm font-medium text-ink">
                {fmt(r.fee)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
          <span className="text-sm font-semibold text-ink">
            {t("report.costTotal")}
          </span>
          <span data-num className="text-base font-semibold text-ink">
            {country === "US"
              ? `$${total.toLocaleString()}`
              : country === "IT"
                ? `€${total.toLocaleString()}`
                : `${total.toLocaleString()} HKD`}
          </span>
        </div>
        <p className="mt-3 text-xs text-ink-faint">{t("report.costApprox")}</p>
      </Card>
    </Section>
  );
}
