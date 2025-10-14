"use client";

import { 
  useWhoAmI,
  useTracks, 
  usePlaylists,
  useJobs,
  useCreateTrack,
  useDeleteTrack,
  useCreatePlaylist,
  useCreateJob,
} from "@lyra/sdk";
import { Button, Card, CardHeader, CardTitle, CardContent } from "@lyra/ui";
import { useState } from "react";

export default function SDKTestPage() {
  const [trackTitle, setTrackTitle] = useState("");
  const [playlistName, setPlaylistName] = useState("");
  const [jobPrompt, setJobPrompt] = useState("Energetic electronic music");

  // Query hooks
  const whoami = useWhoAmI();
  const tracks = useTracks();
  const playlists = usePlaylists();
  const jobs = useJobs();

  // Mutation hooks
  const createTrack = useCreateTrack();
  const deleteTrack = useDeleteTrack();
  const createPlaylist = useCreatePlaylist();
  const createJob = useCreateJob();

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

        {/* JSON Debug Sections */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Raw Data (JSON)</h2>
          
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
        </section>

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

          {/* Tracks Management */}
          <Card>
            <CardHeader>
              <CardTitle>🎵 Tracks (useTracks, useCreateTrack, useDeleteTrack)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Create Track Form */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Track title..."
                  value={trackTitle}
                  onChange={(e) => setTrackTitle(e.target.value)}
                  className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  disabled={createTrack.isPending}
                />
                <Button 
                  onClick={handleCreateTrack}
                  disabled={createTrack.isPending}
                >
                  {createTrack.isPending ? "Creating..." : "Create Track"}
                </Button>
                <Button variant="outline" onClick={() => tracks.refetch()}>
                  Refresh
                </Button>
              </div>

              {/* Tracks List */}
              {tracks.data?.items?.length ? (
                <div className="space-y-2">
                  <p className="font-semibold">{tracks.data.items.length} tracks:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    {tracks.data.items.slice(0, 10).map((track) => (
                      <li key={track.id} className="flex items-center justify-between">
                        <span>{track.title || track.id}</span>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteTrack(track.id)}
                          disabled={deleteTrack.isPending}
                          className="ml-4"
                        >
                          Delete
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-muted-foreground">No tracks found</p>
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
              </div>
              <p className="text-xs text-muted-foreground">
                Will add first 3 tracks to the new playlist
              </p>

              {/* Playlists List */}
              {playlists.data?.items?.length ? (
                <div className="space-y-2">
                  <p className="font-semibold">{playlists.data.items.length} playlists:</p>
                  <ul className="list-disc pl-6">
                    {playlists.data.items.map((p) => (
                      <li key={p.id}>{p.name}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-muted-foreground">No playlists found</p>
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

