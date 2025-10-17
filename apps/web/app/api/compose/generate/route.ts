// apps/web/app/api/compose/generate/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { enqueueJob } from "@/lib/jobs/enqueue";
import { getUserAndOrg } from "@/lib/auth";

// Local schemas to avoid client/server import issues
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

const BodySchema = z.object({
  config: ComposeConfigSchema,
  blueprints: z.array(TrackBlueprintSchema).min(1).max(10),
  locationId: z.string().uuid().optional().nullable(),
});

export async function POST(req: Request) {
  try {
    // Get authenticated user and organization
    const { userId, organizationId } = await getUserAndOrg();
    
    const body = await req.json();
    const parsed = BodySchema.parse(body);

    const jobId = await enqueueJob("playlist.generate", {
      organizationId,
      userId,
      locationId: parsed.locationId ?? null,
      config: parsed.config,
      blueprints: parsed.blueprints,
    }, {
      organizationId,
      userId
    });

    return NextResponse.json({ ok: true, jobId });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: String(e?.message || e) },
      { status: 400 }
    );
  }
}
