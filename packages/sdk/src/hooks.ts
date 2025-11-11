"use client";
import { useQuery, useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { apiFetch } from "./client";
import type {
  WhoAmI,
  TracksList,
  PlaylistsList,
  PlaylistDetailResponse,
  JobsList,
  ApiOk,
  CreateTrackBody,
  CreatePlaylistBody,
  UpdatePlaylistBody,
  CreateJobBody,
} from "./types";

// Query keys
const qk = {
  whoami: ["auth", "whoami"] as const,
  org: ["org"] as const,
  tracks: ["tracks"] as const,
  track: (id: string) => ["tracks", id] as const,
  playlists: ["playlists"] as const,
  playlist: (id: string) => ["playlists", id] as const,
  jobs: ["jobs"] as const,
  job: (id: string) => ["jobs", id] as const,
};

// Auth hooks
export function useWhoAmI() {
  return useQuery({
    queryKey: qk.whoami,
    queryFn: () => apiFetch<WhoAmI>("/api/auth/whoami"),
    staleTime: 60_000,
  });
}

// Org hooks
export function useOrg() {
  return useQuery({
    queryKey: qk.org,
    queryFn: () => apiFetch<ApiOk<{ org: any; locations: any[] }>>("/api/org"),
    staleTime: 60_000,
  });
}

// Track hooks
export function useTracks() {
  return useQuery({
    queryKey: qk.tracks,
    queryFn: () => apiFetch<TracksList>("/api/tracks"),
    refetchOnWindowFocus: false,
  });
}

export function useTrack(id: string) {
  return useQuery({
    queryKey: qk.track(id),
    queryFn: () => apiFetch<ApiOk<{ item: any }>>(`/api/tracks/${id}`),
    enabled: !!id,
  });
}

export function useCreateTrack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateTrackBody) =>
      apiFetch<ApiOk<{ track: any }>>("/api/tracks", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.tracks });
    },
  });
}

export function useDeleteTrack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (trackId: string) =>
      apiFetch<ApiOk<{}>>(`/api/tracks?id=${trackId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.tracks });
    },
  });
}

// Playlist hooks
export function usePlaylists() {
  return useQuery({
    queryKey: qk.playlists,
    queryFn: () => apiFetch<PlaylistsList>("/api/playlists"),
    refetchOnWindowFocus: false,
  });
}

export function usePlaylist(id: string) {
  return useQuery({
    queryKey: qk.playlist(id),
    queryFn: () => apiFetch<PlaylistDetailResponse>(`/api/playlists/${id}`),
    enabled: !!id,
  });
}

export function useCreatePlaylist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreatePlaylistBody) =>
      apiFetch<ApiOk<{ playlistId: string }>>("/api/playlists", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.playlists });
    },
  });
}

export function useUpdatePlaylist(playlistId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdatePlaylistBody) =>
      apiFetch<ApiOk<{}>>(`/api/playlists/${playlistId}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.playlist(playlistId) });
      qc.invalidateQueries({ queryKey: qk.playlists });
    },
  });
}

export function useDeletePlaylist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (playlistId: string) =>
      apiFetch<ApiOk<{}>>(`/api/playlists/${playlistId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.playlists });
    },
  });
}

// Job hooks
export function useJobs() {
  return useQuery({
    queryKey: qk.jobs,
    queryFn: () => apiFetch<JobsList>("/api/jobs"),
    refetchOnWindowFocus: false,
  });
}

export function useJobQuery(id: string) {
  return useQuery({
    queryKey: qk.job(id),
    queryFn: () => apiFetch<ApiOk<{ job: any }>>(`/api/jobs/${id}`),
    enabled: !!id,
    refetchInterval: (query) => {
      const status = (query.state.data as any)?.job?.status;
      // Poll every 3s if job is running
      if (status === "queued" || status === "running") return 3000;
      return false;
    },
  });
}

export function useCreateJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateJobBody) =>
      apiFetch<ApiOk<{ jobId: string; job: any; tracks: any[] }>>("/api/jobs", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.jobs });
      qc.invalidateQueries({ queryKey: qk.tracks });
    },
  });
}

// Alias for useCreateJob
export const useEnqueueJob = useCreateJob;

