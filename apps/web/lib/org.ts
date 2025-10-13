import { headers } from "next/headers";
import { supabaseFromAuthHeader } from "@/lib/supabaseFromAuthHeader";
import { supabaseServer } from "@/lib/supabaseServer";

export async function getOrgClientAndId() {
  const h = await headers();
  const auth = h.get("authorization");
  const supa = auth?.startsWith("Bearer ")
    ? supabaseFromAuthHeader(auth)
    : await supabaseServer();

  const { data: { user } } = await supa.auth.getUser();
  const userId = user?.id || null;
  if (!userId) return { supa, orgId: null, userId: null };

  const { data: mem, error } = await supa
    .from("user_memberships")
    .select("organization_id")
    .eq("user_id", userId)
    .limit(1);

  const orgId = error ? null : mem?.[0]?.organization_id || null;
  return { supa, orgId, userId };
}

// Legacy helper - kept for backward compatibility
export async function getSessionOrgId(): Promise<string | null> {
  const { orgId } = await getOrgClientAndId();
  return orgId;
}

