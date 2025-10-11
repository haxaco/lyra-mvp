import { supabaseServer } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function getSessionOrgId(): Promise<string | null> {
  const supa = supabaseServer();
  const { data: { user } } = await supa.auth.getUser();
  if (!user?.id) return null;
  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from("user_memberships")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1);
  if (error || !data?.[0]?.organization_id) return null;
  return data[0].organization_id as string;
}

