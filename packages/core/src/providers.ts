export type GenerateParams = {
  prompt: string;
  durationSec: number;
  energy?: number; // 1..10
  familyFriendly?: boolean;
};

export type GenerateResult = {
  r2Key: string;
  durationSec: number;
  title?: string;
};

export interface MusicProvider {
  id: 'mureka' | 'suno' | 'musicgen';
  enabled(): Promise<boolean>;
  allowedForB2B(): Promise<boolean>;
  generate(params: GenerateParams): Promise<GenerateResult>;
}
