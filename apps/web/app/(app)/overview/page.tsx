"use client";
import React from "react";
import { WithAppShell } from "../_shell";
import { OverviewPage } from "@/figma_export/pages";
import { useWhoAmI, useOrg } from "@lyra/sdk";

export default function OverviewController() {
  const who = useWhoAmI();
  const org = useOrg();

  const stats = [
    { title: "Hours Streamed", value: "—", trend: "neutral" as const },
    { title: "Skips", value: "—", trend: "neutral" as const },
    { title: "Likes", value: "—", trend: "neutral" as const }
  ];
  
  const recentPlaylists: Array<{
    id: string;
    name: string;
    genre: string;
    duration: string;
    tracks: number;
    status?: "active" | "draft" | "scheduled";
  }> = [];

  return (
    <WithAppShell>
      <OverviewPage
        welcomeMessage={`Welcome back${who.data?.email ? `, ${who.data.email.split('@')[0]}` : ''}!`}
        stats={stats}
        recentPlaylists={recentPlaylists}
        onCreatePlaylist={() => window.location.href = "/playlist-builder"}
        onViewAnalytics={() => window.location.href = "/analytics"}
        onViewLibrary={() => window.location.href = "/library"}
      />
    </WithAppShell>
  );
}

