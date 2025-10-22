/**
 * Album Cover Generation Job Step
 * Generates album cover images for playlists as part of the job system
 */

import { JobContext, JobProgressEmitter } from '../types';
import { generateAlbumCoverFromConfig } from '../../lib/ai/albumCoverGenerator';
import { supabaseAdmin } from '../../lib/supabaseAdmin';

export type GenerateAlbumCoverPayload = {
  organizationId: string;
  playlistId: string;
  config: any; // ComposeConfig
};

export type GenerateAlbumCoverResult = {
  r2Key: string;
  prompt: string;
};

export async function generateAlbumCoverStep(
  ctx: JobContext,
  payload: GenerateAlbumCoverPayload,
  emit: JobProgressEmitter
): Promise<GenerateAlbumCoverResult> {
  const supabase = supabaseAdmin();
  
  emit("log", { msg: "Starting album cover generation..." });

  try {
    // Generate the album cover
    const result = await generateAlbumCoverFromConfig(
      payload.config,
      payload.organizationId,
      payload.playlistId
    );

    emit("log", { msg: "Album cover generated successfully" });

    // Update the playlist with the album cover R2 key
    const { error: updateError } = await supabase
      .from("playlists")
      .update({
        album_cover_r2_key: result.r2Key
      })
      .eq("id", payload.playlistId)
      .eq("organization_id", payload.organizationId);

    if (updateError) {
      throw new Error(`Failed to update playlist with album cover: ${updateError.message}`);
    }

    emit("log", { msg: "Playlist updated with album cover" });

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    emit("log", { msg: `Album cover generation failed: ${errorMessage}` });
    throw error;
  }
}
