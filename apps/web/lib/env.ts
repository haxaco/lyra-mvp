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
 * Centralized environment configuration with validation
 */
export const env = {
  // Supabase
  SUPABASE_URL: requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
  SUPABASE_ANON_KEY: requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  SUPABASE_SERVICE_ROLE_KEY: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  
  // R2 (Cloudflare)
  R2_ACCOUNT_ID: requireEnv('R2_ACCOUNT_ID'),
  R2_BUCKET_NAME: requireEnv('R2_BUCKET_NAME'),
  R2_ACCESS_KEY_ID: requireEnv('R2_ACCESS_KEY_ID'),
  R2_SECRET_ACCESS_KEY: requireEnv('R2_SECRET_ACCESS_KEY'),
  
  // Mureka API
  MUREKA_API_KEY: requireEnv('MUREKA_API_KEY'),
  
  // Optional debug overrides
  DEBUG_USER_ID: process.env.DEBUG_USER_ID,
  DEBUG_ORG_ID: process.env.DEBUG_ORG_ID,
} as const;

/**
 * Environment helpers
 */
export const isProd = process.env.NODE_ENV === 'production';
export const isDev = process.env.NODE_ENV === 'development';

/**
 * Validates all required environment variables at module load time
 * Throws descriptive errors with masked sensitive values
 */
function validateEnv() {
  try {
    // This will throw if any required env vars are missing
    const _ = env;
  } catch (error) {
    if (error instanceof Error) {
      // Mask sensitive values in error messages
      const maskedError = error.message
        .replace(/SUPABASE_SERVICE_ROLE_KEY: [^,}]+/g, `SUPABASE_SERVICE_ROLE_KEY: ${mask(process.env.SUPABASE_SERVICE_ROLE_KEY || '')}`)
        .replace(/R2_ACCESS_KEY_ID: [^,}]+/g, `R2_ACCESS_KEY_ID: ${mask(process.env.R2_ACCESS_KEY_ID || '')}`)
        .replace(/R2_SECRET_ACCESS_KEY: [^,}]+/g, `R2_SECRET_ACCESS_KEY: ${mask(process.env.R2_SECRET_ACCESS_KEY || '')}`)
        .replace(/MUREKA_API_KEY: [^,}]+/g, `MUREKA_API_KEY: ${mask(process.env.MUREKA_API_KEY || '')}`);
      
      throw new Error(`Environment validation failed: ${maskedError}`);
    }
    throw error;
  }
}

// Validate environment on module load
validateEnv();
