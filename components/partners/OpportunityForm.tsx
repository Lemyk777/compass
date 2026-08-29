"use client";

import { useMemo, useState, useTransition } from "react";
import type { Opportunity } from "@/lib/data/key-dates";
import type { Partner } from "@/lib/data/partners";
import {
  PARTNER_CATEGORY_OPTIONS,
  PARTNER_COST_OPTIONS,
  PARTNER_LEVEL_OPTIONS,
  PARTNER_TIER_OPTIONS,
  partnerRef,
} from "@/lib/data/partners";
import {
  FACULTIES,
  FACULTY_LABEL,
  type FacultyValue,
} from "@/lib/data/faculties";
import { regionLabel } from "@/lib/data/geo";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { OpportunityCard } from "@/components/opportunities/OpportunityCard";
import type { NewOpportunityInput, PartnerResult } from "@/app/partner/actions";

// The form an organisation fills in to publish an opportunity.
//
// It asks for exactly what a card renders and nothing else, and it shows the
// card being built as they type. The preview is not decoration: this posts
// straight to students with no review queue, so the only thing standing
// between a careless entry and a twelve-year-old reading it is the poster
// seeing what they are about to publish. It also settles arguments that would
// otherwise reach us as support questions — "why does my free course say the
// cost is unverified" is visible before submitting, not after.
//
// Two honesty rules are built into the controls rather than the copy:
//  • timing is a three-way choice, so "we haven't announced dates" is a
//    first-class answer rather than something you fake with a placeholder date;
//  • the cost has no "not sure" option — an organiser knows what their own
//    event costs, and silence on a card reads as "free".

export type OpportunityFormValues = NewOpportunityInput;

export const EMPTY_OPPORTUNITY: OpportunityFormValues = {
  name: "",
  url: "",
  blurb: "",
  category: "competition",
  tier: "accessible",
  level: "regional",
  fields: [],
  eligibility: "",
  timing: "deadline",
  deadline: "",
  eventWindow: "",
  cost: "free",
  costDetail: "",
  scope: "local",
  city: "",
};

export function OpportunityForm({
  partner,
  initial,
  submitLabel,
  onSubmit,
  onDone,
  onCancel,
}: {
  partner: Partner;
  initial?: OpportunityFormValues;
  submitLabel: string;
  onSubmit: (values: OpportunityFormValues) => Promise<PartnerResult>;
  onDone?: () => void;
  onCancel?: () => void;
}) {
  const [v, setV] = useState<OpportunityFormValues>(
    initial ?? EMPTY_OPPORTUNITY,
  );
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  const set = <K extends keyof OpportunityFormValues>(
    key: K,
    value: OpportunityFormValues[K],
  ) => {
    setV((prev) => ({ ...prev, [key]: value }));
    setError(null);
    setDone(false);
  };

  const toggleField = (f: FacultyValue) =>
    set(
      "fields",
      v.fields.includes(f) ? v.fields.filter((x) => x !== f) : [...v.fields, f],
    );

  const preview = usePreview(v, partner);

  function submit() {
    startTransition(async () => {
      const result = await onSubmit(v);
      if (result.ok) {
        setDone(true);
        setError(null);
        onDone?.();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
      {/* ── The form ──────────────────────────────────────────────────────── */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="space-y-6"
      >
        <FormSection title="What it is">
          <Field label="Name" hint="What a student would search for.">
            <Input
              value={v.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="nFactorial Incubator 2026"
              maxLength={120}
              required
            />
          </Field>

          <Field label="Link" hint="The page where they actually apply.">
            <Input
              type="url"
              value={v.url}
              onChange={(e) => set("url", e.target.value)}
              placeholder="https://..."
              required
            />
          </Field>

          <Field
            label="One line about it"
            hint={`What it is and why it is worth doing. ${280 - v.blurb.length} characters left.`}
          >
            <textarea
              value={v.blurb}
              onChange={(e) => set("blurb", e.target.value.slice(0, 280))}
              rows={3}
              required
              className="w-full rounded-xl border border-line bg-card px-3.5 py-2.5 text-[0.95rem] text-ink placeholder:text-ink-faint focus-visible:focus-ring"
              placeholder="A three-week intensive where school students build and ship a product with a mentor."
            />
          </Field>
        </FormSection>

        <FormSection title="What kind of thing">
          <Choice
            label="Type"
            options={PARTNER_CATEGORY_OPTIONS}
            value={v.category}
            onChange={(x) => set("category", x)}
          />
          <Choice
            label="How hard it is to get in"
            options={PARTNER_TIER_OPTIONS}
            value={v.tier}
            onChange={(x) => set("tier", x)}
          />
          <Choice
            label="Reach"
            options={PARTNER_LEVEL_OPTIONS}
            value={v.level}
            onChange={(x) => set("level", x)}
          />

          <fieldset>
            <legend className="mb-1.5 text-sm font-medium text-ink">
              Subjects
            </legend>
            <div className="flex flex-wrap gap-2">
              {FACULTIES.map((f) => {
                const on = v.fields.includes(f.value);
                return (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => toggleField(f.value)}
                    aria-pressed={on}
                    className={`h-10 rounded-full border px-3.5 text-sm font-medium transition-colors focus-visible:focus-ring ${
                      on
                        ? "border-accent bg-accent-soft text-accent-ink"
                        : "border-line bg-card text-ink-soft hover:border-ink/25 hover:text-ink"
                    }`}
                  >
                    {FACULTY_LABEL[f.value]}
                  </button>
                );
              })}
            </div>
            <p className="mt-1.5 text-xs text-ink-faint">
              Leave all of them off if it suits any subject, and that shows it to
              everyone, not to no one.
            </p>
          </fieldset>
        </FormSection>

        <FormSection title="Who can enter">
          <Field
            label="Age or year rules"
            hint="Word it the way you word it. Ages if your rule is an age, school years if it's a year."
          >
            <Input
              value={v.eligibility}
              onChange={(e) => set("eligibility", e.target.value)}
              placeholder="School students aged 14–18, any city in Kazakhstan"
              maxLength={200}
            />
          </Field>

          <fieldset>
            <legend className="mb-1.5 text-sm font-medium text-ink">
              Who sees it
            </legend>
            <div className="space-y-2">
              <Radio
                name="scope"
                checked={v.scope === "local"}
                onChange={() => set("scope", "local")}
                title={
                  partner.country
                    ? `Students in ${regionLabel(partner.country)}`
                    : "Students in your country"
                }
                hint="The right answer for anything that happens in one place, or is only open to local students."
              />
              <Radio
                name="scope"
                checked={v.scope === "global"}
                onChange={() => set("scope", "global")}
                title="Anyone, anywhere"
                hint="Only if a student in another country could genuinely take part."
              />
            </div>
            {v.scope === "local" && (
              <div className="mt-3">
                <Field label="City (optional)">
                  <Input
                    value={v.city}
                    onChange={(e) => set("city", e.target.value)}
                    placeholder={partner.city ?? "Almaty"}
                    maxLength={60}
                  />
                </Field>
              </div>
            )}
            {v.scope === "local" && !partner.country && (
              <p className="mt-2 rounded-lg bg-target-soft/60 px-3 py-2 text-xs text-ink-soft">
                We don&rsquo;t have a country on your organisation yet, so this
                will publish as open to anyone. Ask us to set it and local posts
                will reach students in your country specifically.
              </p>
            )}
          </fieldset>
        </FormSection>

        <FormSection title="When">
          <div className="space-y-2">
            <Radio
              name="timing"
              checked={v.timing === "deadline"}
              onChange={() => set("timing", "deadline")}
              title="There's a deadline"
              hint="Students see a live countdown to it. Only pick this for a date you have actually set."
            />
            {v.timing === "deadline" && (
              <div className="ml-7 space-y-3">
                <Field label="Applications close">
                  <Input
                    type="date"
                    value={v.deadline}
                    onChange={(e) => set("deadline", e.target.value)}
                    min={new Date().toISOString().slice(0, 10)}
                    required
                  />
                </Field>
              </div>
            )}
            <Radio
              name="timing"
              checked={v.timing === "always_open"}
              onChange={() => set("timing", "always_open")}
              title="It runs continuously"
              hint="Rolling applications, a self-paced course: nothing to miss."
            />
            <Radio
              name="timing"
              checked={v.timing === "tba"}
              onChange={() => set("timing", "tba")}
              title="Dates aren't announced yet"
              hint="It shows as 'dates TBA'. Come back and set the date, we never invent one."
            />
          </div>

          <Field
            label={v.timing === "deadline" ? "When it runs" : "How it works"}
            hint="One short phrase. Students read this under the date."
          >
            <Input
              value={v.eventWindow}
              onChange={(e) => set("eventWindow", e.target.value)}
              placeholder={
                v.timing === "always_open"
                  ? "Applications reviewed every week"
                  : "Three weeks in July, in Almaty"
              }
              maxLength={160}
            />
          </Field>
        </FormSection>

        <FormSection title="What it costs">
          <Choice
            label="Cost"
            options={PARTNER_COST_OPTIONS}
            value={v.cost}
            onChange={(x) => set("cost", x)}
          />
          <Field
            label="In one sentence"
            hint="What's free, what isn't, and what help exists. Students trust a card that says the awkward part out loud."
          >
            <Input
              value={v.costDetail}
              onChange={(e) => set("costDetail", e.target.value)}
              placeholder="Free for everyone selected. We cover materials and lunch."
              maxLength={300}
            />
          </Field>
        </FormSection>

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-reach/40 bg-reach-soft/50 px-4 py-3 text-sm text-ink"
          >
            {error}
          </p>
        )}
        {done && (
          <p className="rounded-xl border border-ivy/30 bg-ivy-soft/60 px-4 py-3 text-sm text-ink">
            Published. It is on students&rsquo; lists now.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={pending} size="md">
            {pending ? "Publishing…" : submitLabel}
          </Button>
          {onCancel && (
            <Button type="button" variant="tonal" size="md" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <p className="text-xs text-ink-faint">
            Goes live immediately, under your name.
          </p>
        </div>
      </form>

      {/* ── The preview ───────────────────────────────────────────────────── */}
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
          What a student will see
        </h3>
        <OpportunityCard o={preview} />
        <p className="mt-3 text-xs leading-relaxed text-ink-faint">
          This is the real card, rendered the same way it is on a
          student&rsquo;s list, including the countdown and the cost badge.
        </p>
      </aside>
    </div>
  );
}

/**
 * Form state → the exact object a student's card is rendered from, so the
 * preview cannot flatter the entry. Only the fields the card reads are filled;
 * `fit` is fixed because relevance is per-student and has no meaning here.
 */
function usePreview(v: OpportunityFormValues, partner: Partner): Opportunity {
  return useMemo(() => {
    // Neither gate applies to a preview: it is the partner looking at their own
    // entry, not a student being matched against it.
    const days = v.deadline
      ? Math.round(
          (new Date(v.deadline + "T00:00:00Z").getTime() -
            Date.UTC(
              new Date().getUTCFullYear(),
              new Date().getUTCMonth(),
              new Date().getUTCDate(),
            )) /
            86_400_000,
        )
      : 0;
    const confirmed = v.timing === "deadline" && Boolean(v.deadline);
    return {
      id: "preview",
      name: v.name || "Your opportunity",
      fields: v.fields.length > 0 ? v.fields : "all",
      deadline: v.deadline || new Date().toISOString().slice(0, 10),
      window:
        v.eventWindow ||
        (v.timing === "always_open"
          ? "Runs continuously"
          : "dates to be confirmed"),
      level: v.level,
      category: v.category,
      tier: v.tier,
      dateConfirmed: confirmed,
      alwaysOpen: v.timing === "always_open",
      eligibility: v.eligibility || undefined,
      region: v.scope === "local" ? partner.country : null,
      city: v.scope === "local" ? v.city || partner.city : null,
      url: v.url || "#",
      blurb: v.blurb || "One line about what it is and why it's worth doing.",
      cost: v.cost,
      costDetail: v.costDetail || undefined,
      partner: partnerRef(partner) ?? {
        id: partner.id,
        name: partner.name,
        logoUrl: partner.logoUrl,
        verified: false,
      },
      daysToDeadline: days,
      tierResolved: v.tier,
      categoryResolved: v.category,
      fit: "recommended",
      offField: false,
      offRegion: false,
    };
  }, [v, partner]);
}

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-card p-5 shadow-card">
      <h3 className="mb-4 text-sm font-semibold tracking-tight text-ink">
        {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Choice<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { value: T; label: string; hint?: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const active = options.find((o) => o.value === value);
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="h-11 w-full rounded-xl border border-line bg-card px-3 text-[0.95rem] text-ink focus-visible:focus-ring"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {active?.hint && (
        <p className="mt-1 text-xs text-ink-faint">{active.hint}</p>
      )}
    </div>
  );
}

function Radio({
  name,
  checked,
  onChange,
  title,
  hint,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  title: string;
  hint: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-transparent p-1 hover:border-line">
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="mt-1 h-4 w-4 shrink-0 accent-ink"
      />
      <span>
        <span className="block text-sm font-medium text-ink">{title}</span>
        <span className="block text-xs leading-relaxed text-ink-faint">
          {hint}
        </span>
      </span>
    </label>
  );
}
