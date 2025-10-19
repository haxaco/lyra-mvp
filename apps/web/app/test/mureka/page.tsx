"use client";

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { SongBuilder, SongLibrary } from "@lyra/ui/dist/components";
import { MusicPlayerResponsive } from "@lyra/ui/dist/components";
import { Music, TestTube, Clock, Zap, Trash2 } from "lucide-react";
import { LyraJobs } from "@lyra/sdk";
import ComposerTest from "./ComposerTest";

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
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);

  // Music Player state
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Test state
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [testJobId, setTestJobId] = useState<string | null>(null);
  const jobsClient = useRef(new LyraJobs());

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

    // Extract metadata, prioritize blueprint data
    const meta = dbItem.meta || {};
    const blueprint = (dbItem as any).blueprint || {};
    
    // Use blueprint data first, then fallback to meta, then defaults
    const baseGenre = blueprint.genre || meta.genre || 'Electronic';
    
    // Derive mood from energy level and genre since TrackBlueprint doesn't have mood
    const deriveMood = (energy: number, genre: string) => {
      if (energy >= 8) return 'Energetic';
      if (energy >= 6) return 'Upbeat';
      if (energy >= 4) return 'Moderate';
      if (energy >= 2) return 'Chill';
      return 'Calm';
    };
    
    const energy = blueprint.energy || meta.energy || 5;
    const baseMood = blueprint.mood || meta.mood || deriveMood(energy, baseGenre);
    
    // Create multiple genres and moods for display
    const createMultipleGenres = (genre: string) => {
      const genreMap: Record<string, string[]> = {
        'house': ['House', 'Electronic'],
        'electronic': ['Electronic', 'Synth'],
        'jazz': ['Jazz', 'Smooth'],
        'pop': ['Pop', 'Contemporary'],
        'rock': ['Rock', 'Alternative'],
        'hip-hop': ['Hip-Hop', 'Urban'],
        'ambient': ['Ambient', 'Atmospheric'],
        'classical': ['Classical', 'Orchestral'],
        'funk': ['Funk', 'Groove'],
        'reggae': ['Reggae', 'Tropical']
      };
      return genreMap[genre.toLowerCase()] || [genre, 'Music'];
    };
    
    const createMultipleMoods = (mood: string, energy: number) => {
      const moodMap: Record<string, string[]> = {
        'energetic': ['Energetic', 'Dynamic'],
        'upbeat': ['Upbeat', 'Positive'],
        'moderate': ['Moderate', 'Balanced'],
        'chill': ['Chill', 'Relaxed'],
        'calm': ['Calm', 'Peaceful']
      };
      return moodMap[mood.toLowerCase()] || [mood, energy >= 6 ? 'Active' : 'Mellow'];
    };
    
    const genre = createMultipleGenres(baseGenre).join(', ');
    const mood = createMultipleMoods(baseMood, energy).join(', ');
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
          console.log('[Concurrency Test] Setting organizationId:', userOrgId);
          setOrganizationId(userOrgId);
        } else {
          console.log('[Concurrency Test] No memberships found for user:', user.id);
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

    // Find the corresponding DB item in current page data
    const dbItem = dbItems.find(item => item.id === track.id);
    if (dbItem) {
      // Use the track data directly from current page - it already has fresh URLs
      const musicPlayerTrack = {
        id: dbItem.id,
        title: dbItem.title || 'Untitled Track',
        artist: 'User',
        album: 'Generated Tracks',
        coverArt: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
        duration: dbItem.duration_seconds || 180,
        audioUrl: dbItem.mp3?.url || null,
      };
      setCurrentTrack(musicPlayerTrack);
      console.log('Playing track:', musicPlayerTrack);
    } else {
      console.error('Track not found in current page data:', track.id);
    }
  };




  const refreshFromDb = useCallback(async (page: number = 1) => {
    const orgIdToUse = organizationId || process.env.NEXT_PUBLIC_TEST_ORG_ID;
    if (!orgIdToUse) {
      console.error('[mureka] no organization ID available for tracks/list');
      setError('No organization ID set. Please enter one in the form or set TEST_ORG_ID env var.');
      return;
    }
    const url = `/api/tracks/list?organizationId=${encodeURIComponent(orgIdToUse)}&page=${page}&limit=50&_t=${Date.now()}`;
    const res = await fetch(url, {
      cache: 'no-store', // Prevent caching
      headers: {
        'Cache-Control': 'no-cache',
      }
    });
    const json = await res.json();
    if (json.ok) {
      setDbItems(json.items || []);
      setPagination(json.pagination || null);
      setCurrentPage(page);
      console.log('[mureka] refreshed tracks from DB with fresh URLs', { page, total: json.pagination?.total });
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

  // Test function for concurrency functionality
  const runConcurrencyTest = async () => {
    console.log('[Concurrency Test] Button clicked!', { isTestRunning, organizationId });
    if (isTestRunning) return;
    
    // Use the organizationId from the logs as fallback
    const effectiveOrgId = organizationId || 'fd3fcfe3-ce7d-40e4-bf7a-53604f5a7c79';
    console.log('[Concurrency Test] Using organizationId:', effectiveOrgId);
    
    setIsTestRunning(true);
    setTestJobId(null);
    setError('');

    try {
      console.log('[Concurrency Test] Starting test with 3 different songs...');
      
      // Create a playlist with 3 distinct songs to test sequential execution
      const result = await jobsClient.current.createPlaylistJob({
        lyrics: "[Instrumental only]",
        model: "auto",
        n: 3, // 3 tracks
        concurrency: 1, // Sequential execution (default)
        prompt: "Create a diverse 3-track playlist with distinct musical styles: Track 1 - Upbeat electronic dance music with synthesizers and driving bass, Track 2 - Smooth jazz with saxophone and piano, Track 3 - Acoustic folk with guitar and harmonica",
        stream: false,
      });

      setTestJobId(result.job_id);
      console.log('[Concurrency Test] Job created:', result.job_id, {
        concurrency_limit: result.concurrency_limit,
        message: result.message
      });

      // Refresh tracks after a short delay to see the job in progress
      setTimeout(() => {
        refreshFromDb();
      }, 2000);

    } catch (err: any) {
      console.error('[Concurrency Test] Error:', err);
      setError(`Test failed: ${err.message}`);
    } finally {
      setIsTestRunning(false);
    }
  };


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

      {/* Concurrency Test Section */}
      <div className="w-full max-w-3xl">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <TestTube className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
              Concurrency Test
            </h3>
          </div>
          
          <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
            Test the new sequential execution feature by creating 3 distinct songs in a single playlist. 
            This will verify that tracks are generated one at a time (concurrency=1).
          </p>
          
          <div className="flex items-center gap-4">
            <button
              onClick={runConcurrencyTest}
              disabled={isTestRunning}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-accent)] disabled:bg-gray-400 disabled:cursor-not-allowed text-[var(--color-primary-foreground)] rounded-lg transition-colors font-medium"
            >
              {isTestRunning ? (
                <>
                  <Clock className="h-4 w-4 animate-spin" />
                  Running Test...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  Run Concurrency Test
                </>
              )}
            </button>
            
            <button
              onClick={async () => {
                try {
                  const response = await fetch('/api/cleanup-jobs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ organizationId: 'fd3fcfe3-ce7d-40e4-bf7a-53604f5a7c79' })
                  });
                  const result = await response.json();
                  console.log('Cleanup result:', result);
                  alert(`Jobs cleaned up! Status counts: ${JSON.stringify(result.statusCounts)}`);
                } catch (error) {
                  console.error('Cleanup failed:', error);
                  alert('Cleanup failed');
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
            >
              <Trash2 className="h-4 w-4" />
              Cleanup Stuck Jobs
            </button>
            
            {testJobId && (
              <div className="text-sm text-blue-600 dark:text-blue-400">
                Job ID: <code className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">{testJobId.substring(0, 8)}...</code>
              </div>
            )}
          </div>
          
          {error && (
            <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}
          
          <div className="mt-4 text-xs text-blue-600 dark:text-blue-400">
            <strong>What to expect:</strong> You should see 3 tracks appear one by one in the "Generated Tracks" section below, 
            demonstrating sequential execution. Check the browser console for detailed logging.
          </div>
        </div>
      </div>

      {/* Generated Tracks */}
      <div className="w-full max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Generated Tracks</h2>
          {pagination && (
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * 50) + 1}-{Math.min(currentPage * 50, pagination.total)} of {pagination.total} tracks
            </div>
          )}
        </div>
        {dbItems.length > 0 ? (
          <>
            <SongLibrary 
              songs={dbItems.map(transformDbItemForSongLibrary)}
              onPlayTrack={handleTrackPlay}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
            />
            
            {/* Pagination Controls */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6">
                <button
                  onClick={() => refreshFromDb(currentPage - 1)}
                  disabled={!pagination.hasPrevPage}
                  className="px-3 py-2 text-sm border border-border rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => refreshFromDb(pageNum)}
                        className={`px-3 py-2 text-sm border rounded-md ${
                          pageNum === currentPage
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'border-border hover:bg-muted'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => refreshFromDb(currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                  className="px-3 py-2 text-sm border border-border rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
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

      {/* AI Composer Test */}
      <div className="mt-12">
        <ComposerTest />
      </div>
    </div>
  );
}
