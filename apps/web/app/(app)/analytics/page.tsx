"use client";
import React from "react";
import { WithAppShell } from "../_shell";
import { AnalyticsPage } from "@/figma_export/pages";

export default function AnalyticsController() {
  const [period, setPeriod] = React.useState<"7d" | "30d" | "90d" | "1y">("30d");

  const stats = [
    { title: "Total Streams", value: "—", change: "0%", trend: "neutral" as const },
    { title: "Total Skips", value: "—", change: "0%", trend: "neutral" as const },
    { title: "Total Likes", value: "—", change: "0%", trend: "neutral" as const },
    { title: "Avg. Completion", value: "—", change: "0%", trend: "neutral" as const },
  ];

  const streamingData: Array<{ label: string; value: number }> = [];
  const topGenres: Array<{ genre: string; streams: number; percentage: number }> = [];
  const topPlaylists: Array<{ name: string; streams: number; skipRate: number }> = [];

  return (
    <WithAppShell>
      <AnalyticsPage
        period={period}
        onPeriodChange={setPeriod}
        stats={stats}
        streamingData={streamingData}
        topGenres={topGenres}
        topPlaylists={topPlaylists}
        isLoading={false}
      />
    </WithAppShell>
  );
}

