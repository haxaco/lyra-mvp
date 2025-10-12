"use client";
import React from "react";
import { useState } from "react";
import { WithAppShell } from "../_shell";
import { OnboardingFlow } from "@/figma_export/pages";
import { useRouter } from "next/navigation";

export default function OnboardingController() {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState({
    organizationName: "",
    brandVoice: "",
    genres: [] as string[],
    locations: [] as string[],
  });
  const router = useRouter();

  const totalSteps = 3;

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    // Call bootstrap API or save preferences
    console.log("Onboarding complete:", data);
    router.push("/overview");
  };

  return (
    <WithAppShell>
      <OnboardingFlow
        currentStep={currentStep}
        totalSteps={totalSteps}
        data={data}
        onDataChange={(partial) => setData(prev => ({ ...prev, ...partial }))}
        onNext={handleNext}
        onBack={handleBack}
        onComplete={handleComplete}
        isLoading={false}
      />
    </WithAppShell>
  );
}

