import { Onboarding } from "@/components/onboarding/Onboarding";
import { emptyProfile } from "@/lib/types";

export const metadata = { title: "Compass — Build your profile (preview)" };

// Public, auth-free preview of the redesigned onboarding. Renders in preview
// mode (Submit just returns to the demo dashboard; nothing is saved).
export default function OnboardingPreviewPage() {
  return <Onboarding initial={emptyProfile()} basePath="/demo" preview />;
}
