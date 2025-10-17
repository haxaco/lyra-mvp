// apps/web/lib/ai/composeEngine.ts
import "server-only";
import { z } from "zod";
import { getOpenAI } from "./openai";
import { loadBrandContext } from "./brandContext";

// Local schemas to avoid client/server import issues
const ModelIdSchema = z.enum(["auto", "mureka-6", "mureka-7.5", "mureka-o1"]);
const EnergySchema = z.number().int().min(1).max(10);
const BpmRangeSchema = z.tuple([z.number().int().min(40).max(240), z.number().int().min(40).max(240)])
  .refine(([min, max]) => min <= max, { message: "bpmRange: min must be ≤ max" });

const PlaylistBriefSchema = z.object({
  brief: z.string().min(1).max(2000),
  mood: z.string().optional(),
  energy: EnergySchema.optional(),
  bpmMin: z.number().int().min(40).max(240).optional(),
  bpmMax: z.number().int().min(40).max(240).optional(),
  genres: z.array(z.string()).max(10).optional(),
  bannedTerms: z.array(z.string()).max(50).optional(),
  durationSec: z.number().int().min(30).max(600).default(180),
  n: z.number().int().min(1).max(10).default(6),
  model: ModelIdSchema.default("auto"),
  familyFriendly: z.boolean().default(true),
  seed: z.string().optional(),
});

const ComposeSuggestionCardSchema = z.object({
  title: z.string().min(1).max(100),
  genres: z.array(z.string()).min(1).max(5),
  bpmRange: BpmRangeSchema,
  energy: EnergySchema,
  moods: z.array(z.string()).min(1).max(6),
  notes: z.array(z.string()).max(8).optional(),
});

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

type PlaylistBrief = z.infer<typeof PlaylistBriefSchema>;
import { safeComposeConfig, safeBlueprints, resolveExplicitPolicy } from "./safe";

export type StreamEvent =
  | { type: "message"; data: { text: string } }
  | { type: "suggestions"; data: { suggestions: z.infer<typeof ComposeSuggestionCardSchema>[] } }
  | { type: "config_draft"; data: { config: z.infer<typeof ComposeConfigSchema> } }
  | { type: "blueprints"; data: { blueprints: z.infer<typeof TrackBlueprintSchema>[] } }
  | { type: "done"; data: Record<string, never> };

export async function* composeInStages(args: {
  sessionId: string;
  organizationId: string;
  userId: string;
  briefInput: PlaylistBrief;
}): AsyncGenerator<StreamEvent, void, unknown> {
  const oai = getOpenAI();
  const brand = await loadBrandContext(args.organizationId);

  yield { type: "message", data: { text: "Analyzing brief & brand context…" } };

  // 1) Suggestions
  const suggestions = await getJson(oai, {
    system: `You are a B2B in-store music programmer. Return JSON { "suggestions": [...] } where each suggestion has: title, genres[], bpmRange [min,max], energy (1..10), moods[], notes[]. Keep it suitable for public venues.

IMPORTANT: 
- Return exactly 2-3 suggestions (no more, no less)
- bpmRange must be an array [min, max] not an object
- Example JSON: "bpmRange": [120, 140] not "bpmRange": {"min": 120, "max": 140}`,
    user: { brief: args.briefInput, brand },
    schema: z.object({ suggestions: z.array(ComposeSuggestionCardSchema).min(2).max(3) }),
    temperature: 0.7,
  });
  yield { type: "suggestions", data: { suggestions: suggestions.suggestions } };

  // 2) Config draft
  yield { type: "message", data: { text: "Drafting normalized config…" } };
  const cfg = await getJson(oai, {
    system: `Create a single normalized playlist config. Return JSON with these exact fields:
- genres: array of strings (1-5 items)
- bpmRange: array [min, max] where min and max are numbers 40-240
- energy: number 1-10
- moods: array of strings (1-6 items)
- durationSec: number 30-600 (default 180)
- tracks: number 1-10 (default 6)
- familyFriendly: boolean (default true)
- model: "auto" (default)
- allowExplicit: boolean (default false)
- playlistTitle: string (optional)

Example JSON: {"genres": ["house", "funk"], "bpmRange": [120, 140], "energy": 8, "moods": ["energetic", "groovy"], "durationSec": 180, "tracks": 6, "familyFriendly": true, "model": "auto", "allowExplicit": false}`,
    user: { brief: args.briefInput, brand, suggestions: suggestions.suggestions },
    schema: ComposeConfigSchema,
    temperature: 0.4,
  });
  
  // Ensure all required fields have values
  const normalizedCfg = {
    ...cfg,
    durationSec: cfg.durationSec ?? 180,
    tracks: cfg.tracks ?? 6,
    familyFriendly: cfg.familyFriendly ?? true,
    model: cfg.model ?? "auto" as const,
    allowExplicit: cfg.allowExplicit ?? false,
  };
  
  const safeCfg = safeComposeConfig(normalizedCfg, brand.bannedTerms ?? [], !!brand.brandAllowsExplicit);
  yield { type: "config_draft", data: { config: safeCfg } };

  // 3) Blueprints
  yield { type: "message", data: { text: "Composing per-track blueprints…" } };
  const bp = await getJson(oai, {
    system: `Given a playlist config, produce per-track blueprints. Return a JSON array of objects with these exact fields:
- index: number (0-based)
- title: string (1-100 chars)
- prompt: string (1-1024 chars)
- lyrics: string (optional, default "[Instrumental only]")
- bpm: number (40-240)
- genre: string (1-50 chars)
- energy: number (1-10)
- key: string (optional, max 3 chars like "C", "Am")
- model: "auto" (default)
- durationSec: number (30-600, default 180)

Return the JSON as a direct array: [{"index": 0, "title": "Opening Track", "prompt": "Upbeat house with funky bassline", "lyrics": "[Instrumental only]", "bpm": 128, "genre": "house", "energy": 8, "model": "auto", "durationSec": 180}]`,
    user: { config: safeCfg, brand },
    schema: z.union([
      z.array(TrackBlueprintSchema).min(1).max(10),
      z.object({ blueprints: z.array(TrackBlueprintSchema).min(1).max(10) }),
      z.object({ tracks: z.array(TrackBlueprintSchema).min(1).max(10) }),
    ]),
    temperature: 0.5,
  });

  const list = Array.isArray(bp) 
    ? bp 
    : ('blueprints' in bp ? bp.blueprints : bp.tracks);
  
  // Ensure all blueprints have required fields
  const normalizedBlueprints = list.map((blueprint: any) => ({
    ...blueprint,
    durationSec: blueprint.durationSec ?? 180,
    model: blueprint.model ?? "auto" as const,
    lyrics: blueprint.lyrics ?? "[Instrumental only]",
  }));
  
  const policy = resolveExplicitPolicy({
    configAllowExplicit: safeCfg.allowExplicit,
    brandAllowsExplicit: brand.brandAllowsExplicit,
    familyFriendly: safeCfg.familyFriendly,
  });
  const safeBps = safeBlueprints(normalizedBlueprints, {
    bannedTerms: brand.bannedTerms ?? [],
    familyFriendly: safeCfg.familyFriendly,
    allowExplicit: policy.allowExplicit,
  });
  yield { type: "blueprints", data: { blueprints: safeBps } };

  yield { type: "done", data: {} };
}

/* helper to coerce structured JSON with zod */
async function getJson<T>(
  oai: ReturnType<typeof getOpenAI>,
  opts: {
    system: string;
    user: any;
    schema: z.ZodType<T>;
    temperature?: number;
  }
): Promise<T> {
  const res = await oai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: opts.temperature ?? 0.4,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: opts.system },
      { role: "user", content: JSON.stringify(opts.user) },
    ],
  });
  const content = res.choices[0]?.message?.content ?? "{}";
  let json: any;
  try {
    json = JSON.parse(content);
  } catch (parseError) {
    throw new Error(`Failed to parse OpenAI response as JSON: ${parseError}. Content: ${content}`);
  }
  
  try {
    return opts.schema.parse(json);
  } catch (validationError) {
    console.error("OpenAI response validation failed:", validationError);
    console.error("OpenAI response content:", content);
    console.error("Parsed JSON:", json);
    throw new Error(`OpenAI response validation failed: ${JSON.stringify(validationError, null, 2)}`);
  }
}
