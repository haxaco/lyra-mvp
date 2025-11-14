export type ProviderId = 'mureka' | 'musicgpt' | 'suno' | 'musicgen';

export type ProviderDelivery = 'poll' | 'webhook';

export type GenerateParams = {
  prompt: string;
  durationSec?: number;
  energy?: number; // 1..10
  familyFriendly?: boolean;
  lyrics?: string;
  references?: Record<string, any>;
  metadata?: Record<string, any>;
};

export type ProviderPrepareResult = {
  delivery: ProviderDelivery;
  providerTaskId?: string;
  expectedVariants?: number;
  providerConversionIds?: string[];
  raw?: any;
};

export type ProviderPollResult = {
  id?: string;
  url?: string;
  format?: string;
  mimeType?: string;
  durationSec?: number | null;
  metadata?: Record<string, any>;
  raw?: any;
};

export type ProviderNormalizedResult = {
  audioUrls: Array<{
    format: string;
    url: string;
    mimeType?: string;
    durationSec?: number | null;
    sourceId?: string;
  }>;
  metadata: Record<string, any>;
};

export interface MusicProvider {
  id: ProviderId;
  delivery: ProviderDelivery;
  enabled(): Promise<boolean>;
  allowedForB2B(): Promise<boolean>;
  prepare(params: GenerateParams): Promise<ProviderPrepareResult>;
  poll?(providerTaskId: string, providerConversionIds?: string[]): Promise<ProviderPollResult[]>;
  normalize(result: ProviderPollResult | unknown): ProviderNormalizedResult;
}
