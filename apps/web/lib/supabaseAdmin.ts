import { createClient } from "@supabase/supabase-js";
import { env } from './env';

export function supabaseAdmin() {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
      },
    },
  });
}

