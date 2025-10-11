import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { supabaseFromAuthHeader } from "@/lib/supabaseFromAuthHeader";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    let supa;

    if (authHeader?.startsWith("Bearer ")) {
      // Token mode: act as the user in the token
      supa = supabaseFromAuthHeader(authHeader);
    } else {
      // Cookie mode: act as the user from Supabase cookies
      supa = supabaseServer();
    }

    const { data, error } = await supa
      .from("tracks")
      .select("id, title, duration_seconds, r2_key, created_at, meta")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;
    return NextResponse.json({ ok:true, items: data });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e.message || String(e) }, { status: 500 });
  }
}

