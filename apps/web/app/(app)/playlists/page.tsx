"use client";
import React from "react";
import { WithAppShell } from "../_shell";
import { PlaylistsIndexPage } from "@/figma_export/pages";
import { usePlaylists } from "@lyra/sdk";
import { useRouter } from "next/navigation";

export default function PlaylistsIndexController() {
  const { data, isLoading } = usePlaylists();
  const router = useRouter();

  const playlists = (data?.items ?? []).map(p => ({
    id: p.id,
    name: p.name,
    createdAt: p.created_at,
    imageUrl: undefined,
    description: undefined,
    tracksCount: 0, // We don't have this in the basic list endpoint
  }));

  return (
    <WithAppShell>
      <PlaylistsIndexPage
        playlists={playlists}
        isLoading={isLoading}
        onSelectPlaylist={(id) => router.push(`/playlists/${id}`)}
        onCreateNew={() => router.push("/playlist-builder")}
      />
    </WithAppShell>
  );
}

