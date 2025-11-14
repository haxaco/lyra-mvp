import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getOrgClientAndId } from "@/lib/org";

/**
 * Mark organization onboarding as complete and save onboarding data
 * POST /api/org/onboarding/complete
 * Body: {
 *   organizationData: { name: string, industry: string, size: string },
 *   brandData: { website: string, instagram: string, facebook: string, twitter: string, description: string }
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const { supa, orgId } = await getOrgClientAndId();

    if (!orgId) {
      return NextResponse.json(
        { error: "No organization found for user" },
        { status: 404 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { organizationData, brandData } = body;

    // Update organization with onboarding data
    const orgUpdate: any = {
      onboarding_completed_at: new Date().toISOString(),
    };

    if (organizationData) {
      if (organizationData.name) orgUpdate.name = organizationData.name;
      if (organizationData.industry) orgUpdate.industry = organizationData.industry;
      if (organizationData.size) orgUpdate.size = organizationData.size;
    }

    const { error: orgError } = await supa
      .from("organizations")
      .update(orgUpdate)
      .eq("id", orgId);

    if (orgError) {
      console.error("[onboarding/complete] Error updating organization:", orgError);
      return NextResponse.json(
        { error: "Failed to mark onboarding as complete" },
        { status: 500 }
      );
    }

    // Save brand data to brand_sources table
    if (brandData) {
      const brandSources = [];

      if (brandData.website) {
        brandSources.push({
          organization_id: orgId,
          type: "website",
          url: brandData.website,
        });
      }

      if (brandData.instagram) {
        const instagramUrl = brandData.instagram.startsWith("@")
          ? `https://instagram.com/${brandData.instagram.slice(1)}`
          : brandData.instagram.startsWith("http")
          ? brandData.instagram
          : `https://instagram.com/${brandData.instagram}`;
        brandSources.push({
          organization_id: orgId,
          type: "instagram",
          url: instagramUrl,
        });
      }

      if (brandData.facebook) {
        brandSources.push({
          organization_id: orgId,
          type: "manual",
          url: brandData.facebook,
        });
      }

      if (brandData.twitter) {
        const twitterUrl = brandData.twitter.startsWith("@")
          ? `https://twitter.com/${brandData.twitter.slice(1)}`
          : brandData.twitter.startsWith("http")
          ? brandData.twitter
          : `https://twitter.com/${brandData.twitter}`;
        brandSources.push({
          organization_id: orgId,
          type: "manual",
          url: twitterUrl,
        });
      }

      if (brandData.description) {
        brandSources.push({
          organization_id: orgId,
          type: "manual",
          raw_text: brandData.description,
        });
      }

      if (brandSources.length > 0) {
        const { error: brandError } = await supa
          .from("brand_sources")
          .insert(brandSources);

        if (brandError) {
          console.error("[onboarding/complete] Error saving brand sources:", brandError);
          // Don't fail the request, just log the error
        }
      }
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

