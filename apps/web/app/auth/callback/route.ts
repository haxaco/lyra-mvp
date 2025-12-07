import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
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
}

