import { NextResponse } from "next/server";
import { supabaseFromAuthHeader } from "@/lib/supabaseFromAuthHeader";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  const supa = auth?.startsWith("Bearer ")
    ? supabaseFromAuthHeader(auth)
    : supabaseServer();
  const { data: { user }, error } = await supa.auth.getUser();
  if (error || !user) return NextResponse.json({ ok:false, error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ ok:true, user });
}

