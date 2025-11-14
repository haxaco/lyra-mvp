// apps/web/lib/ai/composeEngine.ts
import "server-only";
import { z } from "zod";
import { getOpenAI } from "./openai";
import { loadBrandContext } from "./brandContext";
import { prompts } from "./prompts";
import { resolveModel, DEFAULT_MODEL_ID } from "./models";

// Local schemas to avoid client/server import issues
const ModelIdSchema = z.enum(["auto", "gpt-4o-mini", "gpt-4o", "mureka-6", "mureka-7.5", "mureka-o1"]);
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
  provider: z.enum(['mureka', 'musicgpt', 'auto']).default('auto'),
  // New enhanced fields from improved prompts
  description: z.string().optional(),
  productionStyle: z.string().optional(),
  dynamicFlow: z.string().optional(),
  vocalApproach: z.string().optional(),
  targetContext: z.string().optional(),
});

const TrackBlueprintSchema = z.object({
  index: z.number().int().min(0),
  title: z.string().min(1).max(100),
  prompt: z.string().min(1).max(1024),
  prompt_musicgpt: z.string().min(1).max(300).optional(), // MusicGPT-specific prompt (300 chars max)
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
    provider: cfg.provider ?? "auto" as const,
  };
  
  const safeCfg = safeComposeConfig(normalizedCfg, brand.bannedTerms ?? [], !!brand.brandAllowsExplicit);
  yield { type: "config_draft", data: { config: safeCfg } };

  // 3) Blueprints
  yield { type: "message", data: { text: "Composing per-track blueprints…" } };
  
  // Always use the standard prompt - it now always instructs to generate both prompts
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
  
  // Ensure all blueprints have required fields and validate both prompts
  const normalizedBlueprints = list.map((blueprint: any, index: number) => {
    const baseBlueprint = {
      ...blueprint,
      durationSec: blueprint.durationSec ?? 180,
      model: blueprint.model ?? "auto" as const,
      lyrics: blueprint.lyrics ?? "[Instrumental only]",
    };
    
    // Validate that prompt_musicgpt exists and is within 300 chars
    if (!baseBlueprint.prompt_musicgpt || typeof baseBlueprint.prompt_musicgpt !== 'string') {
      console.warn(`[ComposeEngine] Track ${index} (${baseBlueprint.title}) missing prompt_musicgpt, generating fallback`);
      // Fallback: generate a truncated version if AI didn't generate it
      baseBlueprint.prompt_musicgpt = truncatePromptForMusicGpt(
        baseBlueprint.prompt || 'Generate music',
        baseBlueprint
      );
    } else {
      // Validate length - ensure it's exactly 300 chars or less
      const musicGptPrompt = baseBlueprint.prompt_musicgpt.trim();
      if (musicGptPrompt.length > 300) {
        console.warn(`[ComposeEngine] Track ${index} (${baseBlueprint.title}) prompt_musicgpt is ${musicGptPrompt.length} chars, truncating to 300`);
        baseBlueprint.prompt_musicgpt = musicGptPrompt.substring(0, 300).trim();
      } else if (musicGptPrompt.length < 50) {
        console.warn(`[ComposeEngine] Track ${index} (${baseBlueprint.title}) prompt_musicgpt is too short (${musicGptPrompt.length} chars), using fallback`);
        baseBlueprint.prompt_musicgpt = truncatePromptForMusicGpt(
          baseBlueprint.prompt || 'Generate music',
          baseBlueprint
        );
      } else {
        baseBlueprint.prompt_musicgpt = musicGptPrompt;
      }
    }
    
    return baseBlueprint;
  });
  
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

/**
 * Truncate and optimize a prompt for MusicGPT (300 chars max)
 * Fallback function used only if AI doesn't generate prompt_musicgpt
 * Tries to preserve the most important information while staying under the limit
 */
function truncatePromptForMusicGpt(fullPrompt: string, blueprint: any): string {
  const MAX_LENGTH = 300;
  
  // If prompt is already short enough, return as-is
  if (fullPrompt.length <= MAX_LENGTH) {
    return fullPrompt;
  }
  
  // Build a condensed version with key metadata
  const keyInfo: string[] = [];
  
  // Add genre if available
  if (blueprint.genre) {
    keyInfo.push(blueprint.genre);
  }
  
  // Add BPM if available
  if (blueprint.bpm) {
    keyInfo.push(`${blueprint.bpm} BPM`);
  }
  
  // Add energy if available
  if (blueprint.energy) {
    keyInfo.push(`energy ${blueprint.energy}/10`);
  }
  
  // Start with key info
  let truncated = keyInfo.length > 0 ? `${keyInfo.join(', ')}. ` : '';
  
  // Add the main prompt, truncated to fit
  const remainingLength = MAX_LENGTH - truncated.length - 3; // Leave room for "..."
  if (remainingLength > 0) {
    // Try to truncate at word boundaries
    const promptExcerpt = fullPrompt.substring(0, remainingLength);
    const lastSpace = promptExcerpt.lastIndexOf(' ');
    
    if (lastSpace > remainingLength * 0.8) {
      // If we found a space near the end, truncate there
      truncated += promptExcerpt.substring(0, lastSpace).trim();
    } else {
      // Otherwise, truncate mid-word
      truncated += promptExcerpt.trim();
    }
    
    // Add ellipsis if we truncated
    if (fullPrompt.length > remainingLength) {
      truncated += '...';
    }
  }
  
  // Ensure we're exactly at or under the limit
  return truncated.substring(0, MAX_LENGTH).trim();
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
