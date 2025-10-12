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
    imageUrl: undefined,
    trackCount: 0,
    duration: "0:00",
    lastModified: p.created_at,
  }));

  return (
    <WithAppShell>
      <PlaylistsIndexPage
        playlists={playlists}
        onCreatePlaylist={() => router.push("/playlist-builder")}
        onPlaylistClick={(id) => router.push(`/playlists/${id}`)}
        onPlaylistPlay={() => {}}
      />
    </WithAppShell>
  );
}

