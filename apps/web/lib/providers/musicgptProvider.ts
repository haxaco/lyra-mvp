import type { GenerateParams, MusicProvider, ProviderPollResult, ProviderPrepareResult } from '@lyra/core';
import { env } from '../env';

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000';
}

export const musicgptProvider: MusicProvider = {
  id: 'musicgpt',
  delivery: 'poll',
  async enabled() {
    return env.ENABLE_PROVIDER_MUSICGPT && !!env.MUSICGPT_API_KEY;
  },
  async allowedForB2B() {
    return true;
  },
  async prepare(params: GenerateParams): Promise<ProviderPrepareResult> {
    if (!env.ENABLE_PROVIDER_MUSICGPT) {
      throw new Error('MusicGPT provider is disabled. Set ENABLE_PROVIDER_MUSICGPT=true to enable.');
    }

    const apiKey = env.MUSICGPT_API_KEY;
    if (!apiKey) {
      throw new Error('Missing MUSICGPT_API_KEY environment variable');
    }

    const metadata = params.metadata ?? {};
    const providerParamsRaw = metadata.musicgptParams ?? metadata.providerParams ?? {};
    const {
      jobId,
      organizationId,
      playlistId,
      make_instrumental,
      vocal_only,
      music_style,
      voice_id,
      overrides,
      ...restProviderParams
    } = providerParamsRaw as Record<string, any>;
    const expectedVariants = metadata.expectedVariants ?? metadata.n ?? 2;
    const baseAppUrl = getAppUrl().replace(/\/$/, '');
    const webhookUrl = jobId
      ? `${baseAppUrl}/api/providers/musicgpt/webhook?jobId=${encodeURIComponent(jobId)}`
      : `${baseAppUrl}/api/providers/musicgpt/webhook`;
    const providerOverrides =
      overrides && typeof overrides === 'object' ? (overrides as Record<string, any>) : {};

    const baseBody = {
      prompt: params.prompt,
      lyrics: params.lyrics,
      make_instrumental: make_instrumental ?? true,
      vocal_only: vocal_only ?? false,
      music_style,
      voice_id,
      webhook_url: webhookUrl,
      ...restProviderParams,
      ...providerOverrides,
    };

    const body = Object.fromEntries(
      Object.entries(baseBody).filter(([, value]) => value !== undefined)
    );

    const endpoint = `${env.MUSICGPT_API_URL.replace(/\/$/, '')}/MusicAI`;
    console.log('[MusicGPT] POST /MusicAI request', {
      url: endpoint,
      body,
    });

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[MusicGPT] POST /MusicAI error response', {
        url: endpoint,
        status: response.status,
        body: errorText,
      });
      throw new Error(`MusicGPT prepare failed: ${response.status} ${errorText}`);
    }

    const payload = await response.json();
    console.log('[MusicGPT] POST /MusicAI success response', {
      url: endpoint,
      status: response.status,
      payload,
    });
    const taskId = payload?.task_id || payload?.id || payload?.job_id;
    const conversionIds = extractMusicGptConversionIds(payload);
    if (!taskId) {
      throw new Error('MusicGPT response missing task_id');
    }

    return {
      delivery: 'poll',
      providerTaskId: String(taskId),
      expectedVariants: expectedVariants ?? 2,
      providerConversionIds: conversionIds.length ? conversionIds : undefined,
      raw: payload,
    };
  },
  normalize(result: ProviderPollResult) {
    const audioUrls = [];

    if (result.url) {
      audioUrls.push({
        format: result.format || 'mp3',
        url: result.url,
        mimeType: result.mimeType || 'audio/mpeg',
        durationSec: result.durationSec ?? null,
        sourceId: result.metadata?.sourceConversionId || result.id,
      });
    }

    const wavUrl = result.metadata?.wavUrl;
    if (wavUrl) {
      audioUrls.push({
        format: 'wav',
        url: wavUrl,
        mimeType: 'audio/wav',
        durationSec: result.durationSec ?? null,
        sourceId: result.metadata?.sourceConversionId
          ? `${result.metadata.sourceConversionId}-wav`
          : result.id
          ? `${result.id}-wav`
          : undefined,
      });
    }

    return {
      audioUrls,
      metadata: {
        durationSec: result.durationSec ?? null,
        title: result.metadata?.title,
        lyrics: result.metadata?.lyrics,
        sourceConversionId: result.metadata?.sourceConversionId,
        providerChoiceId: result.id,
        raw: result.raw,
      },
    };
  },
  async poll(providerTaskId: string) {
    return fetchMusicGptConversions(providerTaskId);
  },
};

function extractMusicGptConversionIds(payload: any): string[] {
  const ids = new Set<string>();
  if (!payload || typeof payload !== 'object') return [];

  const pushId = (value: unknown) => {
    if (typeof value === 'string' && value.trim().length > 0) {
      ids.add(value.trim());
    }
  };

  pushId(payload.conversion_id || payload.conversionId);

  const extractFromObject = (obj: Record<string, any>) => {
    pushId(obj.conversion_id || obj.conversionId || obj.id);
    Object.keys(obj || {}).forEach((key) => {
      if (/^conversion[_-]?id[_-]?(\d+)$/i.test(key)) {
        pushId(obj[key]);
      }
    });
  };

  const collections = [
    payload.conversion,
    payload.conversions,
    payload.items,
    payload.results,
    payload.data?.conversion,
    payload.data?.conversions,
  ];

  for (const collection of collections) {
    if (!collection) continue;
    if (Array.isArray(collection)) {
      collection.forEach((item) => {
        if (item && typeof item === 'object') {
          extractFromObject(item as Record<string, any>);
        } else {
          pushId(item);
        }
      });
    } else if (typeof collection === 'object') {
      extractFromObject(collection as Record<string, any>);
    } else {
      pushId(collection);
    }
  }

  return Array.from(ids);
}

export async function fetchMusicGptConversions(
  taskId: string,
  conversionIds?: string[]
): Promise<ProviderPollResult[]> {
  if (!env.ENABLE_PROVIDER_MUSICGPT || !env.MUSICGPT_API_KEY) {
    return [];
  }

  const baseUrl = env.MUSICGPT_API_URL.replace(/\/$/, '');
  const authHeader = env.MUSICGPT_API_KEY;
  if (!authHeader) {
    return [];
  }
  const results: ProviderPollResult[] = [];
  const idsToQuery = Array.isArray(conversionIds) ? conversionIds.filter(Boolean) : [];
  const uniqueIds = Array.from(new Set(idsToQuery));

  const fetchByConversionId = async (conversionId: string): Promise<void> => {
    const url = new URL(`${baseUrl}/byId`);
    url.searchParams.set('conversion_id', conversionId);
    url.searchParams.set('conversionType', 'MUSIC_AI');

    console.log('[MusicGPT] GET /byId request', {
      url: url.toString(),
      mode: 'conversion_id',
      conversionId,
      taskId,
    });

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: authHeader,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn('[MusicGPT] GET /byId non-OK response', {
        url: url.toString(),
        status: response.status,
        body: errorText,
      });
      if (response.status === 404) return;
      throw new Error(`MusicGPT fetch byId (conversion ${conversionId}) failed (${response.status}): ${errorText}`);
    }

    const data = await response.json().catch(() => null);
    console.log('[MusicGPT] GET /byId success response', {
      url: url.toString(),
      status: response.status,
      payload: data,
    });
    const conversion = data?.conversion || data?.data?.conversion;
    if (!conversion) return;

    const normalized = Array.isArray(conversion) ? conversion : [conversion];
    normalized.forEach((conv: any) => {
      const expanded = expandMusicGptConversion(taskId, conv);
      expanded.forEach((entry) => results.push(entry));
    });
  };

  if (uniqueIds.length > 0) {
    await Promise.all(uniqueIds.map((conversionId) => fetchByConversionId(conversionId)));
  }

  if (results.length > 0) {
    return results;
  }

  const url = new URL(`${baseUrl}/byId`);
  url.searchParams.set('conversionType', 'MUSIC_AI');
  url.searchParams.set('task_id', taskId);

  console.log('[MusicGPT] GET /byId request', {
    url: url.toString(),
    mode: 'task_id',
    taskId,
  });

  const response = await fetch(url.toString(), {
    method: 'GET',
      headers: {
        Authorization: authHeader,
      },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.warn('[MusicGPT] GET /byId non-OK response', {
      url: url.toString(),
      status: response.status,
      body: errorText,
    });
    if (response.status === 404) {
      return [];
    }
    throw new Error(`MusicGPT fetch byId (task ${taskId}) failed (${response.status}): ${errorText}`);
  }

  const data = await response.json().catch(() => null);
  console.log('[MusicGPT] GET /byId success response', {
    url: url.toString(),
    status: response.status,
    payload: data,
  });
  const conversions = data?.conversion ?? data?.data?.conversion;
  if (!data?.success || !conversions) {
    return results;
  }

  const normalized = Array.isArray(conversions) ? conversions : [conversions];
  normalized.forEach((conv: any) => {
    const expanded = expandMusicGptConversion(taskId, conv);
    expanded.forEach((entry) => results.push(entry));
  });

  return results;
}

function expandMusicGptConversion(
  taskId: string,
  conv: any
): ProviderPollResult[] {
  if (!conv || typeof conv !== 'object') return [];

  const variants: ProviderPollResult[] = [];

  const addVariant = ({
    conversionId,
    audioUrl,
    wavUrl,
    duration,
    title,
    lyrics,
    variantIndex,
  }: {
    conversionId?: string;
    audioUrl?: string;
    wavUrl?: string;
    duration?: number | null;
    title?: string;
    lyrics?: string;
    variantIndex?: number;
  }) => {
    if (!audioUrl || !conversionId) return;
    variants.push({
      id: conversionId,
      url: audioUrl,
      format: audioUrl.toLowerCase().endsWith('.wav') ? 'wav' : 'mp3',
      mimeType: audioUrl.toLowerCase().endsWith('.wav') ? 'audio/wav' : 'audio/mpeg',
      durationSec: typeof duration === 'number' ? Math.round(duration) : null,
      metadata: {
        wavUrl,
        title,
        lyrics,
        variantIndex,
        albumCoverUrl: conv.album_cover_path || conv.album_cover_thumbnail,
        sourceConversionId: conversionId,
        providerTaskId: conv.task_id || taskId,
        status: conv.status,
        prompt: conv.description_prompt || conv.prompt,
        musicStyle: conv.music_style,
        raw: conv,
      },
      raw: conv,
    });
  };

  // Handle numbered variants (conversion_id_1, conversion_path_1, etc.)
  let numberedFound = false;
  for (let i = 1; i <= 8; i += 1) {
    const conversionId =
      conv[`conversion_id_${i}`] ||
      conv[`conversionId_${i}`] ||
      conv[`conversion_uuid_${i}`] ||
      conv[`conversionUuid_${i}`];
    const audioUrl =
      conv[`conversion_path_${i}`] ||
      conv[`conversionPath_${i}`] ||
      conv[`audio_url_${i}`] ||
      conv[`audioUrl_${i}`];
    const wavUrl =
      conv[`conversion_path_wav_${i}`] ||
      conv[`conversionPathWav_${i}`] ||
      conv[`audio_url_wav_${i}`] ||
      conv[`audioUrlWav_${i}`];
    const duration =
      typeof conv[`conversion_duration_${i}`] === 'number'
        ? conv[`conversion_duration_${i}`]
        : typeof conv[`duration_${i}`] === 'number'
        ? conv[`duration_${i}`]
        : null;
    const title = conv[`title_${i}`] || conv.title;
    const lyrics = conv[`lyrics_${i}`] || conv.lyrics;

    if (!conversionId && !audioUrl) {
      continue;
    }

    numberedFound = true;
    addVariant({
      conversionId,
      audioUrl,
      wavUrl,
      duration,
      title,
      lyrics,
      variantIndex: i,
    });
  }

  if (numberedFound) {
    return variants;
  }

  const audioUrl = conv.audio_url || conv.conversion_path || conv.url;
  const wavUrl = conv.audio_url_wav || conv.conversion_path_wav || conv.wav_url;
  const duration =
    typeof conv.duration === 'number'
      ? conv.duration
      : typeof conv.duration_seconds === 'number'
      ? conv.duration_seconds
      : typeof conv.length === 'number'
      ? conv.length
      : null;
  const conversionId =
    conv.conversion_id || conv.conversionId || conv.id || conv.uuid || `${taskId}-0`;

  addVariant({
    conversionId,
    audioUrl,
    wavUrl,
    duration,
    title: conv.title,
    lyrics: conv.lyrics,
    variantIndex: 1,
  });

  return variants;
}

