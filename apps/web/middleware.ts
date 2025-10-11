import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

const PUBLIC_PATHS = [
  "/login",
  "/auth/callback",
  "/onboarding/bootstrap",
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
  
  // Use the same auth-helpers-nextjs library as API routes for consistency
  const supabase = createMiddlewareClient({ req, res });
  
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    console.log(`[middleware] no session for ${pathname}`);
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  console.log(`[middleware] user ${session.user.id} accessing ${pathname}`);
  return res;
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|assets).*)"],
};

