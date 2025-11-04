'use client';

import React from 'react';
import { SignIn, ThemeProvider } from '@lyra/ui/dist/components';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function PublicLoginPage() {
  const supabase = createClientComponentClient();
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

  return (
    <ThemeProvider theme={theme} toggleTheme={toggleTheme}>
      <div className="min-h-screen bg-background text-foreground">
        <div className="px-4 md:px-6 py-6">
          <SignIn 
            onSignIn={() => {}}
            onGoogleSignIn={async () => {
              const origin = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || '';
              await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                  redirectTo: `${origin}/auth/callback`,
                },
              });
            }}
          />
        </div>
      </div>
    </ThemeProvider>
  );
}


