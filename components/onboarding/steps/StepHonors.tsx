"use client";

import { useState } from "react";
import { StepProps } from "../types";
import { useT } from "@/lib/i18n/client";
import { emptyHonor, type Honor } from "@/lib/types";
import { LIMITS } from "@/lib/limits";
import { Button } from "@/components/ui/Button";
import HonorDialog from "../components/HonorDialog";

export default function StepHonors({ data, updateField }: StepProps) {
  const t = useT();
  const honors = data.honors ?? [];

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [dialogHonor, setDialogHonor] = useState<Honor>(emptyHonor());

  const openAddDialog = () => {
    setEditingIndex(null);
    setDialogHonor(emptyHonor());
    setIsDialogOpen(true);
  };

  const openEditDialog = (index: number) => {
    setEditingIndex(index);
    setDialogHonor({ ...honors[index] });
    setIsDialogOpen(true);
  };

  const handleSave = (savedHonor: Honor) => {
    if (editingIndex === null) {
      // Adding new honor
      updateField("honors", [...honors, savedHonor]);
    } else {
      // Editing existing honor
      updateField(
        "honors",
        honors.map((h, idx) => (idx === editingIndex ? savedHonor : h))
      );
    }
    setIsDialogOpen(false);
  };

  const remove = (index: number) => {
    updateField(
      "honors",
      honors.filter((_, idx) => idx !== index)
    );
  };

  return (
    <div className="space-y-4">
      {honors.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line bg-card px-4 py-6 text-center text-sm text-ink-soft">
          {t("ob.honorsEmpty")}
        </p>
      ) : (
        <div className="space-y-3">
          {honors.map((h, i) => (
            <div
              key={i}
              className="flex flex-col gap-3 rounded-xl border border-line bg-card p-4 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 pr-4">
                  <h4 className="text-sm font-semibold text-ink break-words">
                    {h.title}
                  </h4>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="subtle"
                    size="sm"
                    onClick={() => openEditDialog(i)}
                    className="min-h-[44px] px-3.5"
                    aria-label={`${t("ob.edit") || "Edit"} ${h.title}`}
                  >
                    {t("ob.edit") || "Edit"}
                  </Button>
                  <Button
                    type="button"
                    variant="subtle"
                    size="sm"
                    onClick={() => remove(i)}
                    className="min-h-[44px] px-3.5 hover:text-reach"
                    aria-label={`${t("ob.remove") || "Remove"} ${h.title}`}
                  >
                    {t("ob.remove") || "Remove"}
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 text-[11px] text-ink-faint">
                {h.grades && h.grades.length > 0 && (
                  <span className="bg-line px-2 py-0.5 rounded">
                    {t("ob.grades") || "Grades"}: {h.grades.join(", ")}
                  </span>
                )}
                {h.levels && h.levels.length > 0 && (
                  <span className="bg-line px-2 py-0.5 rounded">
                    {t("ob.honorLevels") || "Levels"}: {h.levels.join(", ")}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {honors.length < LIMITS.honors && (
        <Button
          type="button"
          variant="subtle"
          onClick={openAddDialog}
          className="w-full min-h-[44px]"
        >
          {t("ob.addHonor") || "+ Add Honor"}
        </Button>
      )}

      {isDialogOpen && (
        <HonorDialog
          honor={dialogHonor}
          onSave={handleSave}
          onClose={() => setIsDialogOpen(false)}
          title={
            editingIndex === null
              ? t("ob.addHonor") || "Add Honor"
              : t("ob.editHonor") || "Edit Honor"
          }
        />
      )}
    </div>
  );
}
