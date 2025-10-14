'use client';

import React, { useState, useEffect } from 'react';
import { SignIn, OnboardingFlow, Dashboard, ThemeProvider } from '@lyra/ui/dist/components';
import { Toaster } from '@lyra/ui';

export default function TestDesignSystemPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Check if user is authenticated
    const authToken = localStorage.getItem('lyra-auth-token');
    if (authToken) {
      setIsAuthenticated(true);
    }

    // Check if user has completed onboarding
    const onboardingComplete = localStorage.getItem('lyra-onboarding-complete');
    if (onboardingComplete === 'true') {
      setIsOnboarded(true);
    }

    // Check for saved theme preference
    const savedTheme = localStorage.getItem('lyra-theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    // Apply theme to document
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('lyra-theme', theme);
  }, [theme]);

  const handleSignIn = () => {
    setIsAuthenticated(true);
    localStorage.setItem('lyra-auth-token', 'demo-token-' + Date.now());
  };

  const handleOnboardingComplete = () => {
    setIsOnboarded(true);
    localStorage.setItem('lyra-onboarding-complete', 'true');
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeProvider theme={theme} toggleTheme={toggleTheme}>
      <div className="min-h-screen bg-background text-foreground">
        {!isAuthenticated ? (
          <SignIn onSignIn={handleSignIn} />
        ) : !isOnboarded ? (
          <OnboardingFlow onComplete={handleOnboardingComplete} />
        ) : (
          <Dashboard />
        )}
        <Toaster />
      </div>
    </ThemeProvider>
  );
}