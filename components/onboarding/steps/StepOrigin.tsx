"use client";

import { StepProps } from "../types";
import { useT } from "@/lib/i18n/client";
import { Input, Field } from "@/components/ui/Input";
import { LIMITS } from "@/lib/limits";

export default function StepOrigin({ data, updateFields }: StepProps) {
  const t = useT();
  // One question instead of two: for international applicants residence and
  // citizenship are the same, so we ask once and feed the value to both fields
  // the analysis reads.
  const value = data.citizenship || data.country;
  return (
    <div className="space-y-4">
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
    </div>
  );
}
