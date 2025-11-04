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
  const { data, isLoading, error, isError, isFetching } = usePlaylist(id);
  const player = usePlayerContext();

  // Debug logging - comprehensive
  React.useEffect(() => {
    console.log('🔍 [Playlist Debug] ========== START DEBUG ==========');
    console.log('🔍 [Playlist Debug] Params:', params);
    console.log('🔍 [Playlist Debug] Playlist ID:', id);
    console.log('🔍 [Playlist Debug] ID is truthy?', !!id);
    console.log('🔍 [Playlist Debug] isLoading:', isLoading);
    console.log('🔍 [Playlist Debug] isFetching:', isFetching);
    console.log('🔍 [Playlist Debug] isError:', isError);
    console.log('🔍 [Playlist Debug] error:', error);
    console.log('🔍 [Playlist Debug] Raw data:', data);
    console.log('🔍 [Playlist Debug] Data type:', typeof data);
    console.log('🔍 [Playlist Debug] Data keys:', data ? Object.keys(data) : 'N/A');
    
    if (error) {
      console.error('❌ [Playlist Debug] Error object:', error);
      console.error('❌ [Playlist Debug] Error message:', (error as any)?.message);
      console.error('❌ [Playlist Debug] Error stack:', (error as any)?.stack);
    }
    
    if (data) {
      console.log('✅ [Playlist Debug] Data received:', data);
      const p: any = (data as any)?.playlist;
      const items: any[] = (data as any)?.items || [];
      console.log('🔍 [Playlist Debug] Playlist object:', p);
      console.log('🔍 [Playlist Debug] Items array:', items);
      console.log('🔍 [Playlist Debug] Items length:', items?.length);
      
      if (items && items.length > 0) {
        console.log('🔍 [Playlist Debug] First item structure:', items[0]);
        console.log('🔍 [Playlist Debug] First item keys:', Object.keys(items[0]));
        if (items[0].track) {
          console.log('🔍 [Playlist Debug] First item.track:', items[0].track);
          console.log('🔍 [Playlist Debug] First item.track keys:', Object.keys(items[0].track));
          console.log('🔍 [Playlist Debug] First item.track.title:', items[0].track?.title);
        }
      }
    } else {
      console.warn('⚠️ [Playlist Debug] Data is undefined/null');
    }
    console.log('🔍 [Playlist Debug] ========== END DEBUG ==========');
  }, [id, params, data, isLoading, error, isError, isFetching]);

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
          // Try multiple paths to get track title
          const trackTitle = it.track?.title || it.title || it.track_title || `Track ${idx + 1}`;
          const trackId = it.track_id || it.track?.id || it.id || String(idx + 1);
          const trackDuration = it.track?.duration_seconds || it.duration_seconds || it.track_duration_seconds;
          
          console.log(`🔍 [Track ${idx}] Raw item:`, it);
          console.log(`🔍 [Track ${idx}] Extracted title:`, trackTitle);
          console.log(`🔍 [Track ${idx}] Extracted ID:`, trackId);
          console.log(`🔍 [Track ${idx}] Extracted duration:`, trackDuration);
          
          return {
            id: trackId,
            title: trackTitle,
            duration: formatTrackDuration(trackDuration),
            energyLevel: it.track?.meta?.energy || it.energy || it.meta?.energy || 6,
            provider: (it.track?.provider || it.provider || it.track?.meta?.provider || 'Mureka') as 'Mureka' | 'MusicGen' | 'Suno',
            isLiked: false,
            isPlaying: idx === 0,
          };
        }),
      }
    : null;

  // Debug transformed data
  React.useEffect(() => {
    if (transformed) {
      console.log('🔍 [Playlist Debug] Transformed playlist:', transformed);
      console.log('🔍 [Playlist Debug] Transformed tracks:', transformed.tracks);
      if (transformed.tracks.length > 0) {
        console.log('🔍 [Playlist Debug] First transformed track:', transformed.tracks[0]);
      }
    }
  }, [transformed]);

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
      {/* Debug Info Panel */}
      <div className="mb-4 p-4 bg-muted rounded-lg text-xs font-mono">
        <div className="font-bold mb-2">🔍 Debug Info:</div>
        <div>ID: {id || '(empty)'}</div>
        <div>isLoading: {String(isLoading)}</div>
        <div>isError: {String(isError)}</div>
        <div>hasData: {String(!!data)}</div>
        <div>hasPlaylist: {String(!!p)}</div>
        <div>itemsCount: {items?.length || 0}</div>
        <div>hasTransformed: {String(!!transformed)}</div>
        {error && (
          <div className="mt-2 text-red-500">
            Error: {String((error as any)?.message || error)}
          </div>
        )}
        {data && (
          <details className="mt-2">
            <summary className="cursor-pointer">View Raw Data</summary>
            <pre className="mt-2 overflow-auto max-h-40">
              {JSON.stringify(data, null, 2)}
            </pre>
          </details>
        )}
      </div>

      <PlaylistViewer 
        playlist={transformed}
        onPlayTrack={async (track: any) => {
            if (track) {
              // Find the original track data to get r2_key
              const trackIndex = transformed.tracks.findIndex((t: any) => t.id === track.id);
              const originalItem = items.find((it: any) => {
                const trackId = it.track_id || it.id || it.track?.id;
                return trackId === track.id;
              });
              const r2Key = originalItem?.track?.r2_key;
              
              // Build queue from all playlist tracks with r2_key for on-demand signing
              const queue = transformed.tracks.map((t: any, idx: number) => {
                const origItem = items.find((it: any) => {
                  const tid = it.track_id || it.id || it.track?.id;
                  return tid === t.id;
                });
                return {
                  id: t.id,
                  title: t.title,
                  artist: 'Lyra AI',
                  image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
                  r2Key: origItem?.track?.r2_key,
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

