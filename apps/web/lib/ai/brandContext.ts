// apps/web/lib/ai/brandContext.ts
// Server-only helper to load & normalize brand context for an org.

import "server-only";
import { createClient } from "@supabase/supabase-js";

type BrandContext = {
  keywords: string[];        // single-word or short phrases relevant to brand
  moods: string[];           // e.g., "warm", "energetic", "calm"
  bannedTerms: string[];     // profanity / brand-banned words
  preferredEnergy?: number;  // 1..10
  textSummary?: string;      // compact concatenation of recent brand_sources
};

type Options = {
  ttlDays?: number;          // only use brand_sources more recent than this (default 30d)
  maxChars?: number;         // cap textSummary size (default 4000)
};

// If you already have a server supabase client helper, import and use that instead.
// This local factory uses service role when available (server-side only).
function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

/**
 * Loads brand profile & freshest sources for an organization and returns a normalized BrandContext.
 */
export async function loadBrandContext(
  organizationId: string,
  opts: Options = {}
): Promise<BrandContext> {
  const ttlDays = opts.ttlDays ?? 30;
  const maxChars = opts.maxChars ?? 4000;
  const supabase = getServiceSupabase();

  // 1) brand_profiles (single row per org)
  const { data: profile, error: profileErr } = await supabase
    .from("brand_profiles")
    .select("keywords, moods, banned_terms, preferred_energy")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (profileErr) {
    // Non-fatal; return safe defaults if this fails
    console.warn("[brandContext] brand_profiles error", profileErr);
  }

  const baseKeywords: string[] = Array.isArray(profile?.keywords) ? profile!.keywords : [];
  const baseMoods: string[] = Array.isArray(profile?.moods) ? profile!.moods : [];
  const baseBanned: string[] = Array.isArray(profile?.banned_terms) ? profile!.banned_terms : [];
  const baseEnergy: number | undefined =
    typeof profile?.preferred_energy === "number" ? profile!.preferred_energy : undefined;

  // 2) brand_sources (recent text scraped from website / socials)
  const sinceIso = new Date(Date.now() - ttlDays * 24 * 60 * 60 * 1000).toISOString();
  const { data: sources, error: sourcesErr } = await supabase
    .from("brand_sources")
    .select("type, url, raw_text, extracted_at")
    .eq("organization_id", organizationId)
    .gte("extracted_at", sinceIso)
    .order("extracted_at", { ascending: false })
    .limit(10);

  if (sourcesErr) {
    console.warn("[brandContext] brand_sources error", sourcesErr);
  }

  // Build a compact text summary (no NLP yet; we just concatenate the freshest raw_text)
  let textSummary = "";
  if (Array.isArray(sources) && sources.length) {
    for (const s of sources) {
      if (!s?.raw_text) continue;
      // add a small header tag per source to help LLM separate chunks
      const header = s.type ? `[${s.type.toUpperCase()}]` : "[SOURCE]";
      const chunk = `${header} ${s.raw_text}`.trim();
      if ((textSummary + "\n\n" + chunk).length > maxChars) break;
      textSummary += (textSummary ? "\n\n" : "") + chunk;
    }
  }

  // 3) Deduplicate / normalize lists
  const dedupe = (arr: string[]) =>
    Array.from(new Set((arr || []).map((s) => String(s).trim()).filter(Boolean)));

  const keywords = dedupe(baseKeywords);
  const moods = dedupe(baseMoods);
  const bannedTerms = dedupe(baseBanned);

  // 4) Clamp energy into 1..10 if present
  const preferredEnergy =
    typeof baseEnergy === "number"
      ? Math.max(1, Math.min(10, Math.round(baseEnergy)))
      : undefined;

  // 5) Return normalized context (safe defaults if nothing exists)
  return {
    keywords,
    moods,
    bannedTerms,
    preferredEnergy,
    textSummary: textSummary || undefined,
  };
}
