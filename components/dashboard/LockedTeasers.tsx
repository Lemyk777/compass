// Plausible-looking placeholder content shown blurred behind the locked
// Admission-odds / Application-costs sections (and as small art in the promo
// modal). Pure decoration — never real data.

const FAUX_SCHOOLS = [
  { name: "Northwestern University", tier: "Reach", color: "var(--reach)", lo: 18, hi: 64 },
  { name: "University of Michigan", tier: "Target", color: "var(--target)", lo: 38, hi: 78 },
  { name: "Boston University", tier: "Likely", color: "var(--likely)", lo: 58, hi: 86 },
  { name: "University of Rochester", tier: "Target", color: "var(--target)", lo: 34, hi: 70 },
];

function FauxOddsCard({ s }: { s: (typeof FAUX_SCHOOLS)[number] }) {
  return (
    <div className="rounded-2xl border border-line bg-card p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[0.95rem] font-semibold leading-tight text-ink">{s.name}</h3>
        <span className="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium" style={{ backgroundColor: s.color, color: "#fff" }}>
          {s.tier}
        </span>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-ink">{s.lo}–{s.hi}%</span>
      </div>
      <div className="mt-3 h-2 w-full rounded-full bg-line">
        <div className="h-full rounded-full" style={{ marginLeft: `${s.lo}%`, width: `${s.hi - s.lo}%`, backgroundColor: s.color }} />
      </div>
    </div>
  );
}

export function OddsTeaser() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {FAUX_SCHOOLS.map((s) => (
        <FauxOddsCard key={s.name} s={s} />
      ))}
    </div>
  );
}

export function OddsArt() {
  return (
    <div className="space-y-3">
      {FAUX_SCHOOLS.slice(0, 3).map((s) => (
        <div key={s.name} className="rounded-xl border border-line bg-card p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink">{s.name.split(" ").slice(0, 2).join(" ")}</span>
            <span className="text-xs font-semibold text-ink">{s.lo}–{s.hi}%</span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-line">
            <div className="h-full rounded-full" style={{ marginLeft: `${s.lo}%`, width: `${s.hi - s.lo}%`, backgroundColor: s.color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

const FAUX_FEES = [
  { name: "Northwestern University", fee: "$75" },
  { name: "University of Michigan", fee: "$75" },
  { name: "Boston University", fee: "$80" },
  { name: "University of Rochester", fee: "$50" },
];

export function CostsTeaser() {
  return (
    <div className="rounded-2xl border border-line bg-card p-5 shadow-card">
      <ul className="divide-y divide-line">
        {FAUX_FEES.map((f) => (
          <li key={f.name} className="flex items-center justify-between py-3">
            <span className="text-sm text-ink">{f.name}</span>
            <span className="text-sm font-semibold text-ink">{f.fee}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
        <span className="text-sm font-semibold text-ink">Total to apply</span>
        <span className="text-base font-semibold text-ink">$280</span>
      </div>
    </div>
  );
}

export function CostsArt() {
  return (
    <div className="rounded-xl border border-line bg-card p-3">
      <ul className="space-y-2.5">
        {FAUX_FEES.slice(0, 3).map((f) => (
          <li key={f.name} className="flex items-center justify-between text-xs">
            <span className="text-ink">{f.name.split(" ").slice(0, 2).join(" ")}</span>
            <span className="font-semibold text-ink">{f.fee}</span>
          </li>
        ))}
      </ul>
      <div className="mt-2.5 flex items-center justify-between border-t border-line pt-2.5 text-xs">
        <span className="font-semibold text-ink">Total</span>
        <span className="font-semibold text-ink">$280</span>
      </div>
    </div>
  );
}
