import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  console.log('[auth/login] endpoint hit');
  try {
    const { email, password } = await req.json();
    console.log(`[auth/login] attempting login for ${email}`);

    if (!email || !password) {
      return NextResponse.json({ ok: false, error: "Missing email or password" }, { status: 400 });
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ ok: false, error: data.error_description || data.error || "Auth failed" }, { status: res.status });
    }

    return NextResponse.json({
      ok: true,
      user: data.user ? { id: data.user.id, email: data.user.email } : null,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      token_type: data.token_type,
    });
  } catch (err: any) {
    console.error("Auth error:", err);
    return NextResponse.json({ ok: false, error: err.message || "Internal error" }, { status: 500 });
  }
}

