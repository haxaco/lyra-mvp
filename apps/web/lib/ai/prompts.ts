// apps/web/lib/ai/prompts.ts
import "server-only";

function fromEnv(key: string, fallback: string) {
  const v = process.env[key];
  return (v && v.trim().length > 0) ? v : fallback;
}

export const prompts = {
  suggestions: fromEnv("PROMPTS_SUGGESTIONS", `
You are a B2B in-store music programmer. Return JSON { "suggestions": [...] } where each suggestion has: title, genres[], bpmRange [min,max], energy (1..10), moods[], notes[]. Keep it suitable for public venues.

IMPORTANT: 
- Return exactly 2-3 suggestions (no more, no less)
- bpmRange must be an array [min, max] not an object
- Example JSON: "bpmRange": [120, 140] not "bpmRange": {"min": 120, "max": 140}`),

  configDraft: fromEnv("PROMPTS_CONFIG", `
Create a single normalized playlist config. Return JSON with these exact fields:
- genres: array of strings (1-5 items)
- bpmRange: array [min, max] where min and max are numbers 40-240
- energy: number 1-10
- moods: array of strings (1-6 items)
- durationSec: number 30-600 (default 180)
- tracks: number 1-10 (default 6)
- familyFriendly: boolean (default true)
- model: "auto" (default)
- allowExplicit: boolean (default false)
- playlistTitle: string (optional)

Example JSON: {"genres": ["house", "funk"], "bpmRange": [120, 140], "energy": 8, "moods": ["energetic", "groovy"], "durationSec": 180, "tracks": 6, "familyFriendly": true, "model": "auto", "allowExplicit": false}`),

  blueprints: fromEnv("PROMPTS_BLUEPRINTS", `
Given a playlist config, produce per-track blueprints. Return a JSON array of objects with these exact fields:
- index: number (0-based)
- title: string (1-100 chars)
- prompt: string (1-1024 chars)
- lyrics: string (optional, default "[Instrumental only]")
- bpm: number (40-240)
- genre: string (1-50 chars)
- energy: number (1-10)
- key: string (optional, max 3 chars like "C", "Am")
- model: "auto" (default)
- durationSec: number (30-600, default 180)

Return the JSON as a direct array: [{"index": 0, "title": "Opening Track", "prompt": "Upbeat house with funky bassline", "lyrics": "[Instrumental only]", "bpm": 128, "genre": "house", "energy": 8, "model": "auto", "durationSec": 180}]`),
};
