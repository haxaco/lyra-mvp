// packages/sdk/src/schema/aiComposer.ts
import { z } from "zod";

/** ──────────────────────────────────────────────────────────────────────────
 * Base enums & helpers
 * ────────────────────────────────────────────────────────────────────────── */
export const ModelIdSchema = z.enum(["auto", "mureka-6", "mureka-7.5", "mureka-o1"]);
export type ModelId = z.infer<typeof ModelIdSchema>;

export const EnergySchema = z.number().int().min(1).max(10);
export type Energy = z.infer<typeof EnergySchema>;

export const BpmRangeSchema = z.tuple([z.number().int().min(40).max(240), z.number().int().min(40).max(240)])
  .refine(([min, max]) => min <= max, { message: "bpmRange: min must be ≤ max" });

/** ──────────────────────────────────────────────────────────────────────────
 * Playlist Brief (what the UI sends initially)
 * ────────────────────────────────────────────────────────────────────────── */
export const PlaylistBriefSchema = z.object({
  brief: z.string().min(1).max(2000),
  mood: z.string().optional(),
  energy: EnergySchema.optional(),            // 1..10
  bpmMin: z.number().int().min(40).max(240).optional(),
  bpmMax: z.number().int().min(40).max(240).optional(),
  genres: z.array(z.string()).max(10).optional(),
  bannedTerms: z.array(z.string()).max(50).optional(),
  durationSec: z.number().int().min(30).max(600).default(180),   // per-track
  n: z.number().int().min(1).max(10).default(6),                 // number of tracks
  model: ModelIdSchema.default("auto"),
  familyFriendly: z.boolean().default(true),
  seed: z.string().optional(),
});
export type PlaylistBrief = z.infer<typeof PlaylistBriefSchema>;

/** ──────────────────────────────────────────────────────────────────────────
 * Suggestions (cards shown in the sidebar)
 * ────────────────────────────────────────────────────────────────────────── */
export const ComposeSuggestionCardSchema = z.object({
  title: z.string().min(1).max(100),
  genres: z.array(z.string()).min(1).max(5),
  bpmRange: BpmRangeSchema,
  energy: EnergySchema,
  moods: z.array(z.string()).min(1).max(6),
  notes: z.array(z.string()).max(8).optional(),
});
export type ComposeSuggestionCard = z.infer<typeof ComposeSuggestionCardSchema>;

/** ──────────────────────────────────────────────────────────────────────────
 * Normalized config (what we actually apply)
 * ────────────────────────────────────────────────────────────────────────── */
export const ComposeConfigSchema = z.object({
  playlistTitle: z.string().min(1).max(100).optional(),
  genres: z.array(z.string()).min(1).max(5),
  bpmRange: BpmRangeSchema,
  energy: EnergySchema,
  moods: z.array(z.string()).min(1).max(6),
  durationSec: z.number().int().min(30).max(600).default(180),
  tracks: z.number().int().min(1).max(10).default(6),
  familyFriendly: z.boolean().default(true),
  model: ModelIdSchema.default("auto"),
  /** NEW: per-playlist override */
  allowExplicit: z.boolean().default(false),
});
export type ComposeConfig = z.infer<typeof ComposeConfigSchema>;

/** ──────────────────────────────────────────────────────────────────────────
 * Per-track blueprints (Advanced Mode previews)
 * ────────────────────────────────────────────────────────────────────────── */
export const TrackBlueprintSchema = z.object({
  index: z.number().int().min(0),
  title: z.string().min(1).max(100),
  prompt: z.string().min(1).max(1024),
  lyrics: z.string().max(3000).optional().default("[Instrumental only]"),
  bpm: z.number().int().min(40).max(240),
  genre: z.string().min(1).max(50),
  energy: EnergySchema,
  key: z.string().max(3).optional(), // e.g. "C", "Am"
  model: ModelIdSchema.default("auto"),
  durationSec: z.number().int().min(30).max(600).default(180),
});
export type TrackBlueprint = z.infer<typeof TrackBlueprintSchema>;

export const TrackBlueprintListSchema = z.array(TrackBlueprintSchema).min(1).max(10);

/** ──────────────────────────────────────────────────────────────────────────
 * Streaming events (SSE)
 * ────────────────────────────────────────────────────────────────────────── */
export const StreamEventTypeSchema = z.enum([
  "message",       // plain assistant copy
  "suggestions",   // array of suggestion cards
  "config_draft",  // normalized config (draft)
  "blueprints",    // array of track blueprints
  "done",          // terminal
]);
export type StreamEventType = z.infer<typeof StreamEventTypeSchema>;

export const StreamMessagePayloadSchema = z.object({
  text: z.string().min(1),
});

export const StreamSuggestionsPayloadSchema = z.object({
  suggestions: z.array(ComposeSuggestionCardSchema).min(1).max(5),
});

export const StreamConfigDraftPayloadSchema = z.object({
  config: ComposeConfigSchema,
});

export const StreamBlueprintsPayloadSchema = z.object({
  blueprints: TrackBlueprintListSchema,
});

export const StreamEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("message"), data: StreamMessagePayloadSchema }),
  z.object({ type: z.literal("suggestions"), data: StreamSuggestionsPayloadSchema }),
  z.object({ type: z.literal("config_draft"), data: StreamConfigDraftPayloadSchema }),
  z.object({ type: z.literal("blueprints"), data: StreamBlueprintsPayloadSchema }),
  z.object({ type: z.literal("done"), data: z.object({}).optional() }),
]);
export type StreamEvent = z.infer<typeof StreamEventSchema>;

/** ──────────────────────────────────────────────────────────────────────────
 * DB-shaped schemas (mirroring tables, useful for selects)
 * ────────────────────────────────────────────────────────────────────────── */
export const AIComposeSessionRowSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  user_id: z.string().uuid(),
  brief: z.string(),
  brand_context: z.record(z.any()).nullable().optional(),
  seed: z.string().nullable().optional(),
  config_json: z.record(z.any()).nullable().optional(),
  suggestions_json: z.record(z.any()).nullable().optional(),
  track_blueprints: z.record(z.any()).nullable().optional(),
  created_at: z.string(),
});
export type AIComposeSessionRow = z.infer<typeof AIComposeSessionRowSchema>;

export const AIComposeMessageRowSchema = z.object({
  id: z.string().uuid(),
  session_id: z.string().uuid(),
  organization_id: z.string().uuid(),
  role: z.enum(["system", "assistant", "user", "tool"]),
  content: z.string(),
  payload: z.record(z.any()).nullable().optional(),
  created_at: z.string(),
});
export type AIComposeMessageRow = z.infer<typeof AIComposeMessageRowSchema>;

/** ──────────────────────────────────────────────────────────────────────────
 * Small helpers (safe parsing / narrowing)
 * ────────────────────────────────────────────────────────────────────────── */
export function parseOrThrow<T>(schema: z.ZodType<T>, data: unknown, label?: string): T {
  const res = schema.safeParse(data);
  if (!res.success) {
    const issues = res.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`${label ?? "Zod"} validation failed: ${issues}`);
  }
  return res.data;
}

export function coerceComposeConfig(input: unknown): ComposeConfig {
  return ComposeConfigSchema.parse(input);
}

export function coerceTrackBlueprints(input: unknown): TrackBlueprint[] {
  return TrackBlueprintListSchema.parse(input);
}
