// Lyra Design System Export — v1.0.0
"use client";

import * as React from "react";
import { ArrowRight, ArrowLeft, Check, Building, MapPin, Music } from "lucide-react";
import { Button } from "@lyra/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@lyra/ui";
import { Input } from "@lyra/ui";
import { Label } from "../../components/ui/label";
import { Badge } from "@lyra/ui";
import { cn } from "@lyra/ui";

export interface OnboardingData {
  organizationName?: string;
  industry?: string;
  locations?: string[];
  businessType?: "cafe" | "gym" | "retail" | "spa" | "restaurant" | "other";
}

export interface OnboardingFlowProps {
  /** Current step (0-indexed) */
  currentStep?: number;
  /** Total steps */
  totalSteps?: number;
  /** Form data */
  data?: OnboardingData;
  /** Callbacks */
  onDataChange?: (data: Partial<OnboardingData>) => void;
  onNext?: () => void;
  onBack?: () => void;
  onComplete?: () => void;
  onSkip?: () => void;
  /** Loading state */
  isLoading?: boolean;
  className?: string;
}

export const OnboardingFlow = React.forwardRef<HTMLDivElement, OnboardingFlowProps>(
  (
    {
      currentStep = 0,
      totalSteps = 3,
      data = {},
      onDataChange,
      onNext,
      onBack,
      onComplete,
      onSkip,
      isLoading = false,
      className,
    },
    ref
  ) => {
    const businessTypes = [
      { id: "cafe", label: "Café", icon: "☕" },
      { id: "gym", label: "Gym", icon: "💪" },
      { id: "retail", label: "Retail Store", icon: "🛍️" },
      { id: "spa", label: "Spa/Wellness", icon: "🧘" },
      { id: "restaurant", label: "Restaurant", icon: "🍽️" },
      { id: "other", label: "Other", icon: "🏢" },
    ];

    const updateData = (updates: Partial<OnboardingData>) => {
      onDataChange?.({ ...data, ...updates });
    };

    const renderStep = () => {
      switch (currentStep) {
        case 0:
          return (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Building className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-2">
                  Tell us about your business
                </h2>
                <p className="text-muted-foreground">
                  We'll use this to personalize your music experience
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="org-name">Organization Name *</Label>
                  <Input
                    id="org-name"
                    placeholder="e.g., Sunrise Café"
                    value={data.organizationName || ""}
                    onChange={(e) =>
                      updateData({ organizationName: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="industry">Industry *</Label>
                  <Input
                    id="industry"
                    placeholder="e.g., Food & Beverage"
                    value={data.industry || ""}
                    onChange={(e) => updateData({ industry: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Business Type *</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {businessTypes.map((type) => (
                      <button
                        key={type.id}
                        onClick={() =>
                          updateData({ businessType: type.id as any })
                        }
                        className={cn(
                          "p-4 rounded-lg border-2 transition-all text-left",
                          data.businessType === type.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <div className="text-2xl mb-2">{type.icon}</div>
                        <div className="font-medium text-sm">{type.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );

        case 1:
          return (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-2">
                  Add your locations
                </h2>
                <p className="text-muted-foreground">
                  Configure music for each of your business locations
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Locations</Label>
                  <div className="space-y-2">
                    {(data.locations || []).map((location, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-3 rounded-lg border"
                      >
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="flex-1">{location}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            updateData({
                              locations: data.locations?.filter(
                                (_, i) => i !== index
                              ),
                            })
                          }
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Enter location name"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const input = e.currentTarget;
                        if (input.value.trim()) {
                          updateData({
                            locations: [
                              ...(data.locations || []),
                              input.value.trim(),
                            ],
                          });
                          input.value = "";
                        }
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      const input =
                        e.currentTarget.previousElementSibling as HTMLInputElement;
                      if (input?.value.trim()) {
                        updateData({
                          locations: [
                            ...(data.locations || []),
                            input.value.trim(),
                          ],
                        });
                        input.value = "";
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground">
                  Press Enter or click Add to add each location
                </p>
              </div>
            </div>
          );

        case 2:
          return (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Music className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-2">
                  You're all set!
                </h2>
                <p className="text-muted-foreground">
                  Let's create your first AI-generated playlist
                </p>
              </div>

              <Card className="bg-gradient-lyra border-0">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                      <Check className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-white">
                      <div className="font-medium mb-1">Organization Setup</div>
                      <div className="text-sm text-white/80">
                        {data.organizationName} - {data.industry}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                      <Check className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-white">
                      <div className="font-medium mb-1">Locations Added</div>
                      <div className="text-sm text-white/80">
                        {(data.locations || []).length} location
                        {(data.locations || []).length !== 1 ? "s" : ""} configured
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                      <Music className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-white">
                      <div className="font-medium mb-1">Ready for AI Music</div>
                      <div className="text-sm text-white/80">
                        Start generating custom playlists
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold text-primary mb-1">
                    15-20
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Tracks per playlist
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold text-primary mb-1">
                    ~60 min
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Average duration
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold text-primary mb-1">
                    30-60s
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Generation time
                  </div>
                </div>
              </div>
            </div>
          );

        default:
          return null;
      }
    };

    const canProceed = () => {
      switch (currentStep) {
        case 0:
          return (
            data.organizationName &&
            data.industry &&
            data.businessType
          );
        case 1:
          return (data.locations || []).length > 0;
        case 2:
          return true;
        default:
          return false;
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          "min-h-screen flex items-center justify-center p-6",
          className
        )}
      >
        <Card className="w-full max-w-2xl">
          <CardHeader>
            {/* Progress */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">
                  Step {currentStep + 1} of {totalSteps}
                </span>
                {onSkip && currentStep < totalSteps - 1 && (
                  <Button variant="ghost" size="sm" onClick={onSkip}>
                    Skip
                  </Button>
                )}
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{
                    width: `${((currentStep + 1) / totalSteps) * 100}%`,
                  }}
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {renderStep()}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-6 border-t">
              <Button
                variant="outline"
                onClick={onBack}
                disabled={currentStep === 0 || isLoading}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>

              {currentStep === totalSteps - 1 ? (
                <Button
                  onClick={onComplete}
                  disabled={!canProceed() || isLoading}
                  size="lg"
                >
                  {isLoading ? "Setting up..." : "Get Started"}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={onNext}
                  disabled={!canProceed() || isLoading}
                  size="lg"
                >
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
);

OnboardingFlow.displayName = "OnboardingFlow";
