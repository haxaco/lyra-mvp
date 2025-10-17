// apps/web/jobs/types.ts
export type JobKind =
  | "track.generate"     // existing
  | "playlist.generate"; // NEW

export type JobPayloadMap = {
  "track.generate": { /* existing */ };
  "playlist.generate": import("./steps/generatePlaylist").GeneratePlaylistPayload; // NEW
};

export type JobResultMap = {
  "track.generate": any; // existing
  "playlist.generate": import("./steps/generatePlaylist").GeneratePlaylistResult; // NEW
};

// Progress event emitter signature
export type JobProgressEmitter = (type: "log" | "progress", data: any) => void;

export type JobContext = {
  jobId: string;
  kind: JobKind;
  createdAt: string;
};
