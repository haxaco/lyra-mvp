import { NextResponse } from "next/server";
import { getOrgClientAndId } from "@/lib/org";

/**
 * Mark organization onboarding as complete
 * POST /api/org/onboarding/complete
 */
export async function POST() {
  try {
    const { supa, orgId } = await getOrgClientAndId();

    if (!orgId) {
      return NextResponse.json(
        { error: "No organization found for user" },
        { status: 404 }
      );
    }

    // Update organization to mark onboarding as complete
    const { error } = await supa
      .from("organizations")
      .update({ onboarding_completed_at: new Date().toISOString() })
      .eq("id", orgId);

    if (error) {
      console.error("[onboarding/complete] Error updating organization:", error);
      return NextResponse.json(
        { error: "Failed to mark onboarding as complete" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, orgId });
  } catch (error) {
    console.error("[onboarding/complete] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

