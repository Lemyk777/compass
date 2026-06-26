"use client";

import { useState } from "react";
import { StepProps } from "../types";
import { useT } from "@/lib/i18n/client";
import { emptyActivity, type Activity } from "@/lib/types";
import { LIMITS } from "@/lib/limits";
import { Button } from "@/components/ui/Button";
import ActivityDialog from "../components/ActivityDialog";

export default function StepActivities({ data, updateField }: StepProps) {
  const t = useT();
  const acts = data.activities ?? [];

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [dialogActivity, setDialogActivity] = useState<Activity>(emptyActivity());

  const openAddDialog = () => {
    setEditingIndex(null);
    setDialogActivity(emptyActivity());
    setIsDialogOpen(true);
  };

  const openEditDialog = (index: number) => {
    setEditingIndex(index);
    setDialogActivity({ ...acts[index] });
    setIsDialogOpen(true);
  };

  const handleSave = (savedActivity: Activity) => {
    if (editingIndex === null) {
      // Adding new activity
      updateField("activities", [...acts, savedActivity]);
    } else {
      // Editing existing activity
      updateField(
        "activities",
        acts.map((a, idx) => (idx === editingIndex ? savedActivity : a))
      );
    }
    setIsDialogOpen(false);
  };

  const remove = (index: number) => {
    updateField(
      "activities",
      acts.filter((_, idx) => idx !== index)
    );
  };

  return (
    <div className="space-y-4">
      {acts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-card p-6 text-center">
          <p className="text-sm text-ink-soft mb-2">{t("ob.noActivities") || "No activities added yet."}</p>
          <p className="text-xs text-ink-faint">{t("ob.activitiesLimitHint") || "You can add up to 10 activities."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {acts.map((a, i) => (
            <div
              key={i}
              className="flex flex-col gap-3 rounded-xl border border-line bg-card p-4 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                    {a.type || t("ob.activity") || "Activity"}
                  </span>
                  <h4 className="text-sm font-semibold text-ink mt-0.5">
                    {a.position}
                    {a.organization && ` — ${a.organization}`}
                  </h4>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="subtle"
                    size="sm"
                    onClick={() => openEditDialog(i)}
                    className="min-h-[44px] px-3.5"
                    aria-label={`${t("ob.edit") || "Edit"} ${a.position}`}
                  >
                    {t("ob.edit") || "Edit"}
                  </Button>
                  <Button
                    type="button"
                    variant="subtle"
                    size="sm"
                    onClick={() => remove(i)}
                    className="min-h-[44px] px-3.5 hover:text-reach"
                    aria-label={`${t("ob.remove") || "Remove"} ${a.position}`}
                  >
                    {t("ob.remove") || "Remove"}
                  </Button>
                </div>
              </div>

              {a.description && (
                <p className="text-xs text-ink-soft line-clamp-2 bg-surface p-2 rounded-lg">
                  {a.description}
                </p>
              )}

              <div className="flex flex-wrap gap-1.5 text-[11px] text-ink-faint">
                {a.grades && a.grades.length > 0 && (
                  <span className="bg-line px-2 py-0.5 rounded">
                    {t("ob.grades") || "Grades"}: {a.grades.join(", ")}
                  </span>
                )}
                {a.timing && a.timing.length > 0 && (
                  <span className="bg-line px-2 py-0.5 rounded">
                    {t("ob.timing") || "Timing"}: {a.timing.join(", ")}
                  </span>
                )}
                {a.continue_in_college && (
                  <span className="bg-accent-soft text-accent px-2 py-0.5 rounded font-medium">
                    {t("ob.collegeBound") || "College bound"}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {acts.length < LIMITS.activities && (
        <Button
          type="button"
          variant="subtle"
          onClick={openAddDialog}
          className="w-full min-h-[44px]"
        >
          {t("ob.addActivity") || "+ Add Activity"}
        </Button>
      )}

      {isDialogOpen && (
        <ActivityDialog
          activity={dialogActivity}
          onSave={handleSave}
          onClose={() => setIsDialogOpen(false)}
          title={
            editingIndex === null
              ? t("ob.addActivity") || "Add Activity"
              : t("ob.editActivity") || "Edit Activity"
          }
        />
      )}
    </div>
  );
}
