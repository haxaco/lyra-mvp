import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const next = requestUrl.searchParams.get('next') || '/test/mureka';

  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('[bootstrap] no user found:', userError);
      return NextResponse.redirect(`${requestUrl.origin}/login`);
    }

    console.log(`[bootstrap] user ${user.id} (${user.email}) checking org/membership`);

    // Check if user already has an organization membership
    const { data: memberships, error: membershipError } = await supabase
      .from('user_memberships')
      .select('organization_id')
      .eq('user_id', user.id)
      .limit(1);

    if (membershipError) {
      console.error('[bootstrap] error checking memberships:', membershipError);
      // Continue anyway - maybe they have one but we can't see it due to RLS
    }

    if (!memberships || memberships.length === 0) {
      console.log(`[bootstrap] creating new org for user ${user.id}`);
      
      // Create organization (use service role for this via API or do it with anon + proper RLS)
      // For now, we'll try with the user's session and hope RLS allows it
      const orgName = user.email?.split('@')[0] || 'My Organization';
      
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert([{
          name: orgName,
          created_by: user.id,
        }])
        .select('id')
        .single();

      if (orgError) {
        console.error('[bootstrap] error creating org:', orgError);
        // If org creation fails, it might already exist or RLS blocks it
        // Try to proceed anyway
      } else if (org) {
        console.log(`[bootstrap] created org ${org.id}`);
        
        // Create membership
        const { error: membershipInsertError } = await supabase
          .from('user_memberships')
          .insert([{
            user_id: user.id,
            organization_id: org.id,
            role: 'owner',
          }]);

        if (membershipInsertError) {
          console.error('[bootstrap] error creating membership:', membershipInsertError);
        } else {
          console.log(`[bootstrap] created membership for user ${user.id} in org ${org.id}`);
        }
      }
    } else {
      console.log(`[bootstrap] user ${user.id} already has membership in org ${memberships[0].organization_id}`);
    }

    // Redirect to original destination
    return NextResponse.redirect(`${requestUrl.origin}${next}`);
  } catch (err: any) {
    console.error('[bootstrap] unexpected error:', err);
    return NextResponse.redirect(`${requestUrl.origin}/login?error=${encodeURIComponent(err.message)}`);
  }
}

