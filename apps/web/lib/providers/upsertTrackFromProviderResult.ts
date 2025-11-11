import type { ProviderId, ProviderNormalizedResult } from '@lyra/core';
import { insertTrack, getSupabaseAdmin } from '../db';
import type { JobSnapshot } from '../types';
import { uploadFromUrl } from '../r2';

export interface UpsertTrackFromProviderResultArgs {
  job: JobSnapshot;
  normalized: ProviderNormalizedResult;
  providerId: ProviderId;
  variantIndex: number;
  playlist?: {
    id: string;
    position?: number;
    blueprint?: any;
  };
  fallbackPrompt?: string | null;
  title?: string | null;
  artist?: string | null;
  externalIds?: {
    providerTaskId?: string | null;
    providerChoiceId?: string | null;
    sourceConversionId?: string | null;
  };
}

function sanitizeTimestamp(date = new Date()): string {
  return date.toISOString().replace(/[:.]/g, '-');
}

function normalizeFormat(format?: string | null): string | null {
  if (!format) return null;
  const lower = format.toLowerCase();
  if (lower.includes('mp3') || lower.includes('mpeg')) return 'mp3';
  if (lower.includes('flac')) return 'flac';
  if (lower.includes('wav')) return 'wav';
  return lower;
}

function inferContentType(format: string | null): string {
  switch (format) {
    case 'mp3':
      return 'audio/mpeg';
    case 'flac':
      return 'audio/flac';
    case 'wav':
      return 'audio/wav';
    default:
      return 'application/octet-stream';
  }
}

function generateTitle({
  explicitTitle,
  fallbackPrompt,
  variantIndex,
}: {
  explicitTitle?: string | null;
  fallbackPrompt?: string | null;
  variantIndex: number;
}): string {
  if (explicitTitle && explicitTitle.trim().length > 0) {
    return explicitTitle.trim();
  }

  if (!fallbackPrompt) {
    return `Generated Track ${variantIndex + 1}`;
  }

  const prompt = fallbackPrompt.trim();
  if (prompt.length <= 100) {
    return prompt.length > 0 ? `${prompt}${variantIndex > 0 ? ` (${variantIndex + 1})` : ''}` : `Generated Track ${variantIndex + 1}`;
  }

  const firstSentence = prompt.split(/[.!?]/)[0];
  if (firstSentence && firstSentence.length > 0 && firstSentence.length <= 100) {
    return `${firstSentence.trim()}${variantIndex > 0 ? ` (${variantIndex + 1})` : ''}`;
  }

  return `${prompt.substring(0, 80).trim()}...${variantIndex > 0 ? ` (${variantIndex + 1})` : ''}`;
}

export async function upsertTrackFromProviderResult({
  job,
  normalized,
  providerId,
  variantIndex,
  playlist,
  fallbackPrompt,
  title,
  artist,
  externalIds,
}: UpsertTrackFromProviderResultArgs): Promise<{
  trackId: string;
  r2KeyMp3?: string;
  r2KeyFlac?: string;
  durationSeconds?: number | null;
}> {
  const timestamp = sanitizeTimestamp();
  const playlistPosition = playlist?.position ?? variantIndex;
  const baseKey = playlist?.id
    ? `org_${job.organization_id}/playlist_${playlist.id}/track_${playlistPosition}`
    : `tracks/${job.id}/${timestamp}-${variantIndex}`;

  let r2KeyMp3: string | undefined;
  let r2KeyFlac: string | undefined;

  await Promise.all(
    normalized.audioUrls.map(async (audio) => {
      const format = normalizeFormat(audio.format) ?? 'mp3';
      const extension = format === 'mpeg' ? 'mp3' : format;
      const key = `${baseKey}.${extension}`;
      const contentType = audio.mimeType || inferContentType(format);
      await uploadFromUrl(audio.url, key, { contentType });

      if (!r2KeyMp3 && (format === 'mp3' || format === 'mpeg')) {
        r2KeyMp3 = key;
      }

      if (!r2KeyFlac && (format === 'flac' || format === 'wav')) {
        r2KeyFlac = key;
      }
    })
  );

  const resolvedTitle = generateTitle({
    explicitTitle: title ?? (normalized.metadata as any)?.title,
    fallbackPrompt,
    variantIndex,
  });

  const durationSeconds =
    normalized.metadata?.durationSec ??
    normalized.audioUrls.find((audio) => typeof audio.durationSec === 'number')?.durationSec ??
    null;

  const trackId = await insertTrack({
    organization_id: job.organization_id,
    r2_key_mp3: r2KeyMp3,
    r2_key_flac: r2KeyFlac,
    duration_seconds: durationSeconds,
    job_id: job.id,
    title: resolvedTitle,
    artist: artist ?? 'Lyra AI',
    meta: {
      provider: providerId,
      provider_task_id: externalIds?.providerTaskId ?? job.provider_task_id ?? job.provider_job_id,
      provider_choice_id: externalIds?.providerChoiceId,
      source_conversion_id: externalIds?.sourceConversionId,
      normalized_metadata: normalized.metadata,
    },
    provider_id: providerId,
    blueprint: playlist?.blueprint ?? null,
    source_conversion_id: externalIds?.sourceConversionId ?? null,
  });

  if (playlist?.id) {
    const supabase = getSupabaseAdmin();
    const { error: insertItemError } = await supabase.from('playlist_items').insert({
      playlist_id: playlist.id,
      track_id: trackId,
      position: playlistPosition,
    });

    if (insertItemError) {
      throw new Error(`Failed to add track ${trackId} to playlist ${playlist.id}: ${insertItemError.message}`);
    }

    const { error: statsError } = await supabase.rpc('update_playlist_stats', {
      playlist_uuid: playlist.id,
    });
    if (statsError) {
      console.warn(`[Job ${job.id}] Failed to update playlist stats for ${playlist.id}:`, statsError);
    }
  }

  return {
    trackId,
    r2KeyMp3,
    r2KeyFlac,
    durationSeconds,
  };
}

