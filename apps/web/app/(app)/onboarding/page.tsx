"use client";
import React from "react";
import { useState } from "react";
import { WithAppShell } from "../_shell";
import { OnboardingFlow } from "@/figma_export/pages";
import { useRouter } from "next/navigation";

export default function OnboardingController() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({ orgName: "", brandVoice: "", preferences: {} });
  const router = useRouter();

  const steps = [
    { id: "org", title: "Organization", description: "Set up your organization" },
    { id: "brand", title: "Brand Voice", description: "Define your brand" },
    { id: "prefs", title: "Preferences", description: "Customize your experience" }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    // Call bootstrap API or save preferences
    console.log("Onboarding complete:", formData);
    router.push("/overview");
  };

  return (
    <WithAppShell>
      <OnboardingFlow
        steps={steps}
        currentStep={currentStep}
        onNext={handleNext}
        onBack={handleBack}
        onSubmit={handleSubmit}
        onStepChange={setCurrentStep}
        formData={formData}
        onFormChange={setFormData}
      />
    </WithAppShell>
  );
}

