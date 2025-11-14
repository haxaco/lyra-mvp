'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingFlow, ThemeProvider } from '@lyra/ui/dist/components';

export default function AuthOnboardingPage() {
  const router = useRouter();
  const [theme, setTheme] = React.useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    return (localStorage.getItem('lyra-theme') as 'light' | 'dark') || 'light';
  });
  const [isChecking, setIsChecking] = React.useState(true);
  const [shouldShowOnboarding, setShouldShowOnboarding] = React.useState(false);

  React.useEffect(() => {
    // Check if organization has already completed onboarding
    async function checkOnboardingStatus() {
      try {
        const response = await fetch('/api/org/onboarding/status');
        const data = await response.json();
        
        if (data.isComplete) {
          // Organization already completed onboarding, skip to dashboard
          router.push('/');
        } else {
          // Show onboarding flow
          setShouldShowOnboarding(true);
        }
      } catch (error) {
        console.error('[onboarding] Error checking onboarding status:', error);
        // On error, show onboarding to be safe
        setShouldShowOnboarding(true);
      } finally {
        setIsChecking(false);
      }
    }

    checkOnboardingStatus();
  }, [router]);

  const toggleTheme = React.useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      if (typeof window !== 'undefined') {
        document.documentElement.classList.toggle('dark', next === 'dark');
        localStorage.setItem('lyra-theme', next);
      }
      return next;
    });
  }, []);

  const handleComplete = React.useCallback(async (data?: { organizationData: any; brandData: any }) => {
    try {
      // Mark organization onboarding as complete and save data to database
      const response = await fetch('/api/org/onboarding/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationData: data?.organizationData,
          brandData: data?.brandData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark onboarding as complete');
      }

      // Navigate to dashboard root
      router.push('/');
    } catch (error) {
      console.error('[onboarding] Error completing onboarding:', error);
      // Still navigate even if API call fails
      router.push('/');
    }
  }, [router]);

  if (isChecking) {
    return (
      <ThemeProvider theme={theme} toggleTheme={toggleTheme}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </ThemeProvider>
    );
  }

  if (!shouldShowOnboarding) {
    return null; // Will redirect
  }

  return (
    <ThemeProvider theme={theme} toggleTheme={toggleTheme}>
      <div className="px-4 md:px-6 py-6">
        <OnboardingFlow onComplete={handleComplete} />
      </div>
    </ThemeProvider>
  );
}


