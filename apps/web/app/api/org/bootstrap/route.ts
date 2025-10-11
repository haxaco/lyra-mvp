import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { supabaseFromAuthHeader } from "@/lib/supabaseFromAuthHeader";
import { supabaseServer } from "@/lib/supabaseServer";
import { createClient } from "@supabase/supabase-js";

export async function POST() {
  try {
    const h = headers();
    const authHeader = h.get("authorization");
    const supa = authHeader?.startsWith("Bearer ")
      ? supabaseFromAuthHeader(authHeader)
      : supabaseServer();
    
    const { data: { user } } = await supa.auth.getUser();
    if (!user?.id) return NextResponse.json({ ok:false, error:"Unauthorized" }, { status: 401 });

    // do they already have an org?
    const { data: mem } = await supa
      .from("user_memberships")
      .select("organization_id")
      .eq("user_id", user.id)
      .limit(1);
    if (mem && mem[0]?.organization_id) {
      return NextResponse.json({ ok:true, organization_id: mem[0].organization_id, existed: true });
    }

    // create org + membership with service role
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const { data: org, error: orgErr } = await admin
      .from("organizations")
      .insert([{ name: `${user.email?.split("@")[0] || "Org"} (Lyra)`, created_by: user.id }])
      .select("id")
      .single();
    if (orgErr) throw orgErr;

    const { error: memErr } = await admin
      .from("user_memberships")
      .insert([{ user_id: user.id, organization_id: org.id, role: "owner" }]);
    if (memErr) throw memErr;

    return NextResponse.json({ ok:true, organization_id: org.id, created: true });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e.message || String(e) }, { status: 500 });
  }
}

