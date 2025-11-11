import { NextResponse, type NextRequest } from 'next/server';
import type { ProviderPollResult } from '@lyra/core';
import { env } from '@/lib/env';
import { getSupabaseAdmin, getJobById, updateJob } from '@/lib/db';
import { getProvider } from '@/lib/providers';
import { upsertTrackFromProviderResult } from '@/lib/providers/upsertTrackFromProviderResult';
import { emitEvent, onChildFinishedUpdateParent } from '@/lib/jobs/runner';

function extractSecret(request: NextRequest): string | null {
  const secretHeader = request.headers.get('x-musicgpt-secret');
  if (secretHeader) return secretHeader.trim();

  const authorization = request.headers.get('authorization');
  if (!authorization) return null;

  const bearerMatch = authorization.match(/^Bearer\s+(.*)$/i);
  if (bearerMatch) return bearerMatch[1].trim();

  return authorization.trim();
}

export async function POST(request: NextRequest) {
  try {
    if (!env.ENABLE_PROVIDER_MUSICGPT) {
      return NextResponse.json({ ok: false, error: 'MusicGPT provider disabled' }, { status: 404 });
    }

    const configuredSecret = env.MUSICGPT_WEBHOOK_SECRET;
    let providedSecret: string | null | undefined = undefined;
    if (configuredSecret) {
      providedSecret = extractSecret(request);
      if (!providedSecret || providedSecret !== configuredSecret) {
        return NextResponse.json({ ok: false, error: 'Invalid webhook signature' }, { status: 401 });
      }
    }

    const jobIdParam = request.nextUrl.searchParams.get('jobId') || undefined;
    const payload = await request.json().catch(() => null);
    if (!payload) {
      return NextResponse.json({ ok: false, error: 'Invalid JSON payload' }, { status: 400 });
    }

    const taskId = payload.task_id || payload.job_id || payload.id;
    console.log('[MusicGPT webhook] Incoming request', {
      jobIdParam,
      hasSecretHeader: providedSecret !== undefined ? Boolean(providedSecret) : undefined,
      taskId: taskId ?? null,
      conversionId: payload.conversion_id || payload.id || null,
      payloadKeys: Object.keys(payload || {}),
    });

    if (!taskId) {
      return NextResponse.json({ ok: false, error: 'Missing task_id in payload' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    let jobRow: any | null = null;
    if (jobIdParam) {
      const { data: jobById, error: jobByIdError } = await supabase
        .from('generation_jobs')
        .select('*')
        .eq('id', jobIdParam)
        .single();
      if (jobByIdError) {
        console.warn(`[MusicGPT webhook] Failed to load job ${jobIdParam} from query:`, jobByIdError);
      } else if (jobById) {
        if (jobById.provider_task_id && jobById.provider_task_id !== taskId) {
          console.warn('[MusicGPT webhook] task_id mismatch for provided jobId', {
            jobIdParam,
            taskId,
            jobProviderTaskId: jobById.provider_task_id,
          });
          return NextResponse.json(
            { ok: false, error: 'task_id mismatch for provided jobId' },
            { status: 409 }
          );
        }
        jobRow = jobById;
      }
    }

    if (!jobRow) {
      const { data: jobByTask, error: jobByTaskError } = await supabase
        .from('generation_jobs')
        .select('*')
        .eq('provider_task_id', taskId)
        .single();

      if (jobByTaskError || !jobByTask) {
        console.warn(`[MusicGPT webhook] Job not found for task ${taskId}:`, jobByTaskError?.message);
        return NextResponse.json({ ok: true, ignored: true, reason: 'Job not found' }, { status: 202 });
      }

      if (jobIdParam && jobIdParam !== jobByTask.id) {
        console.warn('[MusicGPT webhook] jobId mismatch for provided task_id', {
          jobIdParam,
          taskId,
          matchedJobId: jobByTask.id,
        });
        return NextResponse.json(
          { ok: false, error: 'jobId mismatch for provided task_id' },
          { status: 409 }
        );
      }
      jobRow = jobByTask;
    }

    const jobId = jobRow.id as string;
    const job = await getJobById(jobId);
    if (!job) {
      return NextResponse.json({ ok: false, error: 'Job no longer exists' }, { status: 410 });
    }

    console.log('[MusicGPT webhook] Job resolved', {
      jobId,
      provider: job.provider,
      status: job.status,
      expectedVariants: job.expected_variants,
      completedCount: job.completed_count,
    });

    if (job.provider !== 'musicgpt') {
      return NextResponse.json({ ok: false, error: 'Job is not managed by MusicGPT' }, { status: 409 });
    }

    if (job.status === 'succeeded') {
      return NextResponse.json({ ok: true, ignored: true, reason: 'Job already succeeded' });
    }

    const conversionId = payload.conversion_id || payload.id;
    if (!conversionId) {
      return NextResponse.json({ ok: false, error: 'Missing conversion_id in payload' }, { status: 400 });
    }

    // Avoid duplicate inserts for the same conversion
    const { count: existingTracks } = await supabase
      .from('tracks')
      .select('*', { head: true, count: 'exact' })
      .eq('job_id', jobId)
      .eq('source_conversion_id', conversionId);

    if ((existingTracks ?? 0) > 0) {
      return NextResponse.json({ ok: true, ignored: true, reason: 'Conversion already processed' });
    }

    const provider = getProvider('musicgpt');
    const pollResult: ProviderPollResult = {
      id: conversionId,
      url: payload.conversion_path || payload.audio_url,
      format: 'mp3',
      mimeType: 'audio/mpeg',
      durationSec: typeof payload.duration === 'number' ? Math.round(payload.duration) : null,
      metadata: {
        wavUrl: payload.conversion_path_wav || payload.wav_url,
        title: payload.title,
        lyrics: payload.lyrics,
        sourceConversionId: conversionId,
      },
      raw: payload,
    };

    const normalized = provider.normalize(pollResult);

    const variantIndex = job.completed_count ?? 0;
    const upserted = await upsertTrackFromProviderResult({
      job,
      normalized,
      providerId: 'musicgpt',
      variantIndex,
      playlist: job.params?.playlistId
        ? {
            id: job.params.playlistId,
            position: typeof job.params.trackIndex === 'number' ? job.params.trackIndex : variantIndex,
            blueprint: job.params.blueprint,
          }
        : undefined,
      fallbackPrompt: job.params?.prompt ?? job.prompt ?? job.params?.blueprint?.prompt,
      title: normalized.metadata?.title,
      artist: job.params?.artist ?? 'Lyra AI',
      externalIds: {
        providerTaskId: job.provider_task_id ?? job.provider_job_id,
        providerChoiceId: normalized.metadata?.providerChoiceId,
        sourceConversionId: normalized.metadata?.sourceConversionId ?? conversionId,
      },
    });

    const expectedVariants = job.expected_variants ?? job.item_count ?? 2;
    const completedCount = (job.completed_count ?? 0) + 1;
    const progressPct = Math.min(100, Math.round((completedCount * 100) / expectedVariants));

    const updates: Record<string, any> = {
      completed_count: completedCount,
      progress_pct: progressPct,
    };

    let terminal = false;
    if (completedCount >= expectedVariants) {
      updates.status = 'succeeded';
      updates.finished_at = new Date().toISOString();
      terminal = true;
    }

    await updateJob(jobId, updates);

    await emitEvent(jobId, job.organization_id, 'item_succeeded', {
      track_id: upserted.trackId,
      provider_task_id: job.provider_task_id,
      conversion_id: conversionId,
      r2_key_mp3: upserted.r2KeyMp3,
      r2_key_flac: upserted.r2KeyFlac,
      duration: upserted.durationSeconds,
      variant_index: completedCount - 1,
    });

    await emitEvent(jobId, job.organization_id, 'progress', {
      message: `Received MusicGPT variant ${completedCount}/${expectedVariants}`,
      progress_pct: progressPct,
      completed_count: completedCount,
    });

    if (terminal) {
      console.log('[MusicGPT webhook] Job completed via webhook', {
        jobId,
        completedCount,
        expectedVariants,
      });
      await emitEvent(jobId, job.organization_id, 'succeeded', {
        track_count: completedCount,
        message: 'MusicGPT generation completed via webhook',
      });
      if (job.parent_job_id) {
        await onChildFinishedUpdateParent(job.parent_job_id);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[MusicGPT webhook] Error handling webhook:', error);
    const status = error instanceof Error && /signature|payload|task|conversion/.test(error.message.toLowerCase()) ? 400 : 500;
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status }
    );
  }
}

