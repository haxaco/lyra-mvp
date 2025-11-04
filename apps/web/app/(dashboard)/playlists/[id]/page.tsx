'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { PlaylistViewer } from '@lyra/ui/dist/components';
import { usePlaylist } from '@lyra/sdk';
import { usePlayerContext } from '../../layout';

function formatDuration(seconds?: number | null) {
  if (!seconds || seconds <= 0) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatTrackDuration(seconds?: number | null) {
  if (!seconds || seconds <= 0) return '—';
  const mm = Math.floor(seconds / 60).toString();
  const ss = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

export default function PlaylistDetailsRoutedPage() {
  const params = useParams<{ id: string }>();
  const id = (params?.id as string) || '';
  const { data, isLoading, error } = usePlaylist(id);
  const player = usePlayerContext();

  // Only extract data when it's actually available (not loading)
  const p: any = !isLoading && data ? (data as any)?.playlist : undefined;
  const items: any[] = !isLoading && data ? ((data as any)?.items || []) : [];

  // Only transform when we have data and it's not loading
  const transformed = !isLoading && p
    ? {
        id: p.id,
        title: p.name,
        name: p.name,
        duration: formatDuration(p.total_duration_seconds),
        totalDuration: formatDuration(p.total_duration_seconds),
        trackCount: p.track_count ?? items.length ?? 0,
        totalTracks: p.track_count ?? items.length ?? 0,
        tracks: items.map((it: any, idx: number) => {
          // Based on raw data structure: it.tracks (plural) contains the track object
          // Primary path: it.tracks (plural) - this is the actual structure
          // Fallback paths: it.track (singular) for backward compatibility
          const trackObj = it.tracks || it.track;
          const trackTitle = trackObj?.title || it.title || `Track ${idx + 1}`;
          const trackId = it.track_id || trackObj?.id || it.id || String(idx + 1);
          const trackDuration = trackObj?.duration_seconds || it.duration_seconds || it.track_duration_seconds;
          const r2Key = trackObj?.r2_key;
          
          return {
            id: trackId,
            title: trackTitle,
            duration: formatTrackDuration(trackDuration),
            energyLevel: trackObj?.meta?.energy || trackObj?.blueprint?.energy || it.energy || it.meta?.energy || 6,
            provider: (trackObj?.meta?.provider || trackObj?.provider || it.provider || 'Mureka') as 'Mureka' | 'MusicGen' | 'Suno',
            isLiked: false,
            isPlaying: idx === 0,
            // Store r2_key and original item reference for later use
            _r2Key: r2Key,
            _originalItem: it,
          };
        }),
      }
    : null;

  // Show loading state immediately if loading
  if (isLoading) {
    return (
      <div className="px-4 md:px-6 py-6">
        <div className="h-[480px] rounded-lg bg-card border border-border animate-pulse" />
      </div>
    );
  }

  // Show error state if there's an error
  if (error) {
    return (
      <div className="px-4 md:px-6 py-6">
        <div className="text-center text-sm text-muted-foreground">
          {String((error as any)?.message || error)}
        </div>
      </div>
    );
  }

  // Only render content when we have transformed data
  if (!transformed) {
    return (
      <div className="px-4 md:px-6 py-6">
        <div className="text-center text-sm text-muted-foreground">Playlist not found</div>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-6 py-6">
      <PlaylistViewer 
        playlist={transformed}
        currentTrack={player.currentTrack}
        isPlaying={player.isPlaying}
        onPlayPause={() => player.setIsPlaying(!player.isPlaying)}
        onPlayTrack={async (track: any) => {
            if (track) {
              // Find the transformed track to get the stored r2_key
              const transformedTrack = transformed.tracks.find((t: any) => t.id === track.id);
              const trackIndex = transformed.tracks.findIndex((t: any) => t.id === track.id);
              
              // Get r2_key from stored value or fallback to finding original item
              let r2Key = transformedTrack?._r2Key;
              if (!r2Key && transformedTrack?._originalItem) {
                const trackObj = transformedTrack._originalItem.tracks || transformedTrack._originalItem.track;
                r2Key = trackObj?.r2_key;
              }
              
              // If still no r2_key, find it in items array as fallback
              if (!r2Key) {
                const originalItem = items.find((it: any) => {
                  const trackId = it.track_id || (it.tracks || it.track)?.id || it.id;
                  return trackId === track.id;
                });
                const trackObj = originalItem?.tracks || originalItem?.track;
                r2Key = trackObj?.r2_key;
              }
              
              // Build queue from all playlist tracks with r2_key for on-demand signing
              const queue = transformed.tracks.map((t: any) => {
                // Try to get r2_key from stored value first
                let tR2Key = t._r2Key;
                if (!tR2Key && t._originalItem) {
                  const trackObj = t._originalItem.tracks || t._originalItem.track;
                  tR2Key = trackObj?.r2_key;
                }
                // Fallback to finding in items array
                if (!tR2Key) {
                  const origItem = items.find((it: any) => {
                    const tid = it.track_id || (it.tracks || it.track)?.id || it.id;
                    return tid === t.id;
                  });
                  const trackObj = origItem?.tracks || origItem?.track;
                  tR2Key = trackObj?.r2_key;
                }
                
                return {
                  id: t.id,
                  title: t.title,
                  artist: 'Lyra AI',
                  image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
                  r2Key: tR2Key,
                  playlistId: transformed.id,
                  playlistName: transformed.name,
                };
              });
              
              // Build the current track with r2_key (URL will be signed in playTrack)
              const currentTrack = {
                id: track.id,
                title: track.title,
                artist: track.artist || 'Lyra AI',
                image: track.image || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
                r2Key,
                playlistId: transformed.id,
                playlistName: transformed.name,
              };
              
              player.playTrack(currentTrack, queue, trackIndex >= 0 ? trackIndex : 0);
            } else {
              player.setIsPlaying(false);
            }
          }} 
        />
    </div>
  );
}

