import type { MusicProvider, ProviderId } from '@lyra/core';
import { murekaProvider } from './murekaProvider';
import { musicgptProvider, fetchMusicGptConversions } from './musicgptProvider';

const registry: Record<ProviderId, MusicProvider> = {
  mureka: murekaProvider,
  musicgpt: musicgptProvider,
  suno: {
    id: 'suno',
    delivery: 'poll',
    async enabled() {
      return false;
    },
    async allowedForB2B() {
      return false;
    },
    async prepare() {
      throw new Error('Suno provider is not implemented');
    },
    normalize() {
      throw new Error('Suno provider is not implemented');
    },
  },
  musicgen: {
    id: 'musicgen',
    delivery: 'poll',
    async enabled() {
      return false;
    },
    async allowedForB2B() {
      return false;
    },
    async prepare() {
      throw new Error('MusicGen provider is not implemented');
    },
    normalize() {
      throw new Error('MusicGen provider is not implemented');
    },
  },
};

export function getProvider(providerId: ProviderId): MusicProvider {
  const provider = registry[providerId];
  if (!provider) {
    throw new Error(`Unknown provider: ${providerId}`);
  }
  return provider;
}

export function isProviderEnabled(providerId: ProviderId): Promise<boolean> {
  return getProvider(providerId).enabled();
}

export function listProviders(): MusicProvider[] {
  return Object.values(registry);
}

export { murekaProvider } from './murekaProvider';
export { musicgptProvider, fetchMusicGptConversions } from './musicgptProvider';

