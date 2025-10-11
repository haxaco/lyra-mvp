'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export const dynamic = 'force-dynamic';

export default function BootstrapPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [status, setStatus] = useState('Checking your account...');

  useEffect(() => {
    async function bootstrap() {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          console.error('[bootstrap] no user found:', userError);
          router.push('/login');
          return;
        }

        setStatus('Setting up your organization...');
        console.log(`[bootstrap] user ${user.id} (${user.email}) checking org/membership`);

        // Check if user already has an organization membership
        const { data: memberships, error: membershipError } = await supabase
          .from('user_memberships')
          .select('organization_id')
          .eq('user_id', user.id)
          .limit(1);

        if (membershipError) {
          console.error('[bootstrap] error checking memberships:', membershipError);
        }

        if (!memberships || memberships.length === 0) {
          setStatus('Creating your organization...');
          console.log(`[bootstrap] creating new org for user ${user.id}`);
          
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
            setStatus('Error creating organization. Proceeding anyway...');
            // Proceed anyway - maybe RLS blocks it but they have an org
            await new Promise(r => setTimeout(r, 1000));
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
              setStatus('Error creating membership. Proceeding anyway...');
              await new Promise(r => setTimeout(r, 1000));
            } else {
              console.log(`[bootstrap] created membership for user ${user.id} in org ${org.id}`);
            }
          }
        } else {
          console.log(`[bootstrap] user ${user.id} already has membership in org ${memberships[0].organization_id}`);
        }

        // Redirect to destination
        setStatus('Redirecting...');
        router.push('/test/mureka');
      } catch (err: any) {
        console.error('[bootstrap] unexpected error:', err);
        setStatus(`Error: ${err.message}`);
        setTimeout(() => router.push('/login'), 2000);
      }
    }

    bootstrap();
  }, [router, supabase]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">{status}</p>
      </div>
    </div>
  );
}

