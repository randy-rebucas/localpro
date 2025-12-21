"use client";

import { useRouter } from "next/navigation";
import { EnhancedOnboarding } from "@/components/onboarding/enhanced-onboarding";

export default function OnboardingPage() {
  const router = useRouter();

  const handleOnboardingComplete = () => {
    router.push("/dashboard");
  };

  return <EnhancedOnboarding onComplete={handleOnboardingComplete} />;
}