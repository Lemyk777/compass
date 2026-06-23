"use client";

import { StepProps } from "../types";
import { useT } from "@/lib/i18n/client";
import { Input, Field } from "@/components/ui/Input";
import { LIMITS } from "@/lib/limits";

export default function StepOrigin({ data, updateField }: StepProps) {
  const t = useT();
  return (
    <div className="space-y-4">
      <Field label={t("ob.country")} htmlFor="country">
        <Input
          id="country"
          value={data.country}
          maxLength={LIMITS.shortText}
          onChange={(e) => updateField("country", e.target.value)}
          placeholder={t("ob.countryPh")}
        />
      </Field>
      <Field label={t("ob.citizenship")} htmlFor="citizenship">
        <Input
          id="citizenship"
          value={data.citizenship}
          maxLength={LIMITS.shortText}
          onChange={(e) => updateField("citizenship", e.target.value)}
          placeholder={t("ob.countryPh")}
        />
      </Field>
    </div>
  );
}
