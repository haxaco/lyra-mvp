/**
 * Central environment variable validation and configuration
 * Server-only module for validating required environment variables
 */

/**
 * Masks sensitive values in error messages (shows first 2 and last 2 characters)
 */
export function mask(value: string): string {
  if (value.length <= 4) return '****';
  return `${value.slice(0, 2)}****${value.slice(-2)}`;
}

/**
 * Requires an environment variable and throws a helpful error if missing
 */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/**
 * Validates and returns a masked version of an environment variable for error messages
 */
export function requireEnvMasked(name: string): string {
  const value = requireEnv(name);
  return mask(value);
}

/**
 * Centralized environment configuration with lazy validation
 * Validation only happens when env is accessed, not at module load time
 */
export const env = {
  // Supabase
  get SUPABASE_URL() { return requireEnv('NEXT_PUBLIC_SUPABASE_URL'); },
  get SUPABASE_ANON_KEY() { return requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'); },
  get SUPABASE_SERVICE_ROLE_KEY() { return requireEnv('SUPABASE_SERVICE_ROLE_KEY'); },
  
  // R2 (Cloudflare)
  get R2_ACCOUNT_ID() { return requireEnv('R2_ACCOUNT_ID'); },
  get R2_BUCKET_NAME() { return requireEnv('R2_BUCKET_NAME'); },
  get R2_ACCESS_KEY_ID() { return requireEnv('R2_ACCESS_KEY_ID'); },
  get R2_SECRET_ACCESS_KEY() { return requireEnv('R2_SECRET_ACCESS_KEY'); },
  
  // Mureka API
  get MUREKA_API_KEY() { return requireEnv('MUREKA_API_KEY'); },

  // MusicGPT (optional, gated via feature flag)
  get MUSICGPT_API_URL() { return process.env.MUSICGPT_API_URL || 'https://api.musicgpt.com/api/public/v1'; },
  get MUSICGPT_API_KEY() { return process.env.MUSICGPT_API_KEY; },
  get ENABLE_PROVIDER_MUSICGPT() { return (process.env.ENABLE_PROVIDER_MUSICGPT || '').toLowerCase() === 'true'; },
  get MUSICGPT_WEBHOOK_SECRET() { return process.env.MUSICGPT_WEBHOOK_SECRET; },
  get PUBLIC_R2_BASE_URL() { return process.env.PUBLIC_R2_BASE_URL; },
  
  // Optional debug overrides
  get DEBUG_USER_ID() { return process.env.DEBUG_USER_ID; },
  get DEBUG_ORG_ID() { return process.env.DEBUG_ORG_ID; },
} as const;

/**
 * Environment helpers
 */
export const isProd = process.env.NODE_ENV === 'production';
export const isDev = process.env.NODE_ENV === 'development';

/**
 * Validates all required environment variables when called
 * Throws descriptive errors with masked sensitive values
 * This is now called lazily when env properties are accessed
 */
export function validateAllEnv() {
  try {
    // Access all required env vars to trigger validation
    const _ = {
      SUPABASE_URL: env.SUPABASE_URL,
      SUPABASE_ANON_KEY: env.SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY,
      R2_ACCOUNT_ID: env.R2_ACCOUNT_ID,
      R2_BUCKET_NAME: env.R2_BUCKET_NAME,
      R2_ACCESS_KEY_ID: env.R2_ACCESS_KEY_ID,
      R2_SECRET_ACCESS_KEY: env.R2_SECRET_ACCESS_KEY,
      MUREKA_API_KEY: env.MUREKA_API_KEY,
      MUSICGPT_FLAG: env.ENABLE_PROVIDER_MUSICGPT,
    };

    if (env.ENABLE_PROVIDER_MUSICGPT) {
      if (!env.MUSICGPT_API_KEY) {
        throw new Error('ENABLE_PROVIDER_MUSICGPT is true but MUSICGPT_API_KEY is not set');
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      // Mask sensitive values in error messages
      const maskedError = error.message
        .replace(/SUPABASE_SERVICE_ROLE_KEY: [^,}]+/g, `SUPABASE_SERVICE_ROLE_KEY: ${mask(process.env.SUPABASE_SERVICE_ROLE_KEY || '')}`)
        .replace(/R2_ACCESS_KEY_ID: [^,}]+/g, `R2_ACCESS_KEY_ID: ${mask(process.env.R2_ACCESS_KEY_ID || '')}`)
        .replace(/R2_SECRET_ACCESS_KEY: [^,}]+/g, `R2_SECRET_ACCESS_KEY: ${mask(process.env.R2_SECRET_ACCESS_KEY || '')}`)
        .replace(/MUREKA_API_KEY: [^,}]+/g, `MUREKA_API_KEY: ${mask(process.env.MUREKA_API_KEY || '')}`)
        .replace(/MUSICGPT_API_KEY: [^,}]+/g, `MUSICGPT_API_KEY: ${mask(process.env.MUSICGPT_API_KEY || '')}`)
        .replace(/MUSICGPT_WEBHOOK_SECRET: [^,}]+/g, `MUSICGPT_WEBHOOK_SECRET: ${mask(process.env.MUSICGPT_WEBHOOK_SECRET || '')}`);
      
      throw new Error(`Environment validation failed: ${maskedError}`);
    }
    throw error;
  }
}
