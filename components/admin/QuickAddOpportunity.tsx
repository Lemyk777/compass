"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import {
  quickAddOpportunity,
  type QuickAddInput,
} from "@/app/admin/opportunities/actions";
import { FACULTIES, type FacultyValue } from "@/lib/data/faculties";
import { FACULTY_LABEL } from "@/lib/data/faculties";

// Add an opportunity from the top of the list it will appear in.
//
// The founder's case is "someone told me about a tournament today and it happens
// on Friday". Discovery finds things eventually and the curated catalog needs a
// deploy; neither is a route for that. This posts the same live row a partner
// post does, so it flows through the same matching and renders as the same card.
//
// Collapsed by default and deliberately quiet: this sits above the student's own
// list, and an admin control that shouts is a control that changes what the
// person running the product sees when they look at their own product.

const EMPTY: QuickAddInput = {
  name: "",
  url: "",
  blurb: "",
  eligibility: "",
  deadline: "",
  alwaysOpen: false,
  level: "regional",
  category: "competition",
  fields: [],
  cost: "unknown",
  costDetail: "",
  region: "",
  city: "",
  pinned: false,
};

export function QuickAddOpportunity() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<QuickAddInput>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const set = <K extends keyof QuickAddInput>(k: K, v: QuickAddInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const toggleField = (f: FacultyValue) =>
    setForm((s) => ({
      ...s,
      fields: s.fields.includes(f)
        ? s.fields.filter((x) => x !== f)
        : [...s.fields, f],
    }));

  const submit = () => {
    setError(null);
    setDone(null);
    start(async () => {
      const res = await quickAddOpportunity(form);
      if (res.ok) {
        setDone(res.id);
        setForm(EMPTY);
        setOpen(false);
      } else {
        setError(res.error);
      }
    });
  };

  if (!open) {
    return (
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Button variant="subtle" size="sm" shape="pill" onClick={() => setOpen(true)}>
          + Add an opportunity
        </Button>
        <span className="text-xs text-ink-faint">Admin — publishes immediately</span>
        {done && (
          <span
            role="status"
            className="rounded-full bg-ivy-soft px-2.5 py-1 text-xs font-semibold text-ivy-ink"
          >
            Published: {done}
          </span>
        )}
      </div>
    );
  }

  return (
    <section className="mb-5 rounded-2xl border border-accent/40 bg-card p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">Add an opportunity</h2>
          <p className="mt-1 max-w-[60ch] text-xs leading-relaxed text-ink-soft">
            Publishes immediately, into the same list and the same card as
            everything else. Every field below is one a student actually reads.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field label="Name" htmlFor="qa-name">
          <Input
            id="qa-name"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="NAO Cup — debate tournament"
          />
        </Field>
        <Field label="Link students open" htmlFor="qa-url" hint="Must be https, and must actually be open to them.">
          <Input
            id="qa-url"
            value={form.url}
            onChange={(e) => set("url", e.target.value)}
            placeholder="https://…"
          />
        </Field>
      </div>

      <div className="mt-3">
        <Field
          label="Who can enter"
          htmlFor="qa-elig"
          hint="On every card, and the one thing most lists never say."
        >
          <Input
            id="qa-elig"
            value={form.eligibility}
            onChange={(e) => set("eligibility", e.target.value)}
            placeholder="School students — no experience required"
          />
        </Field>
      </div>

      <div className="mt-3">
        <Field label="What it is" htmlFor="qa-blurb">
          <textarea
            id="qa-blurb"
            rows={3}
            value={form.blurb}
            onChange={(e) => set("blurb", e.target.value)}
            className="w-full rounded-xl border border-line bg-card px-3.5 py-2.5 text-[0.95rem] text-ink placeholder:text-ink-faint focus-visible:focus-ring"
            placeholder="Three qualifying rounds, then a semi-final and a final…"
          />
        </Field>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <Field label="Closes" htmlFor="qa-deadline">
          <Input
            id="qa-deadline"
            type="date"
            disabled={form.alwaysOpen}
            value={form.deadline}
            onChange={(e) => set("deadline", e.target.value)}
          />
        </Field>
        <Field label="Level" htmlFor="qa-level">
          <select
            id="qa-level"
            value={form.level}
            onChange={(e) => set("level", e.target.value as QuickAddInput["level"])}
            className="h-11 w-full rounded-xl border border-line bg-card px-3 text-[0.95rem] text-ink focus-visible:focus-ring"
          >
            {["school", "regional", "national", "international"].map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Kind" htmlFor="qa-cat">
          <select
            id="qa-cat"
            value={form.category}
            onChange={(e) => set("category", e.target.value as QuickAddInput["category"])}
            className="h-11 w-full rounded-xl border border-line bg-card px-3 text-[0.95rem] text-ink focus-visible:focus-ring"
          >
            {["competition", "olympiad", "course", "research_program", "summer_program"].map((c) => (
              <option key={c} value={c}>
                {c.replace("_", " ")}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <Field label="Country code" htmlFor="qa-region" hint="Empty = worldwide. “KZ” shows it only to students in Kazakhstan.">
          <Input
            id="qa-region"
            value={form.region}
            maxLength={2}
            onChange={(e) => set("region", e.target.value)}
            placeholder="KZ"
          />
        </Field>
        <Field label="City" htmlFor="qa-city">
          <Input
            id="qa-city"
            value={form.city}
            onChange={(e) => set("city", e.target.value)}
            placeholder="Shymkent"
          />
        </Field>
        <Field label="Cost" htmlFor="qa-cost" hint="Leave as unknown unless you have checked.">
          <select
            id="qa-cost"
            value={form.cost}
            onChange={(e) => set("cost", e.target.value as QuickAddInput["cost"])}
            className="h-11 w-full rounded-xl border border-line bg-card px-3 text-[0.95rem] text-ink focus-visible:focus-ring"
          >
            {["unknown", "free", "free_cert_paid", "free_then_paid", "freemium", "subscription", "one_time", "paid_aid", "varies"].map((c) => (
              <option key={c} value={c}>
                {c.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <fieldset className="mt-4">
        <legend className="text-xs font-medium text-ink">
          Fields <span className="font-normal text-ink-faint">— none selected means every field</span>
        </legend>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {FACULTIES.map((f) => {
            const on = form.fields.includes(f.value);
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => toggleField(f.value)}
                aria-pressed={on}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:focus-ring ${
                  on
                    ? "border-accent bg-accent-soft text-accent-ink"
                    : "border-line text-ink-soft hover:border-ink/30 hover:text-ink"
                }`}
              >
                {FACULTY_LABEL[f.value]}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={form.alwaysOpen}
            onChange={(e) => set("alwaysOpen", e.target.checked)}
            className="h-4 w-4 rounded border-line text-accent focus-visible:focus-ring"
          />
          Runs continuously
        </label>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={form.pinned}
            onChange={(e) => set("pinned", e.target.checked)}
            className="h-4 w-4 rounded border-line text-accent focus-visible:focus-ring"
          />
          Pin to the top
          <span className="text-xs text-ink-faint">(one at a time)</span>
        </label>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm font-medium text-reach-ink">
          {error}
        </p>
      )}

      <div className="mt-4 flex items-center gap-3">
        <Button size="sm" shape="pill" onClick={submit} disabled={pending}>
          {pending ? "Publishing…" : "Publish"}
        </Button>
        <span className="text-xs text-ink-faint">
          Goes live immediately. You can unpublish it from the admin console.
        </span>
      </div>
    </section>
  );
}
