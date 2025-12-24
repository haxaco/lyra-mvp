import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { env } from '@/lib/env';

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');

    if (code) {
      const cookieStore = await cookies();
      
      const supabase = createServerClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch (error) {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
              console.warn('[auth/callback] cookie setAll error (can be ignored):', error);
            }
          },
        },
      });
      
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('[auth/callback] error exchanging code:', error);
        return NextResponse.redirect(`${requestUrl.origin}/login?error=${encodeURIComponent(error.message)}`);
      }

      // Redirect to bootstrap to ensure org/membership exists
      // Bootstrap will read the next URL from a cookie or default to /test/mureka
      return NextResponse.redirect(`${requestUrl.origin}/onboarding/bootstrap`);
    }

    // No code, redirect to login
    return NextResponse.redirect(`${requestUrl.origin}/login`);
  } catch (error: any) {
    console.error('[auth/callback] unexpected error:', error);
    const requestUrl = new URL(request.url);
    const errorMessage = error?.message || 'An unexpected error occurred during authentication';
    return NextResponse.redirect(`${requestUrl.origin}/login?error=${encodeURIComponent(errorMessage)}`);
  }
}

