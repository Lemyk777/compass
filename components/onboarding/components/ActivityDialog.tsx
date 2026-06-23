"use client";

import { useState, useEffect } from "react";
import { useT } from "@/lib/i18n/client";
import { Button } from "@/components/ui/Button";
import { type Activity } from "@/lib/types";
import ActivityFormFields from "./ActivityFormFields";

interface ActivityDialogProps {
  activity: Activity;
  onSave: (activity: Activity) => void;
  onClose: () => void;
  title: string;
}

export default function ActivityDialog({
  activity: initialActivity,
  onSave,
  onClose,
  title,
}: ActivityDialogProps) {
  const t = useT();
  const [activity, setActivity] = useState<Activity>({ ...initialActivity });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const update = (patch: Partial<Activity>) => {
    setActivity((prev) => ({ ...prev, ...patch }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(activity);
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
          <ActivityFormFields activity={activity} update={update} />

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

