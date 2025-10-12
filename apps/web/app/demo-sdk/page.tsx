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
import { UIButton, UICard, UICardHeader, UICardTitle, UICardContent } from "@lyra/ui";
import { useState } from "react";

export default function SDKDemoPage() {
  const [trackTitle, setTrackTitle] = useState("");
  const [playlistName, setPlaylistName] = useState("");
  const [jobPrompt, setJobPrompt] = useState("Energetic electronic music");

  // Query hooks
  const { data: whoami, isLoading: whoamiLoading } = useWhoAmI();
  const { data: tracks, isLoading: tracksLoading, refetch: refetchTracks } = useTracks();
  const { data: playlists, isLoading: playlistsLoading, refetch: refetchPlaylists } = usePlaylists();
  const { data: jobs, isLoading: jobsLoading, refetch: refetchJobs } = useJobs();

  // Mutation hooks
  const createTrack = useCreateTrack();
  const deleteTrack = useDeleteTrack();
  const createPlaylist = useCreatePlaylist();
  const createJob = useCreateJob();

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
    const trackIds = tracks?.items.slice(0, 3).map(t => t.id) || [];
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
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">@lyra/sdk Demo</h1>
          <p className="text-muted-foreground">
            Interactive demo of all SDK hooks and features
          </p>
        </div>

        {/* User Info */}
        <UICard>
          <UICardHeader>
            <UICardTitle>👤 Current User (useWhoAmI)</UICardTitle>
          </UICardHeader>
          <UICardContent>
            {whoamiLoading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : whoami ? (
              <div className="space-y-2">
                <p><strong>User ID:</strong> {whoami.user_id}</p>
                <p><strong>Email:</strong> {whoami.email || "N/A"}</p>
                <p><strong>Organization:</strong> {whoami.organization_id || "None"}</p>
                <p><strong>Role:</strong> {whoami.role || "None"}</p>
              </div>
            ) : (
              <p className="text-destructive">Not authenticated</p>
            )}
          </UICardContent>
        </UICard>

        {/* Tracks Section */}
        <UICard>
          <UICardHeader>
            <UICardTitle>🎵 Tracks (useTracks, useCreateTrack, useDeleteTrack)</UICardTitle>
          </UICardHeader>
          <UICardContent className="space-y-4">
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
              <UIButton 
                onClick={handleCreateTrack}
                disabled={createTrack.isPending}
              >
                {createTrack.isPending ? "Creating..." : "Create Track"}
              </UIButton>
              <UIButton variant="outline" onClick={() => refetchTracks()}>
                Refresh
              </UIButton>
            </div>

            {/* Tracks List */}
            {tracksLoading ? (
              <p className="text-muted-foreground">Loading tracks...</p>
            ) : tracks?.items.length ? (
              <div className="space-y-2">
                <p className="font-semibold">{tracks.items.length} tracks found:</p>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {tracks.items.slice(0, 10).map((track) => (
                    <div key={track.id} className="flex items-center justify-between p-2 border border-border rounded">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{track.title || "Untitled"}</p>
                        <p className="text-xs text-muted-foreground">
                          {track.duration_seconds ? `${track.duration_seconds}s` : "No duration"} • 
                          {new Date(track.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <UIButton 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDeleteTrack(track.id)}
                        disabled={deleteTrack.isPending}
                      >
                        Delete
                      </UIButton>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No tracks found</p>
            )}
          </UICardContent>
        </UICard>

        {/* Playlists Section */}
        <UICard>
          <UICardHeader>
            <UICardTitle>📋 Playlists (usePlaylists, useCreatePlaylist)</UICardTitle>
          </UICardHeader>
          <UICardContent className="space-y-4">
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
              <UIButton 
                onClick={handleCreatePlaylist}
                disabled={createPlaylist.isPending}
              >
                {createPlaylist.isPending ? "Creating..." : "Create Playlist"}
              </UIButton>
              <UIButton variant="outline" onClick={() => refetchPlaylists()}>
                Refresh
              </UIButton>
            </div>
            <p className="text-xs text-muted-foreground">
              Will add first 3 tracks to the new playlist
            </p>

            {/* Playlists List */}
            {playlistsLoading ? (
              <p className="text-muted-foreground">Loading playlists...</p>
            ) : playlists?.items.length ? (
              <div className="space-y-2">
                <p className="font-semibold">{playlists.items.length} playlists found:</p>
                <div className="space-y-1">
                  {playlists.items.slice(0, 5).map((playlist) => (
                    <div key={playlist.id} className="p-2 border border-border rounded">
                      <p className="font-medium">{playlist.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Created {new Date(playlist.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No playlists found</p>
            )}
          </UICardContent>
        </UICard>

        {/* Jobs Section */}
        <UICard>
          <UICardHeader>
            <UICardTitle>🎼 Generation Jobs (useJobs, useCreateJob)</UICardTitle>
          </UICardHeader>
          <UICardContent className="space-y-4">
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
                <UIButton 
                  onClick={handleCreateJob}
                  disabled={createJob.isPending}
                  className="flex-1"
                >
                  {createJob.isPending ? "Generating... (may take 30-60s)" : "Generate Music (2 tracks)"}
                </UIButton>
                <UIButton variant="outline" onClick={() => refetchJobs()}>
                  Refresh
                </UIButton>
              </div>
            </div>

            {/* Jobs List */}
            {jobsLoading ? (
              <p className="text-muted-foreground">Loading jobs...</p>
            ) : jobs?.jobs.length ? (
              <div className="space-y-2">
                <p className="font-semibold">{jobs.jobs.length} recent jobs:</p>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {jobs.jobs.map((job) => (
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
          </UICardContent>
        </UICard>

        {/* SDK Info */}
        <UICard>
          <UICardHeader>
            <UICardTitle>ℹ️ SDK Information</UICardTitle>
          </UICardHeader>
          <UICardContent className="space-y-2 text-sm">
            <p><strong>Package:</strong> @lyra/sdk</p>
            <p><strong>Hooks Used:</strong> useWhoAmI, useTracks, usePlaylists, useJobs, useCreateTrack, useDeleteTrack, useCreatePlaylist, useCreateJob</p>
            <p><strong>Features:</strong></p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
              <li>Automatic query invalidation after mutations</li>
              <li>Token management via localStorage</li>
              <li>TypeScript support with full type safety</li>
              <li>React Query for caching and state management</li>
              <li>Error handling with user-friendly messages</li>
            </ul>
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-muted-foreground">
                📚 See <code className="px-1 py-0.5 bg-muted rounded">packages/sdk/README.md</code> for complete documentation
              </p>
            </div>
          </UICardContent>
        </UICard>
      </div>
    </div>
  );
}

