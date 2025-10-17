// apps/web/app/api/compose/generate/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { ComposeConfigSchema, TrackBlueprintSchema } from "@lyra/sdk";
import { runSequentialPlaylistGeneration } from "@/lib/compose/runSequential";

const BodySchema = z.object({
  organizationId: z.string().uuid(),
  userId: z.string().uuid(),
  config: ComposeConfigSchema,
  blueprints: z.array(TrackBlueprintSchema).min(1).max(10),
  locationId: z.string().uuid().optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = BodySchema.parse(body);

    const result = await runSequentialPlaylistGeneration({
      organizationId: parsed.organizationId,
      userId: parsed.userId,
      locationId: parsed.locationId ?? null,
      config: parsed.config,
      blueprints: parsed.blueprints,
    });

    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: String(e?.message || e) },
      { status: 400 }
    );
  }
}
