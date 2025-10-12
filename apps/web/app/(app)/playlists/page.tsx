"use client";
import React from "react";
import { WithAppShell } from "../_shell";
import { PlaylistsIndexPage } from "@/figma_export/pages";
import { usePlaylists } from "@lyra/sdk";
import { useRouter } from "next/navigation";

export default function PlaylistsIndexController() {
  const { data, isLoading } = usePlaylists();
  const router = useRouter();
  const [searchValue, setSearchValue] = React.useState("");
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
  const [filter, setFilter] = React.useState<"all" | "active" | "draft" | "scheduled">("all");

  const playlists = (data?.items ?? []).map(p => ({
    id: p.id,
    name: p.name,
    description: undefined,
    genre: "Various",
    trackCount: 0,
    duration: "0:00",
    coverUrl: undefined,
    status: "active" as const,
    createdAt: p.created_at,
    updatedAt: p.created_at,
  }));

  return (
    <WithAppShell>
      <PlaylistsIndexPage
        playlists={playlists}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        filter={filter}
        onFilterChange={setFilter}
        onCreatePlaylist={() => router.push("/playlist-builder")}
        onPlaylistClick={(id) => router.push(`/playlists/${id}`)}
        onPlaylistPlay={() => {}}
        onPlaylistEdit={() => {}}
        onPlaylistDelete={() => {}}
      />
    </WithAppShell>
  );
}

