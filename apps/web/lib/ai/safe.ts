// apps/web/lib/ai/safe.ts
import { z } from "zod";

// Local types to avoid client/server import issues
const ModelIdSchema = z.enum(["auto", "mureka-6", "mureka-7.5", "mureka-o1"]);
const EnergySchema = z.number().int().min(1).max(10);
const BpmRangeSchema = z.tuple([z.number().int().min(40).max(240), z.number().int().min(40).max(240)])
  .refine(([min, max]) => min <= max, { message: "bpmRange: min must be ≤ max" });

const ComposeConfigSchema = z.object({
  playlistTitle: z.string().min(1).max(100).optional(),
  genres: z.array(z.string()).min(1).max(5),
  bpmRange: BpmRangeSchema,
  energy: EnergySchema,
  moods: z.array(z.string()).min(1).max(6),
  durationSec: z.number().int().min(30).max(600).default(180),
  tracks: z.number().int().min(1).max(10).default(6),
  familyFriendly: z.boolean().default(true),
  model: ModelIdSchema.default("auto"),
  allowExplicit: z.boolean().default(false),
});

const TrackBlueprintSchema = z.object({
  index: z.number().int().min(0),
  title: z.string().min(1).max(100),
  prompt: z.string().min(1).max(1024),
  lyrics: z.string().max(3000).optional().default("[Instrumental only]"),
  bpm: z.number().int().min(40).max(240),
  genre: z.string().min(1).max(50),
  energy: EnergySchema,
  key: z.string().max(3).optional(),
  model: ModelIdSchema.default("auto"),
  durationSec: z.number().int().min(30).max(600).default(180),
});

type ComposeConfig = z.infer<typeof ComposeConfigSchema>;
type TrackBlueprint = z.infer<typeof TrackBlueprintSchema>;

/** Generic profanity list (kept intentionally small; can be expanded or swapped for provider APIs). */
const BASIC_PROFANITY = [
  "explicit", // sentinel
  // add more terms as needed
];

/** Clamp helpers */
export function clamp(num: number, min: number, max: number) {
  return Math.max(min, Math.min(max, num));
}
export function clampBpmRange([lo, hi]: [number, number]): [number, number] {
  const min = clamp(Math.round(lo), 40, 240);
  const max = clamp(Math.round(hi), 40, 240);
  return [Math.min(min, max), Math.max(min, max)];
}
export function clampEnergy(value: number) {
  return clamp(Math.round(value), 1, 10);
}

/** Escape regex meta */
function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Remove terms by exact word boundary, case-insensitive. */
function stripTerms(text: string, terms: string[] = []): string {
  if (!text) return text;
  const list = [...new Set(terms.map((t) => t.trim()).filter(Boolean))];
  if (!list.length) return text;
  const pattern = new RegExp(`\\b(${list.map(escapeRegex).join("|")})\\b`, "gi");
  return text.replace(pattern, "[redacted]");
}

/** Remove obvious URLs and HTML, collapse whitespace. */
export function sanitizePrompt(text: string): string {
  if (!text) return text;
  return text
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Decide final explicit policy for a playlist:
 * - If ComposeConfig.allowExplicit is set, it wins.
 * - Else fallback to brandAllowsExplicit (org default).
 * - Else default to false.
 */
export function resolveExplicitPolicy(args: {
  configAllowExplicit?: boolean;
  brandAllowsExplicit?: boolean;
  familyFriendly?: boolean; // if true, we will still prefer non-explicit
}) {
  const { configAllowExplicit, brandAllowsExplicit, familyFriendly } = args;
  // System default: false
  let allowExplicit = false;

  if (typeof configAllowExplicit === "boolean") {
    allowExplicit = configAllowExplicit;
  } else if (typeof brandAllowsExplicit === "boolean") {
    allowExplicit = brandAllowsExplicit;
  }

  // If user explicitly wants family-friendly, force off
  if (familyFriendly === true) {
    allowExplicit = false;
  }

  // Policy:
  // - If allowExplicit = true: DO NOT apply generic profanity filter,
  //   BUT still apply brand-specific banned terms (safety > preference).
  // - If allowExplicit = false: apply both brand-specific bans AND generic profanity.
  return {
    allowExplicit,
    applyBrandBans: true,
    applyGenericProfanity: !allowExplicit,
  };
}

/** Strip brand-specific banned terms. Always applied (safety first). */
export function stripBrandBannedTerms(text: string, banned: string[] = []): string {
  return stripTerms(text, banned);
}

/** Strip generic profanity (only when policy says so). */
export function stripGenericProfanity(text: string): string {
  return stripTerms(text, BASIC_PROFANITY);
}

/** Enforce family-friendly lyrics with explicit toggle respected. */
export function enforceLyricsPolicy(
  lyrics: string | undefined,
  opts: {
    familyFriendly: boolean;
    allowExplicit: boolean;
    bannedTerms?: string[];
  }
): string {
  const base = (lyrics ?? (opts.familyFriendly && !opts.allowExplicit ? "[Instrumental only]" : "")).slice(0, 3000);
  let out = base;

  // Always strip brand bans first
  out = stripBrandBannedTerms(out, opts.bannedTerms || []);

  // Then generic profanity only if not allowing explicit
  if (!opts.allowExplicit) {
    out = stripGenericProfanity(out);
  }
  return out;
}

/** Normalize a ComposeConfig safely with explicit policy */
export function safeComposeConfig(
  input: ComposeConfig,
  bannedTerms: string[] = [],
  brandAllowsExplicit?: boolean
): ComposeConfig {
  const policy = resolveExplicitPolicy({
    configAllowExplicit: input.allowExplicit,
    brandAllowsExplicit,
    familyFriendly: input.familyFriendly,
  });

  const bpmRange = clampBpmRange(input.bpmRange);
  const energy = clampEnergy(input.energy);
  const durationSec = clamp(Math.round(input.durationSec ?? 180), 30, 600);
  const tracks = clamp(Math.round(input.tracks ?? 6), 1, 10);
  const genres = dedupe(input.genres).slice(0, 5);
  const moods = dedupe(input.moods).slice(0, 6);
  const playlistTitle = input.playlistTitle?.trim()?.slice(0, 100);

  const cleanGenre = (g: string) => {
    let t = sanitizePrompt(g);
    t = stripBrandBannedTerms(t, bannedTerms);
    if (policy.applyGenericProfanity) t = stripGenericProfanity(t);
    return t.slice(0, 50);
  };

  const cleanMood = (m: string) => {
    let t = sanitizePrompt(m);
    t = stripBrandBannedTerms(t, bannedTerms);
    if (policy.applyGenericProfanity) t = stripGenericProfanity(t);
    return t.slice(0, 50);
  };

  return {
    playlistTitle,
    genres: genres.map(cleanGenre),
    bpmRange,
    energy,
    moods: moods.map(cleanMood),
    durationSec,
    tracks,
    familyFriendly: !!input.familyFriendly,
    model: input.model ?? "auto",
    allowExplicit: policy.allowExplicit, // normalized effective flag
  };
}

/** Safely normalize per-track blueprints using explicit policy */
export function safeBlueprint(
  b: TrackBlueprint,
  opts: { bannedTerms?: string[]; familyFriendly: boolean; allowExplicit: boolean }
): TrackBlueprint {
  const clean = (t: string, cap: number) => {
    let x = sanitizePrompt(t);
    x = stripBrandBannedTerms(x, opts.bannedTerms || []);
    if (!opts.allowExplicit) x = stripGenericProfanity(x);
    return x.slice(0, cap);
  };
  return {
    ...b,
    title: clean(b.title, 100),
    prompt: clean(b.prompt, 1024),
    lyrics: enforceLyricsPolicy(b.lyrics, {
      familyFriendly: opts.familyFriendly,
      allowExplicit: opts.allowExplicit,
      bannedTerms: opts.bannedTerms,
    }),
    bpm: clamp(Math.round(b.bpm), 40, 240),
    energy: clampEnergy(b.energy),
    durationSec: clamp(Math.round(b.durationSec ?? 180), 30, 600),
    genre: clean(b.genre, 50),
    key: b.key?.slice(0, 3),
    model: b.model ?? "auto",
  };
}

export function safeBlueprints(
  list: TrackBlueprint[],
  opts: { bannedTerms?: string[]; familyFriendly: boolean; allowExplicit: boolean }
): TrackBlueprint[] {
  return list.map((b) => safeBlueprint(b, opts));
}

function dedupe(arr: string[] = []) {
  return Array.from(new Set(arr.map((s) => s.trim()).filter(Boolean)));
}
