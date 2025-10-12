"use client";

import { ThemeProvider } from "@lyra/ui";
import { QueryProvider } from "./QueryProvider";
import { PlayerProvider } from "../../components/player";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <PlayerProvider>
          {children}
        </PlayerProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}

