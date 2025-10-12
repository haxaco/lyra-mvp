import { NextResponse } from "next/server";
import { supabaseFromAuthHeader } from "@/lib/supabaseFromAuthHeader";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET(req: Request) {
  try {
    const auth = req.headers.get("authorization");
    const supa = auth?.startsWith("Bearer ")
      ? supabaseFromAuthHeader(auth)
      : supabaseServer();
    
    const { data: { user }, error } = await supa.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ ok:false, error: "Unauthorized" }, { status: 401 });
    }

    // Fetch organization membership to get org_id and role
    const { data: membership } = await supa
      .from("user_memberships")
      .select("organization_id, role")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    const response = {
      ok: true,
      user_id: user.id,
      email: user.email,
      organization_id: membership?.organization_id || null,
      role: membership?.role || null,
      user: user, // Include full user object for backward compatibility
    };

    console.log(`[auth/whoami] User ${user.id} (${user.email}) org: ${membership?.organization_id}`);
    return NextResponse.json(response);
  } catch (e: any) {
    console.error('[auth/whoami] Error:', e);
    return NextResponse.json({ ok:false, error: e.message || String(e) }, { status: 500 });
  }
}

