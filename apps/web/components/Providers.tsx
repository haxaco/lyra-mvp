"use client";

import { ThemeProvider } from "@lyra/ui";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme="dark">
      {children}
    </ThemeProvider>
  );
}

