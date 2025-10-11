import { NextResponse } from "next/server";
import { supabaseFromAuthHeader } from "@/lib/supabaseFromAuthHeader";

export async function GET(req: Request) {
  const supa = supabaseFromAuthHeader(req.headers.get("authorization"));
  const { data: { user }, error } = await supa.auth.getUser();
  if (error) return NextResponse.json({ ok:false, error: error.message }, { status: 401 });
  return NextResponse.json({ ok:true, user });
}

