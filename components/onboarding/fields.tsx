"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// Shared form primitives for the redesigned full-page onboarding. Kept local to
// the onboarding so the dashboard's UI kit stays untouched.

const inputCls =
  "h-12 w-full rounded-xl border border-line bg-card px-4 text-[0.95rem] text-ink placeholder:text-ink-faint transition-colors focus-visible:focus-ring hover:border-ink/20";

export function Label({
  children,
  htmlFor,
}: {
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-2 block text-sm font-medium text-ink">
      {children}
    </label>
  );
}

export function FieldShell({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-ink-faint">{hint}</p>}
    </div>
  );
}

export function TextField({
  label,
  hint,
  value,
  onChange,
  placeholder,
  maxLength,
  id,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  id?: string;
}) {
  return (
    <FieldShell label={label} htmlFor={id} hint={hint}>
      <input
        id={id}
        className={inputCls}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </FieldShell>
  );
}

export function NumberField({
  label,
  hint,
  value,
  onChange,
  placeholder,
  min,
  max,
  step,
  id,
}: {
  label: string;
  hint?: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  id?: string;
}) {
  return (
    <FieldShell label={label} htmlFor={id} hint={hint}>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        className={inputCls}
        value={value ?? ""}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "") return onChange(undefined);
          const n = Number(raw);
          onChange(Number.isFinite(n) ? n : undefined);
        }}
      />
    </FieldShell>
  );
}

// Native styled <select> for single choice (curriculum, citizenship, …).
export function SelectField({
  label,
  hint,
  value,
  onChange,
  options,
  placeholder,
  id,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  id?: string;
}) {
  return (
    <FieldShell label={label} htmlFor={id} hint={hint}>
      <div className="relative">
        <select
          id={id}
          className={`${inputCls} appearance-none pr-10 ${value ? "" : "text-ink-faint"}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value} className="text-ink">
              {o.label}
            </option>
          ))}
        </select>
        <Chevron />
      </div>
    </FieldShell>
  );
}

// Custom multi-select dropdown (pick from preset options, no free text).
export function MultiSelectField({
  label,
  hint,
  values,
  onChange,
  options,
  placeholder,
  max,
}: {
  label: string;
  hint?: string;
  values: string[];
  onChange: (v: string[]) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  max?: number;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const atCap = max != null && values.length >= max;
  const toggle = (v: string) => {
    if (values.includes(v)) onChange(values.filter((x) => x !== v));
    else if (!atCap) onChange([...values, v]);
  };

  const selectedLabels = options
    .filter((o) => values.includes(o.value))
    .map((o) => o.label);

  return (
    <FieldShell label={label} hint={hint}>
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={`${inputCls} flex items-center justify-between gap-2 text-left`}
        >
          <span className={`truncate ${selectedLabels.length ? "text-ink" : "text-ink-faint"}`}>
            {selectedLabels.length ? selectedLabels.join(", ") : placeholder}
          </span>
          <Chevron inline />
        </button>
        {open && (
          <div className="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-xl border border-line bg-card p-1.5 shadow-lift">
            {options.map((o) => {
              const on = values.includes(o.value);
              const dis = !on && atCap;
              return (
                <button
                  key={o.value}
                  type="button"
                  disabled={dis}
                  onClick={() => toggle(o.value)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                    on
                      ? "bg-accent-soft text-accent-ink"
                      : dis
                        ? "cursor-not-allowed text-ink-faint opacity-50"
                        : "text-ink-soft hover:bg-surface"
                  }`}
                >
                  <span
                    className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-md border ${
                      on ? "border-accent bg-accent text-white" : "border-line"
                    }`}
                    style={{ height: 18, width: 18 }}
                  >
                    {on && (
                      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12l5 5L20 7" />
                      </svg>
                    )}
                  </span>
                  {o.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </FieldShell>
  );
}

// Stacked option buttons (multi-select) — used for "Where do you want to study?".
export function OptionStack({
  label,
  values,
  onChange,
  options,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  options: { value: string; label: string; icon?: ReactNode }[];
}) {
  const toggle = (v: string) =>
    values.includes(v)
      ? onChange(values.filter((x) => x !== v))
      : onChange([...values, v]);
  return (
    <FieldShell label={label}>
      <div className="space-y-3">
        {options.map((o) => {
          const on = values.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(o.value)}
              className={`flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border text-[0.95rem] font-medium transition-colors focus-visible:focus-ring ${
                on
                  ? "border-accent bg-accent-soft text-accent-ink"
                  : "border-line bg-card text-ink-soft hover:border-ink/20"
              }`}
            >
              {o.icon}
              {o.label}
            </button>
          );
        })}
      </div>
    </FieldShell>
  );
}

function Chevron({ inline = false }: { inline?: boolean }) {
  return (
    <svg
      className={`h-4 w-4 text-ink-faint ${inline ? "" : "pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2"}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
