"use client";
import * as React from "react";

type Theme = "dark" | "light";
type Props = { children: React.ReactNode; defaultTheme?: Theme };

export function ThemeProvider({ children, defaultTheme = "dark" }: Props) {
  React.useEffect(() => {
    if (typeof document === "undefined") return;
    const saved = (localStorage.getItem("lyra.theme") as Theme | null) || defaultTheme;
    document.documentElement.dataset.theme = saved;
  }, [defaultTheme]);

  return <>{children}</>;
}

