"use client";

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { SongBuilder, SongLibrary } from "@lyra/ui/dist/components";
import { MusicPlayerResponsive } from "@lyra/ui/dist/components";
import { Music } from "lucide-react";

export const dynamic = 'force-dynamic';

type Asset = { key: string; url: string };
type GeneratedItem = {
  index: number;
  id: string | null;
  durationMs: number | null;
  r2Mp3: Asset | null;
  r2Flac: Asset | null;
  db?: { id: string };
};

type DbItem = {
  id: string;
  duration_seconds: number | null;
  created_at: string;
  title: string | null;
  meta: any;
  mp3: Asset | null;
  flac: Asset | null;
};

const MODELS = ["auto", "mureka-6", "mureka-7.5", "mureka-o1"] as const;
const DEFAULTS = {
  model: "auto",
  n: 2,
  prompt: "",
  lyrics: "[Instrumental only]",
  reference_id: "",
  vocal_id: "",
  melody_id: "",
  stream: false,
};

export default function MurekaTestPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  const [user, setUser] = useState<any>(null);
  const [organizationId, setOrganizationId] = useState<string>("");
  const [dbItems, setDbItems] = useState<DbItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState<string>("");
  const [error, setError] = useState<string>("");

  // Music Player state
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Transform DB items to SongLibrary format
  const transformDbItemForSongLibrary = (dbItem: DbItem) => {
    // Format duration from milliseconds to MM:SS format
    const formatDuration = (milliseconds: number | null) => {
      if (!milliseconds) return '0:00';
      const totalSeconds = Math.floor(milliseconds / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const remainingSeconds = totalSeconds % 60;
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    // Extract metadata
    const meta = dbItem.meta || {};
    const genre = meta.genre || 'Electronic';
    const mood = meta.mood || 'Upbeat';
    const provider = meta.provider || 'mureka';

    return {
      id: dbItem.id,
      title: dbItem.title || 'Untitled Track',
      artist: meta.artist || 'User',
      duration: formatDuration(dbItem.duration_seconds),
      genre: genre,
      mood: mood,
      provider: provider as 'Mureka' | 'OpenAI' | 'Anthropic' | 'Google AI' | 'Stability AI' | 'Suno' | 'MusicGen',
      playlistName: 'Generated Tracks',
      createdAt: dbItem.created_at,
      plays: meta.play_count || 0,
      liked: meta.user_liked || false
    };
  };

  // Load user and organization
  useEffect(() => {
    async function getUserAndOrg() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        const { data: memberships } = await supabase
          .from('user_memberships')
          .select('organization_id')
          .eq('user_id', user.id)
          .limit(1);
        
        if (memberships && memberships.length > 0) {
          const userOrgId = memberships[0].organization_id;
          setOrganizationId(userOrgId);
        }
      }
    }
    
    getUserAndOrg();
  }, [supabase]);
  


  // Transform DB item to MusicPlayer format
  const transformDbItemForMusicPlayer = (dbItem: DbItem) => {
    return {
      id: dbItem.id,
      title: dbItem.title || 'Untitled Track',
      artist: 'User', // Default artist
      album: 'Generated Tracks',
      coverArt: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop', // Default cover
      duration: dbItem.duration_seconds || 180, // Default 3 minutes
      audioUrl: dbItem.mp3?.url || null, // Audio URL for playback
    };
  };

  // Handle track play from SongLibrary
  const handleTrackPlay = async (track: any) => {
    // If track is null, it means we should pause
    if (!track) {
      setCurrentTrack(null);
      setIsPlaying(false);
      return;
    }

    // Find the corresponding DB item
    const dbItem = dbItems.find(item => item.id === track.id);
    if (dbItem) {
      try {
        // Generate fresh signed URLs for audio playback
        const response = await fetch(`/api/tracks/list?organizationId=${organizationId}&_t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          }
        });
        const data = await response.json();
        
        if (data.ok && data.items) {
          // Find the updated track with fresh URLs
          const updatedTrack = data.items.find((t: any) => t.id === track.id);
          if (updatedTrack) {
            const musicPlayerTrack = {
              id: updatedTrack.id,
              title: updatedTrack.title || 'Untitled Track',
              artist: 'User',
              album: 'Generated Tracks',
              coverArt: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
              duration: updatedTrack.duration_seconds || 180,
              audioUrl: updatedTrack.mp3?.url || null,
            };
            setCurrentTrack(musicPlayerTrack);
            console.log('Playing track with fresh URL:', musicPlayerTrack);
          }
        }
      } catch (error) {
        console.error('Error refreshing track URL:', error);
        // Fallback to original track data
        const musicPlayerTrack = transformDbItemForMusicPlayer(dbItem);
        setCurrentTrack(musicPlayerTrack);
        console.log('Playing track with original URL:', musicPlayerTrack);
      }
    }
  };




  const refreshFromDb = useCallback(async () => {
    const orgIdToUse = organizationId || process.env.NEXT_PUBLIC_TEST_ORG_ID;
    if (!orgIdToUse) {
      console.error('[mureka] no organization ID available for tracks/list');
      setError('No organization ID set. Please enter one in the form or set TEST_ORG_ID env var.');
      return;
    }
    const url = `/api/tracks/list?organizationId=${encodeURIComponent(orgIdToUse)}&_t=${Date.now()}`;
    const res = await fetch(url, {
      cache: 'no-store', // Prevent caching
      headers: {
        'Cache-Control': 'no-cache',
      }
    });
    const json = await res.json();
    if (json.ok) {
      setDbItems(json.items || []);
      console.log('[mureka] refreshed tracks from DB with fresh URLs');
    } else {
      console.error('[mureka] error fetching tracks:', json.error);
      setError(json.error || 'Failed to fetch tracks');
    }
  }, [organizationId]);

  // Auto-refresh tracks when organizationId becomes available
  useEffect(() => {
    if (organizationId) {
      console.log(`[mureka] organizationId set to ${organizationId}, refreshing tracks`);
      refreshFromDb();
    }
  }, [organizationId, refreshFromDb]);

  // Handle generation completion
  const handleGenerationComplete = useCallback(async (generatedTracks: any[]) => {
    console.log('[mureka] handleGenerationComplete called with:', {
      trackCount: generatedTracks?.length,
      jobId: generatedTracks?.[0]?.id,
      status: generatedTracks?.[0]?.status
    });
    console.log('Generation completed, refreshing tracks from DB');
    await refreshFromDb();
  }, [refreshFromDb]);

  async function signOut() {
    await supabase.auth.signOut();
    router.push('/login');
  }


  return (
    <div className="min-h-[90vh] flex flex-col items-center gap-6 p-6">
      {/* Header with user info */}
      <div className="w-full max-w-3xl flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Mureka → R2 → DB Test</h1>
        <div className="flex items-center gap-3">
          {user && (
            <>
              <span className="text-sm opacity-70">{user.email}</span>
              <button
                onClick={signOut}
                className="px-3 py-1.5 text-sm rounded border border-white/20 hover:bg-white/10"
              >
                Sign out
              </button>
            </>
          )}
        </div>
      </div>

      {/* SongBuilder Component */}
      <SongBuilder onGenerationComplete={handleGenerationComplete} />

      {/* Generated Tracks */}
      <div className="w-full max-w-6xl">
        <h2 className="text-2xl font-semibold mb-6">Generated Tracks</h2>
        {dbItems.length > 0 ? (
          <SongLibrary 
            songs={dbItems.map(transformDbItemForSongLibrary)}
            onPlayTrack={handleTrackPlay}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
          />
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No tracks generated yet. Use the Song Builder above to create some music!</p>
          </div>
        )}
      </div>

      {/* Music Player */}
      {currentTrack && (
        <div className="w-full max-w-6xl mt-8">
          {/* Debug info */}
          <div className="mb-4 p-4 bg-muted rounded-lg text-sm">
            <h3 className="font-semibold mb-2">Currently Playing:</h3>
            <p><strong>Title:</strong> {currentTrack.title}</p>
            <p><strong>Artist:</strong> {currentTrack.artist}</p>
            <p><strong>Audio URL:</strong> {currentTrack.audioUrl ? 'Available' : 'Not available'}</p>
            <p><strong>Status:</strong> Ready to play</p>
            <p><strong>Duration:</strong> {currentTrack.duration}s</p>
          </div>
          
          {/* Fixed bottom music player wrapper - same as DashboardLayout */}
          <div className="fixed bottom-0 right-0 z-40 h-12 md:h-[88px] transition-all duration-300 ease-in-out left-0">
            {/* Elevation shadow for depth */}
            <div className="absolute inset-0 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_12px_rgba(0,0,0,0.3)]" />
            
            {/* Gradient background with slight blur */}
            <div className="absolute inset-0 bg-gradient-to-r from-blush via-secondary to-warm-nude backdrop-blur-sm" />
            
            {/* Player content */}
            <div className="relative h-full">
              <MusicPlayerResponsive
                currentTrack={currentTrack}
                onGoToPlaylist={(playlist: any) => {
                  console.log('Go to playlist:', playlist);
                }}
                onPlayStateChange={(playing) => {
                  setIsPlaying(playing);
                }}
              />
            </div>
          </div>

        </div>
      )}

      {/* Raw log */}
      <pre className="w-full max-w-3xl text-xs bg-black/40 p-4 rounded-lg overflow-auto">
        {log}
      </pre>
    </div>
  );
}
