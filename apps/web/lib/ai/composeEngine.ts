// apps/web/lib/ai/composeEngine.ts
import "server-only";
import { z } from "zod";
import { getOpenAI } from "./openai";
import { loadBrandContext } from "./brandContext";
import { prompts } from "./prompts";
import { resolveModel, DEFAULT_MODEL_ID } from "./models";

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
  temperature: z.number().min(0).max(2).optional(),
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
  const modelId = args.briefInput?.model; // may be undefined → fallback to default
  const suggestions = await getJson(oai, {
    system: prompts.suggestions,
    user: { brief: args.briefInput, brand },
    schema: z.object({ suggestions: z.array(ComposeSuggestionCardSchema).min(1).max(3) }),
    temperature: args.briefInput?.temperature ?? 0.7,
    modelId,
  });
  yield { type: "suggestions", data: { suggestions: suggestions.suggestions } };

  // 2) Config draft
  yield { type: "message", data: { text: "Drafting normalized config…" } };
  const cfg = await getJson(oai, {
    system: prompts.configDraft,
    user: { brief: args.briefInput, brand, suggestions: suggestions.suggestions },
    schema: ComposeConfigSchema,
    temperature: args.briefInput?.temperature ?? 0.4,
    modelId,
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
    system: prompts.blueprints,
    user: { config: safeCfg, brand },
    schema: z.union([
      z.array(TrackBlueprintSchema).min(1).max(10),
      z.object({ blueprints: z.array(TrackBlueprintSchema).min(1).max(10) }),
      z.object({ tracks: z.array(TrackBlueprintSchema).min(1).max(10) }),
    ]),
    temperature: args.briefInput?.temperature ?? 0.5,
    modelId,
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
    modelId?: string;
  }
): Promise<T> {
  const model = resolveModel(opts.modelId ?? DEFAULT_MODEL_ID);
  const res = await oai.chat.completions.create({
    model: model.apiModel,
    temperature: opts.temperature ?? model.defaultTemperature,
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
