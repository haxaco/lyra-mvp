import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ ok:false, error:"Missing email or password" }, { status: 400 });
    }

    // GoTrue password grant
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const json = await res.json();
    if (!res.ok) {
      return NextResponse.json({ ok:false, error: json.error_description || json.error || "Auth failed" }, { status: res.status });
    }

    // shape a minimal response
    const payload = {
      ok: true,
      user: json.user ? { id: json.user.id, email: json.user.email } : null,
      access_token: json.access_token,
      refresh_token: json.refresh_token,
      expires_in: json.expires_in,
      token_type: json.token_type,
    };
    return NextResponse.json(payload);
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e.message || String(e) }, { status: 500 });
  }
}

