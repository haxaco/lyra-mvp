// apps/web/app/api/compose/generate/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { ComposeConfigSchema, TrackBlueprintSchema } from "@lyra/sdk";
import { enqueueJob } from "@/lib/jobs/enqueue";
import { getUserAndOrg } from "@/lib/auth";

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
