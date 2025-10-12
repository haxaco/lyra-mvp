"use client";
import React from "react";
import { useParams } from "next/navigation";
import { WithAppShell } from "../../_shell";
import { PlaylistViewerPage } from "@/figma_export/pages";
import { usePlaylist } from "@lyra/sdk";
import { usePlayer } from "../../../../components/player";
import { getPlayableUrl } from "../../../../lib/getPlayableUrl";

export default function PlaylistViewerController() {
  const { id } = useParams() as { id: string };
  const { data, isLoading } = usePlaylist(id);
  const { playQueue } = usePlayer();

  const playlistName = data?.playlist?.name || "Untitled Playlist";
  const totalTracks = data?.items?.length || 0;
  const totalDuration = (data?.items ?? []).reduce((sum, i) => sum + (i.tracks?.duration_seconds || 0), 0);
  const durationStr = `${Math.floor(totalDuration / 60)}:${String(totalDuration % 60).padStart(2, '0')}`;

  const tracks = (data?.items ?? [])
    .filter(i => i.tracks)
    .map((i) => ({
      id: i.tracks!.id,
      title: i.tracks!.title || "Untitled",
      artist: "AI Generated",
      duration: i.tracks!.duration_seconds 
        ? `${Math.floor(i.tracks!.duration_seconds / 60)}:${String(i.tracks!.duration_seconds % 60).padStart(2, '0')}` 
        : "0:00",
      genre: (i.tracks!.meta as any)?.genre || "",
      isPlaying: false,
    }));

  return (
    <WithAppShell>
      <PlaylistViewerPage
        playlistName={playlistName}
        playlistDescription={data?.playlist?.name}
        playlistGenres={[]}
        totalDuration={durationStr}
        trackCount={totalTracks}
        createdDate={data?.playlist?.created_at}
        tracks={tracks}
        onPlayAll={async () => {
          const queue = (data?.items ?? []).filter(i => i.tracks).map((i) => ({
            id: i.tracks!.id,
            title: i.tracks!.title,
            getUrl: async () => getPlayableUrl(i.tracks!.r2_key || "")
          }));
          await playQueue(queue);
        }}
        onPlayTrack={async (trackId) => {
          const tr = (data?.items ?? []).find(i => i.tracks?.id === trackId)?.tracks;
          if (!tr) return;
          const url = await getPlayableUrl(tr.r2_key || "");
          await playQueue([{ id: tr.id, title: tr.title, getUrl: async () => url }]);
        }}
        onBack={() => window.history.back()}
        onEdit={() => {}}
        onDelete={() => {}}
      />
    </WithAppShell>
  );
}

