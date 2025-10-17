// apps/web/lib/ai/brandLearning.ts
import "server-only";
import { getSupabaseAdmin } from "../db";
import { ComposeConfig } from "@lyra/sdk";

/**
 * Merge arrays with de-dupe and soft cap.
 */
function mergeDistinct(current: string[], incoming: string[], cap = 20): string[] {
  const merged = Array.from(new Set([...(current || []), ...(incoming || [])]
    .map((s) => String(s).trim())
    .filter(Boolean)));
  return merged.slice(0, cap);
}

/**
 * Smooth a preference (EMA-ish): new = round(alpha*incoming + (1-alpha)*current).
 */
function smoothPreference(current: number | undefined, incoming: number, alpha = 0.35) {
  if (current == null || isNaN(current)) return Math.max(1, Math.min(10, Math.round(incoming)));
  const v = alpha * incoming + (1 - alpha) * current;
  return Math.max(1, Math.min(10, Math.round(v)));
}

/**
 * Record a short provenance note in brand_sources so we can audit learning.
 */
async function appendLearningSource(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  organizationId: string,
  config: ComposeConfig
) {
  const summary = [
    `Generated playlist via AI Composer`,
    config.playlistTitle ? `title: ${config.playlistTitle}` : null,
    `genres: ${config.genres.join(", ")}`,
    `moods: ${config.moods.join(", ")}`,
    `bpmRange: ${config.bpmRange[0]}–${config.bpmRange[1]}`,
    `energy: ${config.energy}`,
    `tracks: ${config.tracks}`,
    `familyFriendly: ${config.familyFriendly}`,
    `model: ${config.model}`,
  ]
    .filter(Boolean)
    .join(" | ");

  await supabase.from("brand_sources").insert({
    organization_id: organizationId,
    type: "lyra-compose",        // provenance
    url: null,
    raw_text: summary,
    extracted_at: new Date().toISOString(),
    ttl_expires_at: null,
  });
}

/**
 * Learn from a successful composed playlist:
 * - Merge genres into keywords (lightly),
 * - Merge moods,
 * - Smooth preferred_energy toward chosen config.energy,
 * - Append a short 'lyra-compose' source for traceability.
 *
 * Idempotent-ish: We only call this once per successful playlist creation.
 */
export async function learnFromComposedPlaylist(
  organizationId: string,
  config: ComposeConfig
): Promise<void> {
  const supabase = getSupabaseAdmin();

  // Fetch existing brand profile (or create a shell if missing)
  const { data: existing, error: selErr } = await supabase
    .from("brand_profiles")
    .select("keywords, moods, banned_terms, preferred_energy")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (selErr) {
    console.warn("[brandLearning] select brand_profiles error", selErr);
  }

  const currKeywords: string[] = Array.isArray(existing?.keywords) ? existing!.keywords : [];
  const currMoods: string[] = Array.isArray(existing?.moods) ? existing!.moods : [];
  const currBanned: string[] = Array.isArray(existing?.banned_terms) ? existing!.banned_terms : [];
  const currEnergy: number | undefined =
    typeof existing?.preferred_energy === "number" ? existing!.preferred_energy : undefined;

  // Shallow mapping: genres influence keywords; moods merge directly
  const nextKeywords = mergeDistinct(currKeywords, config.genres, 30);
  const nextMoods = mergeDistinct(currMoods, config.moods, 30);
  const nextEnergy = smoothPreference(currEnergy, config.energy, 0.35);

  if (existing) {
    const { error: upErr } = await supabase
      .from("brand_profiles")
      .update({
        keywords: nextKeywords,
        moods: nextMoods,
        banned_terms: currBanned,
        preferred_energy: nextEnergy,
      })
      .eq("organization_id", organizationId);
    if (upErr) console.warn("[brandLearning] update brand_profiles error", upErr);
  } else {
    const { error: insErr } = await supabase.from("brand_profiles").insert({
      organization_id: organizationId,
      keywords: nextKeywords,
      moods: nextMoods,
      banned_terms: currBanned,
      preferred_energy: nextEnergy,
    });
    if (insErr) console.warn("[brandLearning] insert brand_profiles error", insErr);
  }

  // Append a short source row for provenance (optional but useful)
  try {
    await appendLearningSource(supabase, organizationId, config);
  } catch (e) {
    console.warn("[brandLearning] append source error", e);
  }
}
