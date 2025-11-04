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

  const handleComplete = React.useCallback(() => {
    // Mark onboarding as complete
    localStorage.setItem('lyra-onboarding-complete', 'true');
    // Navigate to dashboard root
    router.push('/');
  }, [router]);

  return (
    <ThemeProvider theme={theme} toggleTheme={toggleTheme}>
      <div className="px-4 md:px-6 py-6">
        <OnboardingFlow onComplete={handleComplete} />
      </div>
    </ThemeProvider>
  );
}


