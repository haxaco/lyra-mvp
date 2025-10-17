// apps/web/lib/ai/brandContext.ts
import "server-only";
import { createClient } from "@supabase/supabase-js";

export type BrandContext = {
  keywords: string[];
  moods: string[];
  bannedTerms: string[];
  preferredEnergy?: number;
  textSummary?: string;
  isEmpty: boolean;
  usedFallback: boolean;
  brandAllowsExplicit?: boolean; // NEW
};

type Options = {
  ttlDays?: number;   // brand_sources recency window
  maxChars?: number;  // textSummary cap
};

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

const DEFAULT_FALLBACK: Omit<BrandContext, "isEmpty" | "usedFallback"> = {
  keywords: ["general", "modern", "neutral"],
  moods: ["uplifting", "focused"],
  bannedTerms: ["explicit"],
  preferredEnergy: 6,
  textSummary: "No brand context available. Use neutral, modern, commercially friendly tone suitable for B2B background music.",
};

export async function loadBrandContext(
  organizationId: string,
  opts: Options = {}
): Promise<BrandContext> {
  const ttlDays = opts.ttlDays ?? 30;
  const maxChars = opts.maxChars ?? 4000;
  const supabase = getServiceSupabase();

  // 1) brand_profiles (try to include allow_explicit if column exists)
  const { data: profile, error: profileErr } = await supabase
    .from("brand_profiles")
    .select("keywords, moods, banned_terms, preferred_energy")
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (profileErr) console.warn("[brandContext] brand_profiles error", profileErr);

  const baseKeywords: string[] = Array.isArray(profile?.keywords) ? profile!.keywords : [];
  const baseMoods: string[] = Array.isArray(profile?.moods) ? profile!.moods : [];
  const baseBanned: string[] = Array.isArray(profile?.banned_terms) ? profile!.banned_terms : [];
  const baseEnergy: number | undefined =
    typeof profile?.preferred_energy === "number" ? profile!.preferred_energy : undefined;
  const brandAllowsExplicit: boolean = false; // Default to false until column exists

  // 2) brand_sources (recent)
  const sinceIso = new Date(Date.now() - ttlDays * 24 * 60 * 60 * 1000).toISOString();
  const { data: sources, error: sourcesErr } = await supabase
    .from("brand_sources")
    .select("type, url, raw_text, extracted_at")
    .eq("organization_id", organizationId)
    .gte("extracted_at", sinceIso)
    .order("extracted_at", { ascending: false })
    .limit(10);
  if (sourcesErr) console.warn("[brandContext] brand_sources error", sourcesErr);

  let textSummary = "";
  if (Array.isArray(sources) && sources.length) {
    for (const s of sources) {
      if (!s?.raw_text) continue;
      const header = s.type ? `[${s.type.toUpperCase()}]` : "[SOURCE]";
      const chunk = `${header} ${s.raw_text}`.trim();
      if ((textSummary + "\n\n" + chunk).length > maxChars) break;
      textSummary += (textSummary ? "\n\n" : "") + chunk;
    }
  }

  const dedupe = (arr: string[]) =>
    Array.from(new Set((arr || []).map((s) => String(s).trim()).filter(Boolean)));

  const keywords = dedupe(baseKeywords);
  const moods = dedupe(baseMoods);
  const bannedTerms = dedupe(baseBanned);
  const preferredEnergy =
    typeof baseEnergy === "number"
      ? Math.max(1, Math.min(10, Math.round(baseEnergy)))
      : undefined;

  const isEmpty = !keywords.length && !moods.length && !textSummary && preferredEnergy == null;

  if (isEmpty) {
    return {
      ...DEFAULT_FALLBACK,
      isEmpty: true,
      usedFallback: true,
      brandAllowsExplicit: false, // Default to false for fallback
    };
  }

  return {
    keywords,
    moods,
    bannedTerms,
    preferredEnergy,
    textSummary: textSummary || undefined,
    isEmpty: false,
    usedFallback: false,
    brandAllowsExplicit,
  };
}
