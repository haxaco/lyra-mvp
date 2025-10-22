"use client";

import { 
  useWhoAmI,
  useTracks, 
  usePlaylists,
  usePlaylist,
  useJobs,
  useJobQuery,
  useCreateTrack,
  useDeleteTrack,
  useCreatePlaylist,
  useDeletePlaylist,
  useCreateJob,
} from "@lyra/sdk";
import { Button, Card, CardHeader, CardTitle, CardContent, Collapsible, CollapsibleContent, CollapsibleTrigger } from "@lyra/ui";
import dynamic from 'next/dynamic';

// Dynamically import PlaylistComposer with no SSR to prevent hydration issues
const PlaylistComposer = dynamic(
  () => import('@lyra/ui').then(mod => ({ default: mod.PlaylistComposer })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground text-sm">Loading Playlist Composer...</p>
        </div>
      </div>
    )
  }
);
import { PlaylistCard, SongLibrary } from "@lyra/ui/dist/components";
import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

export default function SDKTestPage() {
  const [trackTitle, setTrackTitle] = useState("");
  const [playlistName, setPlaylistName] = useState("");
  const [jobPrompt, setJobPrompt] = useState("Energetic electronic music");
  const [isRawDataOpen, setIsRawDataOpen] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [playlistMap, setPlaylistMap] = useState<Record<string, string>>({});

  // Transform SDK track data to SongLibrary format
  const transformTrackForSongLibrary = (sdkTrack: any, playlistMap: Record<string, string> = {}) => {
    // Format duration from seconds to MM:SS format
    const formatDuration = (seconds: number) => {
      if (!seconds) return '0:00';
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    // Extract metadata or use database fields, prioritize blueprint data
    const meta = sdkTrack.meta || {};
    const blueprint = sdkTrack.blueprint || {};
    
    // Use blueprint data first, then fallback to database fields, then meta, then defaults
    const baseGenre = blueprint.genre || sdkTrack.genre || meta.genre || 'Electronic';
    
    // Derive mood from energy level and genre since TrackBlueprint doesn't have mood
    const deriveMood = (energy: number, genre: string) => {
      if (energy >= 8) return 'Energetic';
      if (energy >= 6) return 'Upbeat';
      if (energy >= 4) return 'Moderate';
      if (energy >= 2) return 'Chill';
      return 'Calm';
    };
    
    const energy = blueprint.energy || sdkTrack.energy || meta.energy || 5;
    const baseMood = blueprint.mood || sdkTrack.mood || meta.mood || deriveMood(energy, baseGenre);
    
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
    const provider = sdkTrack.provider_id || meta.provider || 'Mureka';
    const artist = sdkTrack.artist || 'User'; // Fallback to 'User' if no artist set

    // Map provider names to SongLibrary format
    const providerMap: Record<string, string> = {
      'mureka': 'Mureka',
      'suno': 'Suno', 
      'musicgen': 'MusicGen',
      'openai': 'OpenAI',
      'anthropic': 'Anthropic',
      'google': 'Google AI',
      'stability': 'Stability AI'
    };
    const mappedProvider = providerMap[provider.toLowerCase()] || 'Mureka';

    // Get playlist name from map or use default
    const playlistName = playlistMap[sdkTrack.id] || 'Unknown Playlist';

    return {
      id: sdkTrack.id,
      title: sdkTrack.title || 'Untitled Track',
      artist: artist,
      duration: formatDuration(sdkTrack.duration_seconds || 0),
      genre: genre,
      mood: mood,
      provider: mappedProvider as 'OpenAI' | 'Anthropic' | 'Google AI' | 'Stability AI' | 'Mureka' | 'Suno' | 'MusicGen',
      playlistName: playlistName,
      createdAt: sdkTrack.created_at,
      plays: sdkTrack.play_count || 0, // Use real play count from database
      liked: sdkTrack.user_liked || false // Use real liked status from database
    };
  };

  // Delete playlist handler
  const handleDeletePlaylist = async (playlistId: string, playlistName: string) => {
    if (confirm(`Are you sure you want to delete the playlist "${playlistName}"? This action cannot be undone.`)) {
      try {
        await deletePlaylist.mutateAsync(playlistId);
        alert(`Playlist "${playlistName}" deleted successfully!`);
      } catch (error) {
        alert(`Failed to delete playlist: ${error}`);
      }
    }
  };

  // Transform SDK playlist data to PlaylistCard format
  const transformPlaylistForCard = (sdkPlaylist: any) => {
    // Format duration from seconds to human readable
    const formatDuration = (seconds: number) => {
      if (!seconds || seconds === 0) return '0m';
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${minutes}m`;
    };

    // Use real data from database columns
    const trackCount = (sdkPlaylist as any).track_count || 0;
    const durationSeconds = (sdkPlaylist as any).total_duration_seconds || 0;
    const duration = formatDuration(durationSeconds);
    
    // Dynamic tags based on actual data
    const tags = trackCount > 0 
      ? ['AI Generated', 'Custom', 'Background Music'] 
      : ['AI Generated', 'Empty Playlist'];
    
    return {
      id: sdkPlaylist.id,
      title: sdkPlaylist.name,
      description: `AI-generated playlist created on ${new Date(sdkPlaylist.created_at).toLocaleDateString()}`,
      duration: duration,
      trackCount: trackCount,
      tags: tags,
      imageUrl: undefined, // No image URL from SDK
      onPlay: () => {
        console.log("Playing playlist:", sdkPlaylist);
        alert(`Playing playlist: ${sdkPlaylist.name} (${trackCount} tracks)`);
      },
      onViewDetails: () => {
        console.log("Viewing playlist details:", sdkPlaylist);
        setSelectedPlaylistId(sdkPlaylist.id);
      },
      onDelete: () => {
        handleDeletePlaylist(sdkPlaylist.id, sdkPlaylist.name);
      }
    };
  };

  // Query hooks
  const whoami = useWhoAmI();
  const tracks = useTracks();
  const playlists = usePlaylists();
  const selectedPlaylist = usePlaylist(selectedPlaylistId || "");
  const selectedJob = useJobQuery(selectedPlaylist.data?.playlist?.job_id || "");
  const jobs = useJobs();
  
  // Mutation hooks
  const deletePlaylist = useDeletePlaylist();


  // Mutation hooks
  const createTrack = useCreateTrack();
  const deleteTrack = useDeleteTrack();
  const createPlaylist = useCreatePlaylist();
  const createJob = useCreateJob();

  // Load playlist mapping when tracks change
  React.useEffect(() => {
    const loadPlaylistMapping = async () => {
      if (!tracks.data?.items || tracks.data.items.length === 0) return;
      
      try {
        const response = await fetch('/api/playlists');
        const result = await response.json();
        if (!result.ok) return;
        
        const newPlaylistMap: Record<string, string> = {};
        
        // For each playlist, get its tracks and map track IDs to playlist names
        for (const playlist of result.items || []) {
          try {
            const playlistResponse = await fetch(`/api/playlists/${playlist.id}`);
            const playlistResult = await playlistResponse.json();
            if (playlistResult.ok && playlistResult.items) {
              for (const item of playlistResult.items) {
                newPlaylistMap[item.track_id] = playlist.name;
              }
            }
          } catch (error) {
            console.warn(`Failed to get tracks for playlist ${playlist.id}:`, error);
          }
        }
        
        setPlaylistMap(newPlaylistMap);
      } catch (error) {
        console.warn('Failed to get playlist names:', error);
      }
    };

    loadPlaylistMapping();
  }, [tracks.data?.items]);

  // Loading state
  if (whoami.isLoading || tracks.isLoading || playlists.isLoading) {
    return <p className="p-6 text-muted-foreground">Loading...</p>;
  }

  // Error state
  if (whoami.error) {
    return (
      <div className="p-6">
        <p className="text-red-500 font-semibold mb-2">Error: {(whoami.error as Error).message}</p>
        <p className="text-sm text-muted-foreground">
          Make sure you're authenticated and have proper environment variables set.
        </p>
      </div>
    );
  }

  const handleCreateTrack = () => {
    if (!trackTitle.trim()) {
      alert("Please enter a track title");
      return;
    }
    createTrack.mutate({
      title: trackTitle,
      duration_seconds: 180,
      genre: "Electronic",
      energy: 0.8,
    }, {
      onSuccess: () => {
        setTrackTitle("");
        alert("Track created successfully!");
      },
      onError: (error) => {
        alert(`Error: ${error.message}`);
      }
    });
  };

  const handleDeleteTrack = (trackId: string) => {
    if (!confirm("Are you sure you want to delete this track?")) return;
    deleteTrack.mutate(trackId, {
      onSuccess: () => {
        alert("Track deleted!");
      },
      onError: (error) => {
        alert(`Error: ${error.message}`);
      }
    });
  };

  const handleCreatePlaylist = () => {
    if (!playlistName.trim()) {
      alert("Please enter a playlist name");
      return;
    }
    const trackIds = tracks.data?.items.slice(0, 3).map(t => t.id) || [];
    createPlaylist.mutate({
      name: playlistName,
      trackIds,
    }, {
      onSuccess: () => {
        setPlaylistName("");
        alert("Playlist created with first 3 tracks!");
      },
      onError: (error) => {
        alert(`Error: ${error.message}`);
      }
    });
  };

  const handleCreateJob = () => {
    if (!jobPrompt.trim()) {
      alert("Please enter a prompt");
      return;
    }
    if (!confirm(`This will generate 2 tracks with Mureka. Continue?`)) return;
    
    createJob.mutate({
      prompt: jobPrompt,
      n: 2,
      lyrics: "[Instrumental only]",
      model: "auto",
    }, {
      onSuccess: (data) => {
        alert(`Job ${data.jobId} created! Generated ${data.items.length} tracks in ${(data.elapsedMs / 1000).toFixed(1)}s`);
      },
      onError: (error) => {
        alert(`Error: ${error.message}`);
      }
    });
  };

  return (
    <div className="min-h-screen bg-background p-6 space-y-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">SDK Test Page</h1>
          <p className="text-muted-foreground">
            Testing @lyra/sdk hooks with React Query
          </p>
        </div>

        {/* PlaylistComposer Component Test */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>🎵</span>
              PlaylistComposer Component
            </CardTitle>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Test the AI-powered PlaylistComposer with real-time generation and animations.
              </p>
              <PlaylistComposer 
                onPlaylistGenerated={(playlist) => {
                  console.log('Generated playlist:', playlist);
                  alert(`Playlist generated: ${playlist.name || 'Untitled Playlist'}`);
                }}
                orgId={whoami.data?.organization_id || undefined}
                userId={whoami.data?.user_id || undefined}
                baseUrl={process.env.NEXT_PUBLIC_APP_URL || ""}
              />
            </CardContent>
          </CardHeader>
        </Card>

            {/* JSON Debug Sections */}
            <Collapsible open={isRawDataOpen} onOpenChange={setIsRawDataOpen}>
              <CollapsibleTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full justify-between mb-4"
                >
                  <h2 className="text-2xl font-semibold text-foreground">Raw Data (JSON)</h2>
                  {isRawDataOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Who Am I</h3>
                    <pre className="bg-card border border-border rounded-lg p-4 overflow-x-auto text-sm">
                      {JSON.stringify(whoami.data, null, 2)}
                    </pre>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-2">Tracks</h3>
                    <pre className="bg-card border border-border rounded-lg p-4 overflow-x-auto text-sm max-h-64 overflow-y-auto">
                      {JSON.stringify(tracks.data, null, 2)}
                    </pre>
                    <p className="text-sm text-muted-foreground mt-2">
                      {tracks.data?.items?.length || 0} tracks found
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-2">Playlists</h3>
                    <pre className="bg-card border border-border rounded-lg p-4 overflow-x-auto text-sm max-h-64 overflow-y-auto">
                      {JSON.stringify(playlists.data, null, 2)}
                    </pre>
                    <p className="text-sm text-muted-foreground mt-2">
                      {playlists.data?.items?.length || 0} playlists found
                    </p>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

        {/* Interactive UI Sections */}
        <section className="space-y-6 mt-12">
          <h2 className="text-2xl font-semibold text-foreground">Interactive Tests</h2>

          {/* User Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>👤 Current User (useWhoAmI)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>User ID:</strong> {whoami.data?.user_id}</p>
                <p><strong>Email:</strong> {whoami.data?.email || "N/A"}</p>
                <p><strong>Organization:</strong> {whoami.data?.organization_id || "None"}</p>
                <p><strong>Role:</strong> {whoami.data?.role || "None"}</p>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Tracks Management with SongLibrary */}
          <Card>
            <CardHeader>
              <CardTitle>🎵 Tracks (useTracks + SongLibrary Component)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Quick Actions */}
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Quick create track..."
                  value={trackTitle}
                  onChange={(e) => setTrackTitle(e.target.value)}
                  className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  disabled={createTrack.isPending}
                />
                <Button 
                  onClick={handleCreateTrack}
                  disabled={createTrack.isPending}
                >
                  {createTrack.isPending ? "Creating..." : "Create"}
                </Button>
                <Button variant="outline" onClick={() => tracks.refetch()}>
                  Refresh
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Quick create above, or use the full SongLibrary interface below
              </p>
              <div className="text-xs text-muted-foreground mb-2">
                Debug: {tracks.data?.items?.length || 0} tracks loaded
              </div>

              {/* SongLibrary Component with Real Data */}
              {tracks.data?.items ? (
                <div className="border border-border rounded-lg overflow-hidden">
                  <SongLibrary
                    songs={tracks.data.items.map(track => {
                      try {
                        return transformTrackForSongLibrary(track, playlistMap);
                      } catch (error) {
                        console.error('Error transforming track:', track, error);
                        return {
                          id: track.id,
                          title: track.title || 'Unknown Track',
                          artist: (track as any).artist || 'User',
                          duration: '0:00',
                          genre: 'Electronic',
                          mood: 'Upbeat',
                          provider: 'Mureka' as 'OpenAI' | 'Anthropic' | 'Google AI' | 'Stability AI' | 'Mureka' | 'Suno' | 'MusicGen',
                          playlistName: 'Unknown Playlist',
                          createdAt: track.created_at || new Date().toISOString(),
                          plays: 0,
                          liked: false
                        };
                      }
                    })}
                    onPlayTrack={(track) => {
                      console.log("Playing track:", track);
                      alert(`Playing: ${track.title} by ${track.artist} from ${track.playlistName}`);
                    }}
                  />
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    {tracks.isLoading ? "Loading tracks..." : "No tracks found"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Playlists Management */}
          <Card>
            <CardHeader>
              <CardTitle>📋 Playlists (usePlaylists, useCreatePlaylist)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Create Playlist Form */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Playlist name..."
                  value={playlistName}
                  onChange={(e) => setPlaylistName(e.target.value)}
                  className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  disabled={createPlaylist.isPending}
                />
                <Button 
                  onClick={handleCreatePlaylist}
                  disabled={createPlaylist.isPending}
                >
                  {createPlaylist.isPending ? "Creating..." : "Create Playlist"}
                </Button>
                <Button variant="outline" onClick={() => playlists.refetch()}>
                  Refresh
                </Button>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={async () => {
              if (confirm('This will update existing playlists with config and job data. Continue?')) {
                try {
                  const response = await fetch('/api/admin/update-playlist-configs', { method: 'POST' });
                  const result = await response.json();
                  alert(`Update completed: ${result.message}`);
                  playlists.refetch();
                } catch (error) {
                  alert(`Update failed: ${error}`);
                }
              }
            }}
          >
            Update Existing Playlists
          </Button>
          
          <Button 
            variant="outline" 
            onClick={async () => {
              if (confirm('This will update existing tracks with blueprint data. Continue?')) {
                try {
                  const response = await fetch('/api/admin/update-track-blueprints', { method: 'POST' });
                  const result = await response.json();
                  alert(`Update completed: ${result.message}`);
                } catch (error) {
                  alert(`Update failed: ${error}`);
                }
              }
            }}
          >
            Update Track Blueprints
          </Button>
        </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Will add first 3 tracks to the new playlist
              </p>

              {/* Debug: Playlist Status */}
              <div className="mb-4 p-3 bg-blue-50 rounded text-sm">
                <strong>Playlist Status:</strong>
                <ul className="mt-2 space-y-1">
                  <li>Loading: {playlists.isLoading ? 'Yes' : 'No'}</li>
                  <li>Error: {playlists.error ? String(playlists.error) : 'None'}</li>
                  <li>Data: {playlists.data ? 'Present' : 'None'}</li>
                  <li>Items: {playlists.data?.items?.length || 0}</li>
                  {playlists.data?.items?.[0] && (
                    <li>First playlist: {playlists.data.items[0].name} (tracks: {(playlists.data.items[0] as any).track_count})</li>
                  )}
                </ul>
              </div>

              {/* Debug: Selected Playlist Details */}
              {selectedPlaylistId && (
                <div className="mb-4 p-3 bg-green-50 rounded text-sm">
                  <div className="flex justify-between items-center mb-2">
                    <strong>Selected Playlist Details:</strong>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setSelectedPlaylistId(null)}
                    >
                      Close
                    </Button>
                  </div>
                  
                  {selectedPlaylist.isLoading && (
                    <p className="text-muted-foreground">Loading playlist details...</p>
                  )}
                  
                  {selectedPlaylist.error && (
                    <p className="text-red-600">Error: {String(selectedPlaylist.error)}</p>
                  )}
                  
                  {selectedPlaylist.data && (
                    <div className="space-y-3">
                      <div>
                        <strong>Playlist Info:</strong>
                        <ul className="mt-1 space-y-1 text-xs">
                          <li>Name: {selectedPlaylist.data.playlist.name}</li>
                          <li>ID: {selectedPlaylist.data.playlist.id}</li>
                          <li>Created: {new Date(selectedPlaylist.data.playlist.created_at).toLocaleString()}</li>
                          <li>Job ID: {selectedPlaylist.data.playlist.job_id || 'None'}</li>
                          <li>Track Count: {selectedPlaylist.data.playlist.track_count || 0}</li>
                          <li>Duration: {selectedPlaylist.data.playlist.total_duration_seconds ? `${Math.round(selectedPlaylist.data.playlist.total_duration_seconds / 60)}:${String(Math.round(selectedPlaylist.data.playlist.total_duration_seconds % 60)).padStart(2, '0')}` : 'Unknown'}</li>
                        </ul>
                      </div>
                      
                      {selectedPlaylist.data.playlist.config && (
                        <div>
                          <strong>Generation Config:</strong>
                          <div className="mt-2 p-2 bg-white rounded border text-xs max-h-32 overflow-y-auto">
                            <pre className="whitespace-pre-wrap">
                              {JSON.stringify(selectedPlaylist.data.playlist.config, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                      
                      {selectedJob.data?.job?.params?.blueprints && (
                        <div>
                          <strong>Track Blueprints ({selectedJob.data.job.params.blueprints.length}):</strong>
                          <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                            {selectedJob.data.job.params.blueprints.map((blueprint: any, index: number) => (
                              <div key={index} className="p-2 bg-white rounded border text-xs">
                                <div className="font-medium">Blueprint {index + 1}</div>
                                <div>Title: {blueprint.title || 'Untitled'}</div>
                                <div>Genre: {blueprint.genre}</div>
                                <div>BPM: {blueprint.bpm}</div>
                                <div>Energy: {blueprint.energy}/10</div>
                                <div>Duration: {blueprint.durationSec}s</div>
                                <div className="mt-1">
                                  <div className="font-medium">Prompt:</div>
                                  <div className="text-gray-600 max-h-16 overflow-y-auto">{blueprint.prompt}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <strong>Tracks ({selectedPlaylist.data.items?.length || 0}):</strong>
                        {selectedPlaylist.data.items && selectedPlaylist.data.items.length > 0 ? (
                          <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                            {selectedPlaylist.data.items.map((item: any, index: number) => (
                              <div key={item.track_id} className="p-2 bg-white rounded border text-xs">
                                <div className="font-medium">Track {index + 1}</div>
                                <div>ID: {item.track_id}</div>
                                <div>Position: {item.position}</div>
                                {item.tracks && (
                                  <div className="mt-1 space-y-1">
                                    <div>Title: {item.tracks.title || 'Untitled'}</div>
                                    <div>Duration: {item.tracks.duration_seconds ? `${Math.round(item.tracks.duration_seconds / 60)}:${String(Math.round(item.tracks.duration_seconds % 60)).padStart(2, '0')}` : 'Unknown'}</div>
                                    <div>Created: {item.tracks.created_at ? new Date(item.tracks.created_at).toLocaleString() : 'Unknown'}</div>
                                    {item.tracks.blueprint && (
                                      <div className="mt-2 p-2 bg-gray-50 rounded border text-xs">
                                        <div className="font-medium">Blueprint:</div>
                                        <div>BPM: {item.tracks.blueprint.bpm}</div>
                                        <div>Genre: {item.tracks.blueprint.genre}</div>
                                        <div>Energy: {item.tracks.blueprint.energy}/10</div>
                                        <div>Duration: {item.tracks.blueprint.durationSec}s</div>
                                        {item.tracks.blueprint.key && <div>Key: {item.tracks.blueprint.key}</div>}
                                        <div className="mt-1">
                                          <div className="font-medium">Prompt:</div>
                                          <div className="text-gray-600 max-h-12 overflow-y-auto">{item.tracks.blueprint.prompt}</div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-1 text-muted-foreground">No tracks found in this playlist</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Playlist Cards Grid */}
              {playlists.data?.items?.length ? (
                <div>
                  <p className="font-semibold mb-4">{playlists.data.items.length} playlists:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {playlists.data.items.map((playlist) => (
                      <PlaylistCard
                        key={playlist.id}
                        {...transformPlaylistForCard(playlist)}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-secondary/30 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  </div>
                  <h3 className="text-foreground mb-2">No playlists found</h3>
                  <p className="text-muted-foreground mb-4">Create your first playlist to get started</p>
                  <Button onClick={handleCreatePlaylist}>
                    Create Playlist
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Jobs Management */}
          <Card>
            <CardHeader>
              <CardTitle>🎼 Generation Jobs (useJobs, useCreateJob)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Create Job Form */}
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Music prompt..."
                  value={jobPrompt}
                  onChange={(e) => setJobPrompt(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  disabled={createJob.isPending}
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={handleCreateJob}
                    disabled={createJob.isPending}
                    className="flex-1"
                  >
                    {createJob.isPending ? "Generating... (may take 30-60s)" : "Generate Music (2 tracks)"}
                  </Button>
                  <Button variant="outline" onClick={() => jobs.refetch()}>
                    Refresh
                  </Button>
                </div>
              </div>

              {/* Jobs List */}
              {jobs.isLoading ? (
                <p className="text-muted-foreground">Loading jobs...</p>
              ) : jobs.data?.jobs?.length ? (
                <div className="space-y-2">
                  <p className="font-semibold">{jobs.data.jobs.length} recent jobs:</p>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {jobs.data.jobs.map((job) => (
                      <div key={job.id} className="p-2 border border-border rounded">
                        <div className="flex items-center justify-between">
                          <p className="font-medium truncate flex-1">{job.prompt || "No prompt"}</p>
                          <span className={`text-xs px-2 py-1 rounded ${
                            job.status === "succeeded" ? "bg-green-500/20 text-green-600" :
                            job.status === "failed" ? "bg-red-500/20 text-red-600" :
                            "bg-yellow-500/20 text-yellow-600"
                          }`}>
                            {job.status}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {job.provider} • {job.model} • {new Date(job.created_at).toLocaleString()}
                        </p>
                        {job.error && (
                          <p className="text-xs text-destructive mt-1">Error: {job.error}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No jobs found</p>
              )}
            </CardContent>
          </Card>

          {/* SDK Info */}
          <Card>
            <CardHeader>
              <CardTitle>ℹ️ SDK Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><strong>Package:</strong> @lyra/sdk</p>
              <p><strong>Provider:</strong> QueryClientProvider with React Query</p>
              <p><strong>Hooks Used:</strong> useWhoAmI, useTracks, usePlaylists, useJobs, useCreateTrack, useDeleteTrack, useCreatePlaylist, useCreateJob</p>
              <p><strong>Features:</strong></p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Automatic query invalidation after mutations</li>
                <li>Token management via localStorage (Bearer token)</li>
                <li>TypeScript support with full type safety</li>
                <li>React Query for caching and state management</li>
                <li>React Query Devtools (see bottom-right corner)</li>
              </ul>
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-muted-foreground">
                  ✅ <strong>Expected behavior:</strong> User info loads, tracks/playlists display, network requests include Bearer token
                </p>
                <p className="text-muted-foreground mt-2">
                  📚 See <code className="px-1 py-0.5 bg-muted rounded">packages/sdk/README.md</code> for complete documentation
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}

