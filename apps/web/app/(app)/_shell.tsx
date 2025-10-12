"use client";
import React from "react";
import { AppShell } from "@/figma_export/layouts";
import { usePathname } from "next/navigation";

type NavItem = { id: string; label: string; href: string; active?: boolean };

export function WithAppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const items: NavItem[] = [
    { id: "overview", label: "Overview", href: "/overview", active: pathname?.startsWith("/overview") ?? false },
    { id: "library", label: "Library", href: "/library", active: pathname?.startsWith("/library") ?? false },
    { id: "playlists", label: "Playlists", href: "/playlists", active: pathname?.startsWith("/playlists") ?? false },
    { id: "builder", label: "Builder", href: "/playlist-builder", active: pathname?.startsWith("/playlist-builder") ?? false },
    { id: "analytics", label: "Analytics", href: "/analytics", active: pathname?.startsWith("/analytics") ?? false }
  ];

  return (
    <AppShell
      topNav={{
        searchPlaceholder: "Search tracks, playlists…",
        onSearchChange: () => {},
        userAvatarUrl: undefined,
        userMenuItems: [
          { id: "settings", label: "Settings" },
          { id: "admin", label: "Admin" },
          { id: "signout", label: "Sign out" }
        ]
      }}
      sidebar={{ items, collapsed: false, onToggleCollapsed: () => {} }}
      bottomPlayer={null}
    >
      {children}
    </AppShell>
  );
}

