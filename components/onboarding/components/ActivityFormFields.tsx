"use client";

import { useT } from "@/lib/i18n/client";
import { LIMITS } from "@/lib/limits";
import { Input } from "@/components/ui/Input";
import {
  ACTIVITY_TYPES,
  GRADE_LEVELS,
  ACTIVITY_TIMING,
  type Activity,
} from "@/lib/types";

const selectClass =
  "h-11 w-full rounded-xl border border-line bg-card px-3 text-[0.95rem] text-ink focus-visible:focus-ring";
const textareaClass =
  "w-full rounded-xl border border-line bg-card px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus-visible:focus-ring";

function toggleIn(arr: string[] | undefined, v: string): string[] {
  const cur = arr ?? [];
  return cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v];
}

interface ActivityFormFieldsProps {
  activity: Activity;
  update: (patch: Partial<Activity>) => void;
}

export default function ActivityFormFields({
  activity,
  update,
}: ActivityFormFieldsProps) {
  const t = useT();

  return (
    <>
      <div>
        <label htmlFor="dialog-act-type" className="mb-1.5 block text-xs font-medium text-ink-soft">
          {t("ob.activityType")}
        </label>
        <select
          id="dialog-act-type"
          value={activity.type ?? ""}
          onChange={(e) => update({ type: e.target.value })}
          className={selectClass}
          required
        >
          <option value="">{t("ob.activityTypePh")}</option>
          {ACTIVITY_TYPES.map((ty) => (
            <option key={ty} value={ty}>{ty}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="dialog-act-pos" className="mb-1.5 block text-xs font-medium text-ink-soft">{t("ob.position")}</label>
        <Input
          id="dialog-act-pos"
          value={activity.position}
          maxLength={LIMITS.activityPosition}
          onChange={(e) => update({ position: e.target.value })}
          placeholder={t("ob.positionPh")}
          required
        />
      </div>

      <div>
        <label htmlFor="dialog-act-org" className="mb-1.5 block text-xs font-medium text-ink-soft">{t("ob.organization")}</label>
        <Input
          id="dialog-act-org"
          value={activity.organization ?? ""}
          maxLength={LIMITS.activityOrganization}
          onChange={(e) => update({ organization: e.target.value })}
          placeholder={t("ob.organizationPh")}
        />
      </div>

      <div>
        <label htmlFor="dialog-act-desc" className="mb-1.5 block text-xs font-medium text-ink-soft">{t("ob.activityDesc")}</label>
        <textarea
          id="dialog-act-desc"
          value={activity.description ?? ""}
          maxLength={LIMITS.activityDescription}
          onChange={(e) => update({ description: e.target.value })}
          rows={3}
          placeholder={t("ob.activityDescPh")}
          className={textareaClass}
        />
      </div>

      <fieldset className="border-none p-0 m-0 block space-y-1.5">
        <legend className="block text-xs font-medium text-ink-soft">{t("ob.gradeLevels")}</legend>
        <div className="flex flex-wrap gap-2">
          {GRADE_LEVELS.map((g) => (
            <button
              key={g}
              type="button"
              aria-pressed={(activity.grades ?? []).includes(g)}
              onClick={() => update({ grades: toggleIn(activity.grades, g) })}
              className={`rounded-full border px-3.5 py-2 text-xs transition-colors focus-visible:focus-ring min-h-[44px] ${(activity.grades ?? []).includes(g) ? "border-accent bg-accent-soft text-accent-ink" : "border-line bg-card text-ink-soft hover:border-ink/30"}`}
            >
              {g}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="border-none p-0 m-0 block space-y-1.5">
        <legend className="block text-xs font-medium text-ink-soft">{t("ob.timing")}</legend>
        <div className="flex flex-wrap gap-2">
          {ACTIVITY_TIMING.map((timingOpt) => (
            <button
              key={timingOpt}
              type="button"
              aria-pressed={(activity.timing ?? []).includes(timingOpt)}
              onClick={() => update({ timing: toggleIn(activity.timing, timingOpt) })}
              className={`rounded-full border px-3.5 py-2 text-xs transition-colors focus-visible:focus-ring min-h-[44px] ${(activity.timing ?? []).includes(timingOpt) ? "border-accent bg-accent-soft text-accent-ink" : "border-line bg-card text-ink-soft hover:border-ink/30"}`}
            >
              {timingOpt}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="flex items-center justify-between min-h-[44px] cursor-pointer">
        <span className="text-sm text-ink">{t("ob.continueCollege")}</span>
        <button
          type="button"
          role="switch"
          aria-checked={activity.continue_in_college ?? false}
          onClick={() => update({ continue_in_college: !activity.continue_in_college })}
          className="group relative flex items-center justify-center p-2 -mr-2 min-h-[44px] min-w-[44px] focus:outline-none"
        >
          <span className={`relative h-6 w-11 rounded-full transition-colors group-focus-visible:focus-ring ${activity.continue_in_college ? "bg-accent" : "bg-neutral-300"}`}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${activity.continue_in_college ? "left-0.5 translate-x-5" : "left-0.5"}`} />
          </span>
        </button>
      </label>
    </>
  );
}

