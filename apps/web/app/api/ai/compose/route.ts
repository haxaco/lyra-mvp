// apps/web/app/api/ai/compose/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { createComposeSession } from "@/lib/ai/persist";
import { loadBrandContext } from "@/lib/ai/brandContext";
import { getUserAndOrg } from "@/lib/auth";

// Local schema to avoid client/server import issues
const PlaylistBriefSchema = z.object({
  brief: z.string().min(1).max(2000),
  mood: z.string().optional(),
  energy: z.number().int().min(1).max(10).optional(),
  bpmMin: z.number().int().min(40).max(240).optional(),
  bpmMax: z.number().int().min(40).max(240).optional(),
  genres: z.array(z.string()).max(10).optional(),
  bannedTerms: z.array(z.string()).max(50).optional(),
  durationSec: z.number().int().min(30).max(600).default(180),
  n: z.number().int().min(1).max(10).default(6),
  model: z.enum(["auto", "mureka-6", "mureka-7.5", "mureka-o1"]).default("auto"),
  familyFriendly: z.boolean().default(true),
  seed: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const { userId, organizationId } = await getUserAndOrg();
    const body = await req.json();
    const brief = PlaylistBriefSchema.parse(body);
    const brand = await loadBrandContext(organizationId);

    const sessionId = await createComposeSession({
      organizationId,
      userId,
      brief: brief.brief,
      brandContextSnapshot: brand,
    });

    return NextResponse.json({ ok: true, sessionId });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 400 });
  }
}
