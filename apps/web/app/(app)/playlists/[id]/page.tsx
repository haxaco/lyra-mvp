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

  const playlist = data?.playlist
    ? { 
        id: data.playlist.id, 
        name: data.playlist.name, 
        createdAt: data.playlist.created_at,
        description: undefined,
        imageUrl: undefined,
      }
    : { id, name: "Playlist", createdAt: "", description: undefined, imageUrl: undefined };

  const tracks = (data?.items ?? [])
    .filter(i => i.tracks)
    .map((i) => ({
      id: i.tracks!.id,
      title: i.tracks!.title || "Untitled",
      artist: "AI Generated",
      duration: i.tracks!.duration_seconds 
        ? `${Math.floor(i.tracks!.duration_seconds / 60)}:${String(i.tracks!.duration_seconds % 60).padStart(2, '0')}` 
        : "0:00",
      position: i.position,
    }));

  return (
    <WithAppShell>
      <PlaylistViewerPage
        playlist={playlist}
        tracks={tracks}
        isLoading={isLoading}
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
        onRemoveTrack={() => {}}
        onReorderTracks={() => {}}
        onRenamePlaylist={() => {}}
      />
    </WithAppShell>
  );
}

