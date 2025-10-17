// apps/web/app/api/ai/safe/explicit/route.ts
import { NextResponse } from "next/server";
import { ComposeConfig, TrackBlueprint } from "@lyra/sdk";
import { safeComposeConfig, safeBlueprints, resolveExplicitPolicy } from "@/lib/ai/safe";

/**
 * POST body example:
 * {
 *   "config": { ...ComposeConfig },
 *   "blueprints": [ ...TrackBlueprint[] ],
 *   "brand": { "allowsExplicit": false, "bannedTerms": ["brandword"] }
 * }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const config = body.config as ComposeConfig;
    const blueprints = (body.blueprints || []) as TrackBlueprint[];
    const brand = (body.brand || {}) as { allowsExplicit?: boolean; bannedTerms?: string[] };

    const normalizedConfig = safeComposeConfig(config, brand.bannedTerms || [], brand.allowsExplicit);
    const policy = resolveExplicitPolicy({
      configAllowExplicit: normalizedConfig.allowExplicit,
      brandAllowsExplicit: brand.allowsExplicit,
      familyFriendly: normalizedConfig.familyFriendly,
    });

    const normalizedTracks = safeBlueprints(blueprints, {
      bannedTerms: brand.bannedTerms || [],
      familyFriendly: normalizedConfig.familyFriendly,
      allowExplicit: policy.allowExplicit,
    });

    return NextResponse.json({
      ok: true,
      policy,
      config: normalizedConfig,
      blueprints: normalizedTracks,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 400 });
  }
}
