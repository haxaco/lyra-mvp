import { createClient } from "@supabase/supabase-js";

export function supabaseFromAuthHeader(authHeader?: string | null) {
  const token = (authHeader || "").startsWith("Bearer ")
    ? (authHeader as string).slice(7).trim()
    : null;

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: token ? { headers: { Authorization: `Bearer ${token}` } } : {},
    }
  );
}

