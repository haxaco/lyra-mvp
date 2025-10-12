"use client";

import { ThemeProvider } from "@lyra/ui";
import { QueryProvider } from "./QueryProvider";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        {children}
      </QueryProvider>
    </ThemeProvider>
  );
}

