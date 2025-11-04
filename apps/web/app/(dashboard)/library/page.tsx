"use client";

import React from "react";
import { SongLibrary } from "@lyra/ui/dist/components";
import { useTracks, usePlaylists } from "@lyra/sdk";
import { usePlayerContext } from "../layout";

export const dynamic = 'force-dynamic';

function formatDuration(totalSeconds?: number | null): string {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${rem.toString().padStart(2, '0')}`;
}

export default function LibraryPage() {
  const tracks = useTracks();
  const playlists = usePlaylists();
  const player = usePlayerContext();
  const [trackIdToPlaylist, setTrackIdToPlaylist] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    let cancelled = false;
    async function buildMap() {
      try {
        const items = tracks.data?.items || [];
        const anyMissing = items.some((t: any) => !t.playlist_name);
        if (!anyMissing) return;
        const res = await fetch('/api/playlists');
        const data = await res.json();
        if (!data?.items) return;
        const map: Record<string, string> = {};
        for (const p of data.items) {
          try {
            const pres = await fetch(`/api/playlists/${p.id}`);
            const pjson = await pres.json();
            const titems: any[] = pjson?.items || [];
            for (const item of titems) {
              const trackId = item.track_id || item.id;
              if (trackId) map[trackId] = p.name;
            }
          } catch {}
        }
        if (!cancelled) setTrackIdToPlaylist(map);
      } catch {}
    }
    buildMap();
    return () => { cancelled = true; };
  }, [tracks.data?.items]);

  const items = tracks.data?.items || [];
  const songs = items.map((t: any) => {
    const energy = t.energy || (t.meta?.energy ?? 5);
    const baseGenre = t.blueprint?.genre || t.genre || t.meta?.genre || 'Electronic';
    const deriveMood = (e: number, g: string) => (e >= 8 ? 'Energetic' : e >= 6 ? 'Upbeat' : e >= 4 ? 'Moderate' : e >= 2 ? 'Chill' : 'Calm');
    const baseMood = t.blueprint?.mood || t.mood || t.meta?.mood || deriveMood(energy, baseGenre);
    const createMultipleGenres = (genre: string) => {
      const m: Record<string, string[]> = { house:['House','Electronic'], electronic:['Electronic','Synth'], jazz:['Jazz','Smooth'], pop:['Pop','Contemporary'], rock:['Rock','Alternative'], 'hip-hop':['Hip-Hop','Urban'], ambient:['Ambient','Atmospheric'], classical:['Classical','Orchestral'], funk:['Funk','Groove'], reggae:['Reggae','Tropical'] };
      return m[genre?.toLowerCase?.() || ''] || [genre || 'Electronic','Music'];
    };
    const createMultipleMoods = (mood: string, e: number) => {
      const m: Record<string, string[]> = { energetic:['Energetic','Dynamic'], upbeat:['Upbeat','Positive'], moderate:['Moderate','Balanced'], chill:['Chill','Relaxed'], calm:['Calm','Peaceful'] };
      return m[mood?.toLowerCase?.() || ''] || [mood || 'Upbeat', e >= 6 ? 'Active' : 'Mellow'];
    };
    const genre = createMultipleGenres(baseGenre).join(', ');
    const mood = createMultipleMoods(baseMood, energy).join(', ');
    const providerRaw = t.provider_id || t.provider || t.meta?.provider || 'Mureka';
    const providerMap: Record<string,string> = { mureka:'Mureka', suno:'Suno', musicgen:'MusicGen', openai:'OpenAI', anthropic:'Anthropic', google:'Google AI', stability:'Stability AI' };
    const provider = (providerMap[providerRaw?.toLowerCase?.()] || providerRaw) as any;
    const playlistName = t.playlist_name || trackIdToPlaylist[t.id] || 'Unknown Playlist';
    return {
      id: t.id,
      title: t.title || 'Untitled Track',
      artist: t.artist || 'User',
      duration: formatDuration(t.duration_seconds),
      genre,
      mood,
      provider,
      playlistName,
      createdAt: t.created_at || new Date().toISOString(),
      plays: t.play_count || 0,
      liked: !!t.user_liked,
    };
  });

  return (
    <div className="px-4 md:px-6 py-6">
      {tracks.isLoading ? (
        <div className="text-sm text-muted-foreground">Loading tracks…</div>
      ) : (
        <SongLibrary
          songs={songs}
          currentTrack={player.currentTrack}
          isPlaying={player.isPlaying}
          onPlayTrack={async (track: any) => {
            if (track) {
              // Find the original track data to get r2_key
              const originalTrack: any = items.find((t: any) => t.id === track.id);
              const r2Key = originalTrack?.r2_key;
              const trackIndex = songs.findIndex((s: any) => s.id === track.id);
              
              // Build queue from all songs with r2_key for on-demand signing
              const queue = songs.map((s: any) => {
                const orig: any = items.find((t: any) => t.id === s.id);
                return {
                  id: s.id,
                  title: s.title,
                  artist: s.artist || 'Lyra AI',
                  image: s.image || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
                  r2Key: orig?.r2_key,
                  playlistId: s.playlistId,
                  playlistName: s.playlistName,
                };
              });
              
              // Build the current track with r2_key (URL will be signed in playTrack)
              const currentTrack = {
                id: track.id,
                title: track.title,
                artist: track.artist || 'Lyra AI',
                image: track.image || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
                r2Key,
                playlistId: track.playlistId,
                playlistName: track.playlistName,
              };
              
              player.playTrack(currentTrack, queue, trackIndex >= 0 ? trackIndex : 0);
            } else {
              player.setIsPlaying(false);
            }
          }}
        />
      )}
    </div>
  );
}

