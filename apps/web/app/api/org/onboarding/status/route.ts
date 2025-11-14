import { NextResponse } from "next/server";
import { getOrgClientAndId } from "@/lib/org";

/**
 * Get organization onboarding status
 * GET /api/org/onboarding/status
 */
export async function GET() {
  try {
    const { supa, orgId } = await getOrgClientAndId();

    if (!orgId) {
      return NextResponse.json(
        { error: "No organization found for user" },
        { status: 404 }
      );
    }

    // Get organization onboarding status
    const { data, error } = await supa
      .from("organizations")
      .select("onboarding_completed_at")
      .eq("id", orgId)
      .single();

    if (error) {
      console.error("[onboarding/status] Error fetching organization:", error);
      return NextResponse.json(
        { error: "Failed to get onboarding status" },
        { status: 500 }
      );
    }

    const isComplete = !!data?.onboarding_completed_at;

    return NextResponse.json({
      isComplete,
      completedAt: data?.onboarding_completed_at || null,
      orgId,
    });
  } catch (error) {
    console.error("[onboarding/status] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

