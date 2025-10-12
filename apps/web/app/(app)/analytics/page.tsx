"use client";
import React from "react";
import { WithAppShell } from "../_shell";
import { AnalyticsPage } from "@/figma_export/pages";

export default function AnalyticsController() {
  const kpis = [
    { title: "Total Streams", value: "—", change: "0%", trend: "neutral" as const },
    { title: "Total Skips", value: "—", change: "0%", trend: "neutral" as const },
    { title: "Total Likes", value: "—", change: "0%", trend: "neutral" as const },
    { title: "Avg. Completion", value: "—", change: "0%", trend: "neutral" as const },
  ];

  const chartData = {
    streams: [],
    skips: [],
    labels: [],
  };

  return (
    <WithAppShell>
      <AnalyticsPage
        kpis={kpis}
        chartData={chartData}
        dateRange={{ start: new Date(), end: new Date() }}
        onDateRangeChange={() => {}}
        onExport={() => {}}
      />
    </WithAppShell>
  );
}

