"use client";

import { StepProps } from "../types";
import { useT } from "@/lib/i18n/client";
import { Input, Field } from "@/components/ui/Input";
import { LIMITS } from "@/lib/limits";
import { useOnboardingContext } from "../context/OnboardingContext";
import StepSource from "./StepSource";

export default function StepOrigin(props: StepProps) {
  const t = useT();
  const { data, updateFields } = props;
  const { showSurvey } = useOnboardingContext();
  // One question instead of two: for international applicants residence and
  // citizenship are the same, so we ask once and feed the value to both fields
  // the analysis reads.
  const value = data.citizenship || data.country;
  return (
    <div className="space-y-6">
      <Field label={t("ob.countryCitizenship")} htmlFor="country">
        <Input
          id="country"
          value={value}
          maxLength={LIMITS.shortText}
          onChange={(e) =>
            updateFields({ country: e.target.value, citizenship: e.target.value })
          }
          placeholder={t("ob.countryPh")}
        />
      </Field>

      {/* "How did you hear about us?" folded into the first question for
          non-referral signups — one fewer step. Optional: it never blocks
          continuing, and stays hidden for referred / already-attributed users. */}
      {showSurvey && (
        <div className="space-y-3 border-t border-line pt-5">
          <p className="text-sm font-medium text-ink">{t("ob.tSource")}</p>
          <StepSource {...props} />
        </div>
      )}
    </div>
  );
}
