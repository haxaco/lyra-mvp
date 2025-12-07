import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST() {
  try {
    // Get authenticated user from their session cookie
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('[bootstrap] no user found:', userError);
      return NextResponse.json(
        { ok: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    console.log(`[bootstrap] user ${user.id} (${user.email}) checking org/membership`);

    // Use service role for bootstrap operations (bypasses RLS for initial setup)
    // This is appropriate because we're creating the user's FIRST org before they have any memberships
    const admin = supabaseAdmin();
    
    // Check if user already has an organization membership
    const { data: memberships, error: membershipError } = await admin
      .from('user_memberships')
      .select('organization_id')
      .eq('user_id', user.id)
      .limit(1);

    if (membershipError) {
      console.error('[bootstrap] error checking memberships:', membershipError);
      return NextResponse.json(
        { ok: false, error: 'Failed to check memberships', details: membershipError.message },
        { status: 500 }
      );
    }

    if (!memberships || memberships.length === 0) {
      console.log(`[bootstrap] creating new org for user ${user.id}`);
      
      const orgName = user.email?.split('@')[0] || 'My Organization';
      
      // Create organization using service role (bypasses RLS for initial setup)
      const { data: org, error: orgError } = await admin
        .from('organizations')
        .insert([{
          name: orgName,
          created_by: user.id,
        }])
        .select('id')
        .single();

      if (orgError) {
        console.error('[bootstrap] error creating org:', orgError);
        return NextResponse.json(
          { ok: false, error: 'Failed to create organization', details: orgError.message },
          { status: 500 }
        );
      }

      console.log(`[bootstrap] created org ${org.id}`);
      
      // Create membership using service role (bypasses RLS for initial setup)
      const { error: membershipInsertError } = await admin
        .from('user_memberships')
        .insert([{
          user_id: user.id,
          organization_id: org.id,
          role: 'owner',
        }]);

      if (membershipInsertError) {
        console.error('[bootstrap] error creating membership:', membershipInsertError);
        return NextResponse.json(
          { ok: false, error: 'Failed to create membership', details: membershipInsertError.message },
          { status: 500 }
        );
      }

      console.log(`[bootstrap] created membership for user ${user.id} in org ${org.id}`);
      
      return NextResponse.json({
        ok: true,
        created: true,
        organizationId: org.id,
      });
    }

    console.log(`[bootstrap] user ${user.id} already has membership in org ${memberships[0].organization_id}`);
    
    return NextResponse.json({
      ok: true,
      created: false,
      organizationId: memberships[0].organization_id,
    });
  } catch (err: any) {
    console.error('[bootstrap] unexpected error:', err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}

