"use client";

import { QueryProvider } from "./QueryProvider";
import { PlayerProvider } from "../../components/player";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <PlayerProvider>
        {children}
      </PlayerProvider>
    </QueryProvider>
  );
}

