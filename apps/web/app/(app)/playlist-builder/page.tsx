"use client";
import React from "react";
import { WithAppShell } from "../_shell";
import { PlaylistBuilderPage } from "@/figma_export/pages";
import { useEnqueueJob } from "@lyra/sdk";

export default function PlaylistBuilderController() {
  const enqueue = useEnqueueJob();

  const handleGenerate = async (params: any) => {
    try {
      await enqueue.mutateAsync(params);
    } catch (error) {
      console.error("Generation failed:", error);
    }
  };

  return (
    <WithAppShell>
      <PlaylistBuilderPage
        onGenerate={handleGenerate}
        isGenerating={enqueue.isPending}
        lastResult={
          enqueue.isSuccess && enqueue.data?.ok
            ? {
                success: true,
                trackIds: enqueue.data.items?.map((i: any) => i.dbId) || [],
                message: `Generated ${enqueue.data.items?.length || 0} tracks`,
              }
            : enqueue.isError
            ? {
                success: false,
                error: (enqueue.error as Error)?.message || "Generation failed",
              }
            : undefined
        }
      />
    </WithAppShell>
  );
}

