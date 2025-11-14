import type { GenerateParams, MusicProvider, ProviderPollResult, ProviderPrepareResult } from '@lyra/core';
import type { MurekaCreateParams } from '../types';
import { createMurekaJob, pollMurekaJob } from '../mureka';

type MurekaMetadata = {
  params?: Record<string, any>;
  expectedVariants?: number;
};

function extractMetadata(params: GenerateParams): MurekaMetadata {
  const metadata = params.metadata ?? {};
  return {
    params: metadata.murekaParams ?? metadata.providerParams ?? {},
    expectedVariants: metadata.expectedVariants ?? metadata.n ?? metadata.providerParams?.n,
  };
}

export const murekaProvider: MusicProvider = {
  id: 'mureka',
  delivery: 'poll',
  async enabled() {
    return true;
  },
  async allowedForB2B() {
    return true;
  },
  async prepare(params: GenerateParams): Promise<ProviderPrepareResult> {
    const { params: rawParams = {}, expectedVariants } = extractMetadata(params);
    const murekaParams = {
      ...rawParams,
      lyrics: (rawParams as MurekaCreateParams).lyrics ?? params.lyrics ?? '[Instrumental only]',
    } as MurekaCreateParams;
    const { providerJobId } = await createMurekaJob(murekaParams);
    return {
      delivery: 'poll',
      providerTaskId: providerJobId,
      expectedVariants: expectedVariants ?? murekaParams.n ?? 2,
      raw: { request: murekaParams },
    };
  },
  async poll(providerTaskId: string, _providerConversionIds?: string[]): Promise<ProviderPollResult[]> {
    const result = await pollMurekaJob(providerTaskId);
    if (result.status === 'failed') {
      throw new Error(result.error || 'Mureka job failed');
    }

    const choices = Array.isArray(result.choices) ? result.choices : [];
    return choices.map((choice, index) => ({
      id: choice.id ?? `${providerTaskId}-${index}`,
      url: choice.url,
      format: 'mp3',
      mimeType: 'audio/mpeg',
      durationSec: typeof choice.duration === 'number' ? Math.round(choice.duration / 1000) : null,
      metadata: {
        flacUrl: choice.flac_url,
        providerTaskId,
        traceId: result.trace_id,
        raw: choice,
        index,
      },
      raw: choice,
    }));
  },
  normalize(result: ProviderPollResult) {
    const audioUrls = [];
    if (result.url) {
      audioUrls.push({
        format: result.format || 'mp3',
        url: result.url,
        mimeType: result.mimeType || 'audio/mpeg',
        durationSec: result.durationSec ?? null,
        sourceId: result.id,
      });
    }

    const flacUrl = result.metadata?.flacUrl;
    if (flacUrl) {
      audioUrls.push({
        format: 'flac',
        url: flacUrl,
        mimeType: 'audio/flac',
        durationSec: result.durationSec ?? null,
        sourceId: result.id ? `${result.id}-flac` : undefined,
      });
    }

    return {
      audioUrls,
      metadata: {
        durationSec: result.durationSec ?? null,
        providerChoiceId: result.id,
        traceId: result.metadata?.traceId,
        index: result.metadata?.index,
        raw: result.raw,
      },
    };
  },
};

