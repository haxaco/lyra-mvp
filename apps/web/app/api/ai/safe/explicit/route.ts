// apps/web/app/api/ai/safe/explicit/route.ts
import { NextResponse } from "next/server";
import { safeComposeConfig, safeBlueprints, resolveExplicitPolicy } from "@/lib/ai/safe";

// Local types to avoid client/server import issues
type ComposeConfig = {
  playlistTitle?: string;
  genres: string[];
  bpmRange: [number, number];
  energy: number;
  moods: string[];
  durationSec: number;
  tracks: number;
  familyFriendly: boolean;
  model: "auto" | "mureka-6" | "mureka-7.5" | "mureka-o1";
  allowExplicit: boolean;
};

type TrackBlueprint = {
  index: number;
  title: string;
  prompt: string;
  lyrics: string;
  bpm: number;
  genre: string;
  energy: number;
  key?: string;
  model: "auto" | "mureka-6" | "mureka-7.5" | "mureka-o1";
  durationSec: number;
};

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
