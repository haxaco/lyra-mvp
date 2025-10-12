export type ApiOk<T> = { ok: true } & T;
export type ApiErr = { ok: false; error: string };

export type Track = {
  id: string;
  title: string | null;
  duration_seconds: number | null;
  r2_key: string | null;
  flac_r2_key?: string | null;
  created_at: string;
  meta?: any;
};

export type Playlist = {
  id: string;
  name: string;
  created_at: string;
  location_id?: string | null;
  schedule?: any;
};

export type PlaylistDetail = Playlist & {
  items: Array<{
    position: number;
    track_id: string;
    tracks: Track;
  }>;
};

export type Job = {
  id: string;
  provider: string;
  model: string;
  prompt: string | null;
  status: string;
  error: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
};

export type WhoAmI = ApiOk<{
  user_id: string;
  email: string | null;
  organization_id: string | null;
  role: string | null;
  user: { id: string; email?: string | null };
}>;

export type TracksList = ApiOk<{ items: Track[] }>;
export type PlaylistsList = ApiOk<{ items: Playlist[] }>;
export type PlaylistDetailResponse = ApiOk<{ playlist: Playlist; items: PlaylistDetail["items"] }>;
export type JobsList = ApiOk<{ jobs: Job[] }>;

export type CreateTrackBody = {
  title: string;
  duration_seconds?: number;
  genre?: string;
  energy?: number;
  r2_key?: string;
  flac_r2_key?: string;
  job_id?: string;
  watermark?: boolean;
  meta?: any;
};

export type CreatePlaylistBody = {
  name: string;
  trackIds: string[];
  locationId?: string;
  schedule?: any;
};

export type UpdatePlaylistBody = {
  name?: string;
  trackIds?: string[];
  schedule?: any;
};

export type CreateJobBody = {
  model?: string;
  n?: number;
  lyrics?: string;
  prompt?: string;
  reference_id?: string;
  vocal_id?: string;
  melody_id?: string;
  stream?: boolean;
};

