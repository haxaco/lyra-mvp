import React, { useState } from 'react';
// Logo paths - served from Next.js public folder
// lyra-logo-light.png = light/white logo (for dark backgrounds/dark theme)
// lyra-logo-dark.png = dark/black logo (for light backgrounds/light theme)
const lyraLogoForLightTheme = '/lyra-logo-light.png';  // Dark logo for light theme (light background)
const lyraLogoForDarkTheme = '/lyra-logo-dark.png';  // Light logo for dark theme (dark background)
import { Button } from '../primitives/button';
import { useTheme } from './ThemeProvider';
import { Input } from '../primitives/input';
import { Label } from '../primitives/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../primitives/card';
import { Progress } from '../primitives/progress';
import { ArrowRight, Building, Palette, Check } from 'lucide-react';

interface OnboardingFlowProps {
  onComplete: (data?: { organizationData: OrganizationData; brandData: BrandData }) => void;
}

interface OrganizationData {
  name: string;
  industry: string;
  size: string;
}

interface BrandData {
  website: string;
  instagram: string;
  facebook: string;
  twitter: string;
  description: string;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const { theme } = useTheme();
  const [currentStep, setCurrentStep] = useState(1);
  const [organizationData, setOrganizationData] = useState<OrganizationData>({
    name: '',
    industry: '',
    size: ''
  });
  const [brandData, setBrandData] = useState<BrandData>({
    website: '',
    instagram: '',
    facebook: '',
    twitter: '',
    description: ''
  });

  const totalSteps = 3;
  const progress = (currentStep / totalSteps) * 100;

  const handleOrganizationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (organizationData.name && organizationData.industry && organizationData.size) {
      setCurrentStep(2);
    }
  };

  const handleBrandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentStep(3);
  };

  const handleComplete = () => {
    // Pass onboarding data to parent component to save to database
    onComplete({ organizationData, brandData });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center">
            <img 
              src={theme === 'light' ? lyraLogoForLightTheme : lyraLogoForDarkTheme} 
              alt="Lyra - real music. created by you."
              className="h-16 w-auto transition-opacity duration-200"
            />
          </div>
          <p className="text-muted-foreground">
            Welcome to Lyra! Let's set up your AI music streaming experience.
          </p>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground text-center">
            Step {currentStep} of {totalSteps}
          </p>
        </div>

        {/* Step Content */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Building className="w-5 h-5 text-primary" />
                <CardTitle>Organization Setup</CardTitle>
              </div>
              <CardDescription>
                Tell us about your business so we can tailor the perfect music experience.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleOrganizationSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="org-name">Organization Name</Label>
                  <Input
                    id="org-name"
                    value={organizationData.name}
                    onChange={(e) => setOrganizationData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your business name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={organizationData.industry}
                    onChange={(e) => setOrganizationData(prev => ({ ...prev, industry: e.target.value }))}
                    placeholder="e.g., Café, Gym, Retail Store"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="size">Business Size</Label>
                  <Input
                    id="size"
                    value={organizationData.size}
                    onChange={(e) => setOrganizationData(prev => ({ ...prev, size: e.target.value }))}
                    placeholder="e.g., 1-10 employees, 11-50 employees"
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Continue <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Palette className="w-5 h-5 text-primary" />
                <CardTitle>Brand Information</CardTitle>
              </div>
              <CardDescription>
                Share your brand details to help us understand your aesthetic and vibe.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBrandSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="website">Website URL</Label>
                  <Input
                    id="website"
                    type="url"
                    value={brandData.website}
                    onChange={(e) => setBrandData(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://yourwebsite.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram Handle</Label>
                  <Input
                    id="instagram"
                    value={brandData.instagram}
                    onChange={(e) => setBrandData(prev => ({ ...prev, instagram: e.target.value }))}
                    placeholder="@yourbrand"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="facebook">Facebook Page</Label>
                  <Input
                    id="facebook"
                    value={brandData.facebook}
                    onChange={(e) => setBrandData(prev => ({ ...prev, facebook: e.target.value }))}
                    placeholder="https://facebook.com/yourbrand"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twitter">Twitter/X Handle</Label>
                  <Input
                    id="twitter"
                    value={brandData.twitter}
                    onChange={(e) => setBrandData(prev => ({ ...prev, twitter: e.target.value }))}
                    placeholder="@yourbrand"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Brand Description</Label>
                  <Input
                    id="description"
                    value={brandData.description}
                    onChange={(e) => setBrandData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your brand vibe and atmosphere"
                  />
                </div>
                <Button type="submit" className="w-full">
                  Continue <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Check className="w-5 h-5 text-green-500" />
                <CardTitle>Setup Complete!</CardTitle>
              </div>
              <CardDescription>
                Perfect! We've gathered everything we need to create your personalized music experience.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <h4>What happens next?</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• AI will analyze your brand and industry</li>
                  <li>• Custom playlists will be generated for your space</li>
                  <li>• You can fine-tune music preferences in the dashboard</li>
                  <li>• Start streaming immediately with our curated collections</li>
                </ul>
              </div>
              <Button onClick={handleComplete} className="w-full">
                Enter Dashboard
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};