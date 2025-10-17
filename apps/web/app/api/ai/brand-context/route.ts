// apps/web/app/api/ai/brand-context/route.ts
import { NextResponse } from "next/server";
import { loadBrandContext } from "@/lib/ai/brandContext";

// If you already have a helper like getUserAndOrg(), import and use it.
// Placeholder that reads ?orgId= when no auth context is available.
async function getOrgIdFromRequest(req: Request): Promise<string | null> {
  const url = new URL(req.url);
  const q = url.searchParams.get("orgId");
  return q;
}

export async function GET(req: Request) {
  try {
    const orgId = await getOrgIdFromRequest(req);
    if (!orgId) {
      return NextResponse.json(
        { ok: false, error: "Missing orgId (or implement getUserAndOrg())" },
        { status: 400 }
      );
    }

    const ctx = await loadBrandContext(orgId);
    return NextResponse.json({ ok: true, context: ctx });
  } catch (err: any) {
    console.error("[api/ai/brand-context] error", err);
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 });
  }
}
