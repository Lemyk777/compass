"use client";

import { useState, useEffect } from "react";
import { useT } from "@/lib/i18n/client";
import { LIMITS } from "@/lib/limits";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  GRADE_LEVELS,
  HONOR_LEVELS,
  type Honor,
} from "@/lib/types";

function toggleIn(arr: string[] | undefined, v: string): string[] {
  const cur = arr ?? [];
  return cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v];
}

interface HonorDialogProps {
  honor: Honor;
  onSave: (honor: Honor) => void;
  onClose: () => void;
  title: string;
}

export default function HonorDialog({
  honor: initialHonor,
  onSave,
  onClose,
  title,
}: HonorDialogProps) {
  const t = useT();
  const [honor, setHonor] = useState<Honor>({ ...initialHonor });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const update = (patch: Partial<Honor>) => {
    setHonor((prev) => ({ ...prev, ...patch }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(honor);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <div className="bg-card border border-line rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-card animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
          <h2 id="dialog-title" className="text-lg font-bold text-ink">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-soft hover:text-ink focus-visible:focus-ring min-h-[44px] min-w-[44px] flex items-center justify-center text-xl font-medium"
            aria-label={t("ob.close") || "Close"}
          >
            ×
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label htmlFor="dialog-honor-title" className="mb-1.5 block text-xs font-medium text-ink-soft">
              {t("ob.honorTitle")}
            </label>
            <Input
              id="dialog-honor-title"
              value={honor.title}
              maxLength={LIMITS.honorTitle}
              onChange={(e) => update({ title: e.target.value })}
              placeholder={t("ob.honorTitlePh")}
              required
            />
          </div>

          <fieldset className="border-none p-0 m-0 block space-y-1.5">
            <legend className="block text-xs font-medium text-ink-soft">
              {t("ob.gradeLevels")}
            </legend>
            <div className="flex flex-wrap gap-2">
              {GRADE_LEVELS.map((g) => {
                const on = (honor.grades ?? []).includes(g);
                return (
                  <button
                    key={g}
                    type="button"
                    aria-pressed={on}
                    onClick={() => update({ grades: toggleIn(honor.grades, g) })}
                    className={`rounded-full border px-3.5 py-2 text-xs transition-colors focus-visible:focus-ring min-h-[44px] ${
                      on
                        ? "border-accent bg-accent-soft text-accent-ink"
                        : "border-line bg-card text-ink-soft hover:border-ink/30"
                    }`}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="border-none p-0 m-0 block space-y-1.5">
            <legend className="block text-xs font-medium text-ink-soft">
              {t("ob.honorLevels")}
            </legend>
            <div className="flex flex-wrap gap-2">
              {HONOR_LEVELS.map((l) => {
                const on = (honor.levels ?? []).includes(l);
                return (
                  <button
                    key={l}
                    type="button"
                    aria-pressed={on}
                    onClick={() => update({ levels: toggleIn(honor.levels, l) })}
                    className={`rounded-full border px-3.5 py-2 text-xs transition-colors focus-visible:focus-ring min-h-[44px] ${
                      on
                        ? "border-accent bg-accent-soft text-accent-ink"
                        : "border-line bg-card text-ink-soft hover:border-ink/30"
                    }`}
                  >
                    {l}
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-line">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="min-h-[44px]"
            >
              {t("ob.cancel") || "Cancel"}
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="min-h-[44px]"
            >
              {t("ob.save") || "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
