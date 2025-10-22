// apps/web/app/api/ai/compose/live/update/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserAndOrg } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/db";
import { loadBrandContext } from "@/lib/ai/brandContext";
import { getOpenAI } from "@/lib/ai/openai";
import { prompts } from "@/lib/ai/prompts";
import { resolveModel, DEFAULT_MODEL_ID } from "@/lib/ai/models";
import { safeComposeConfig } from "@/lib/ai/safe";

// Local schemas
const ModelIdSchema = z.enum(["auto", "gpt-4o-mini", "gpt-4o", "mureka-6", "mureka-7.5", "mureka-o1"]);
const EnergySchema = z.number().int().min(1).max(10);
const BpmRangeSchema = z.tuple([z.number().int().min(40).max(240), z.number().int().min(40).max(240)])
  .refine(([min, max]) => min <= max, { message: "bpmRange: min must be ≤ max" });

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
  // New enhanced fields from improved prompts
  description: z.string().optional(),
  productionStyle: z.string().optional(),
  dynamicFlow: z.string().optional(),
  vocalApproach: z.string().optional(),
  targetContext: z.string().optional(),
});

const UpdateRequestSchema = z.object({
  sessionId: z.string().uuid(),
  brief: z.string().min(1).max(2000),
  updateType: z.enum(["suggestions", "config", "blueprints"]),
  previousSuggestions: z.array(ComposeSuggestionCardSchema).optional(),
});

export async function POST(req: Request) {
  try {
    const { userId, organizationId } = await getUserAndOrg();
    const body = await req.json();
    const { sessionId, brief, updateType, previousSuggestions } = UpdateRequestSchema.parse(body);

    // Verify session belongs to user's org
    const supabase = getSupabaseAdmin();
    const { data: session, error: sessionError } = await supabase
      .from("ai_compose_sessions")
      .select("model, temperature, brand_context")
      .eq("id", sessionId)
      .eq("organization_id", organizationId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ ok: false, error: "Session not found" }, { status: 404 });
    }

    const oai = getOpenAI();
    const brand = session.brand_context || await loadBrandContext(organizationId);
    const modelId = session.model || "auto";
    const temperature = session.temperature || 0.7;

    if (updateType === "suggestions") {
      // Generate new suggestions based on updated brief
      const suggestions = await getJson(oai, {
        system: prompts.suggestions,
        user: { brief, brand },
        schema: z.object({ suggestions: z.array(ComposeSuggestionCardSchema).min(1).max(3) }),
        temperature,
        modelId,
      });

      return NextResponse.json({ 
        ok: true, 
        type: "suggestions", 
        data: { suggestions: suggestions.suggestions } 
      });
    }

    if (updateType === "config" && previousSuggestions) {
      // Generate new config based on updated brief and previous suggestions
      const config = await getJson(oai, {
        system: prompts.configDraft,
        user: { brief, brand, suggestions: previousSuggestions },
        schema: ComposeConfigSchema,
        temperature: temperature * 0.6, // Slightly more focused for config
        modelId,
      });

      // Normalize and apply safety filters
      const normalizedCfg = {
        ...config,
        durationSec: config.durationSec ?? 180,
        tracks: config.tracks ?? 6,
        familyFriendly: config.familyFriendly ?? true,
        model: config.model ?? "auto" as const,
        allowExplicit: config.allowExplicit ?? false,
      };

      const safeCfg = safeComposeConfig(normalizedCfg, brand.bannedTerms ?? [], !!brand.brandAllowsExplicit);

      return NextResponse.json({ 
        ok: true, 
        type: "config_draft", 
        data: { config: safeCfg } 
      });
    }

    if (updateType === "blueprints") {
      // Generate new blueprints based on updated brief
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

      const bp = await getJson(oai, {
        system: prompts.blueprints,
        user: { brief, brand },
        schema: z.union([
          z.array(TrackBlueprintSchema).min(1).max(10),
          z.object({ blueprints: z.array(TrackBlueprintSchema).min(1).max(10) }),
          z.object({ tracks: z.array(TrackBlueprintSchema).min(1).max(10) }),
          TrackBlueprintSchema, // Handle single blueprint object
        ]),
        temperature: temperature * 0.5,
        modelId,
      });

      // Normalize to array - handle all possible response formats
      let list: any[];
      if (Array.isArray(bp)) {
        list = bp;
      } else if (bp && typeof bp === 'object') {
        if ('blueprints' in bp && Array.isArray(bp.blueprints)) {
          list = bp.blueprints;
        } else if ('tracks' in bp && Array.isArray(bp.tracks)) {
          list = bp.tracks;
        } else {
          // Single blueprint object - wrap in array
          list = [bp];
        }
      } else {
        throw new Error('Invalid blueprint response format');
      }
      
      // Ensure all blueprints have required fields
      const normalizedBlueprints = list.map((blueprint: any) => ({
        ...blueprint,
        durationSec: blueprint.durationSec ?? 180,
        model: blueprint.model ?? "auto" as const,
        lyrics: blueprint.lyrics ?? "[Instrumental only]",
      }));

      return NextResponse.json({ 
        ok: true, 
        type: "blueprints", 
        data: { blueprints: normalizedBlueprints } 
      });
    }

    return NextResponse.json({ ok: false, error: "Invalid update type or missing data" }, { status: 400 });

  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 400 });
  }
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
