export * from "./client";
export * from "./types";
export * from "./hooks";
export * from "./auth";
export * from "./jobs";
export * from "./react/useJob";
export * from "./react/useLiveCompose";

// AI Composer client functions
export { startComposeSession, streamComposeSession, startLiveComposeSession, updateLiveComposeSession } from "./client/aiComposer";

// AI Composer schemas and types
export {
  ModelIdSchema,
  type ModelId,
  EnergySchema,
  type Energy,
  BpmRangeSchema,
  PlaylistBriefSchema,
  type PlaylistBrief,
  ComposeSuggestionCardSchema,
  type ComposeSuggestionCard,
  ComposeConfigSchema,
  type ComposeConfig,
  TrackBlueprintSchema,
  type TrackBlueprint,
  TrackBlueprintListSchema,
  StreamEventTypeSchema,
  type StreamEventType,
  StreamEventSchema,
  type StreamEvent,
  AIComposeSessionRowSchema,
  type AIComposeSessionRow,
  AIComposeMessageRowSchema,
  type AIComposeMessageRow,
  parseOrThrow,
  coerceComposeConfig,
  coerceTrackBlueprints,
} from "./schema/aiComposer";

