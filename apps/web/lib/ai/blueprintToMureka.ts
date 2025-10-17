// apps/web/lib/ai/blueprintToMureka.ts
import { TrackBlueprint } from '@lyra/sdk';

/**
 * Transforms an AI Composer blueprint into Mureka API parameters
 * Uses hybrid approach: human-readable text + JSON context
 * Stays under 1024 character limit
 */
export function transformBlueprintToMurekaParams(blueprint: TrackBlueprint): {
  lyrics: string;
  model: string;
  prompt: string;
  reference_id?: string;
  vocal_id?: string;
  melody_id?: string;
  stream: boolean;
} {
  // Build the enhanced prompt with track details
  const basePrompt = blueprint.prompt;
  
  // Create structured track details
  const trackDetails = [
    `Title: ${blueprint.title}`,
    `BPM: ${blueprint.bpm}`,
    `Genre: ${blueprint.genre}`,
    `Energy: ${blueprint.energy}/10`,
    `Duration: ${blueprint.durationSec}s`
  ].join(', ');
  
  // Create JSON context for programmatic access
  const jsonContext = JSON.stringify({
    bpm: blueprint.bpm,
    genre: blueprint.genre,
    energy: blueprint.energy,
    durationSec: blueprint.durationSec
  });
  
  // Combine everything
  const enhancedPrompt = `${basePrompt}. ${trackDetails}. Context: ${jsonContext}`;
  
  // Ensure we stay under 1024 characters
  const finalPrompt = enhancedPrompt.length > 1024 
    ? `${basePrompt}. Context: ${jsonContext}`.substring(0, 1024)
    : enhancedPrompt;
  
  return {
    lyrics: blueprint.lyrics || '[Instrumental only]',
    model: blueprint.model || 'auto',
    prompt: finalPrompt,
    reference_id: undefined,
    vocal_id: undefined,
    melody_id: undefined,
    stream: blueprint.model !== 'mureka-o1' // Disable streaming for O1 model
  };
}
