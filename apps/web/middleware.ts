import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_PATHS = [
  "/login",
  "/auth/callback",
  "/onboarding/bootstrap",
  "/test-design-system",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Allow all API routes through - they handle their own auth via getSessionOrgId()
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }
  
  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p));
  if (isPublic) return NextResponse.next();

  const res = NextResponse.next();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    // Check for invalid refresh token errors
    if (error) {
      const isInvalidRefreshToken = 
        error.message?.includes('refresh_token_not_found') ||
        error.message?.includes('Invalid Refresh Token') ||
        error.code === 'refresh_token_not_found';
      
      if (isInvalidRefreshToken) {
        console.log(`[middleware] invalid refresh token detected, clearing session for ${pathname}`);
        
        // Clear all Supabase auth cookies by deleting them
        // Supabase uses cookies with patterns like: sb-<project-ref>-auth-token
        req.cookies.getAll().forEach((cookie) => {
          if (cookie.name.includes('supabase') || cookie.name.includes('sb-') || cookie.name.includes('auth-token')) {
            res.cookies.delete(cookie.name);
          }
        });
        
        // Sign out to clear server-side session (this will also clear cookies)
        try {
          await supabase.auth.signOut();
        } catch (signOutErr) {
          // Ignore signOut errors - cookies are already being cleared
          console.warn('[middleware] signOut error (can be ignored):', signOutErr);
        }
        
        const url = req.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("next", pathname);
        return NextResponse.redirect(url);
      }
      
      // For other errors, log and redirect to login
      console.error(`[middleware] auth error for ${pathname}:`, error);
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    
    if (!session) {
      console.log(`[middleware] no session for ${pathname}`);
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    console.log(`[middleware] user ${session.user.id} accessing ${pathname}`);
    return res;
  } catch (err: any) {
    // Handle unexpected errors (like network issues, etc.)
    console.error(`[middleware] unexpected error for ${pathname}:`, err);
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|assets|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot|css|js|json)).*)"],
};

