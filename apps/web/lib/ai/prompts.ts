// apps/web/lib/ai/prompts.ts
import "server-only";

function fromEnv(key: string, fallback: string) {
  const v = process.env[key];
  return (v && v.trim().length > 0) ? v : fallback;
}

export const prompts = {
  suggestions: fromEnv("PROMPTS_SUGGESTIONS", `
You are a B2B in-store music curator.
Based on the user's brand and brief, return JSON:
{ "suggestions": [{ "title": string, "genres": string[], "moods": string[], "bpmRange": [number,number], "energy": number, "notes": string[] }]}
Keep content safe for public venues.`),

  configDraft: fromEnv("PROMPTS_CONFIG", `
Create a normalized playlist configuration.
Return JSON matching ComposeConfigSchema:
{ "genres": string[], "bpmRange": [number,number], "energy": number, "moods": string[], "durationSec": number, "tracks": number, "familyFriendly": boolean, "model": string, "allowExplicit": boolean, "playlistTitle"?: string }`),

  blueprints: fromEnv("PROMPTS_BLUEPRINTS", `
Given a playlist config, output per-track blueprints (1..tracks) matching TrackBlueprintSchema with:
index(1-based), title, prompt, lyrics(optional), bpm, genre, energy, key(optional), durationSec, model. Ensure musical transitions make sense.`),
};
