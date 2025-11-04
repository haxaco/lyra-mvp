'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Overview, PlaylistLibrary } from '@lyra/ui/dist/components';
import { usePlayerContext } from './layout';

export default function DashboardHome() {
  const router = useRouter();
  const player = usePlayerContext();
  return (
    <div className="px-4 md:px-6 py-6">
      {/* Top overview widgets */}
      <Overview onPlayTrack={(track: any) => {
        if (track) {
          player.playTrack({
            id: track.id,
            title: track.title,
            artist: track.artist || 'Lyra AI',
            image: track.image || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
            playlistId: track.playlistId,
            playlistName: track.playlistName,
          });
        } else {
          player.setIsPlaying(false);
        }
      }} />

      {/* Quick actions */}
      <div className="mt-6 flex gap-3">
        <button
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90"
          onClick={() => router.push('/compose')}
        >
          Compose Playlist
        </button>
        <button
          className="px-4 py-2 rounded-md border border-border hover:bg-secondary/50"
          onClick={() => router.push('/builder')}
        >
          Open Track Builder
        </button>
      </div>

      {/* Your Playlists (full library for now; can be refined later) */}
      {/* <div className="mt-8">
        <PlaylistLibrary
          onCreatePlaylist={() => router.push('/compose')}
          onPlayTrack={(track: any) => {
            if (track) {
              player.playTrack({
                id: track.id,
                title: track.title,
                artist: track.artist || 'Lyra AI',
                image: track.image || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
                playlistId: track.playlistId,
                playlistName: track.playlistName,
              });
            } else {
              player.setIsPlaying(false);
            }
          }}
          onViewPlaylist={(p: any) => router.push(`/playlists/${p.id}`)}
        />
      </div> */}
    </div>
  );
}


