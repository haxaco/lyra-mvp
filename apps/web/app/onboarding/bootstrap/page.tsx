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
        console.log(`[bootstrap] user ${user.id} (${user.email})`);

        // Call server-side bootstrap API to create org/membership with service role
        const response = await fetch('/api/bootstrap', {
          method: 'POST',
        });

        const result = await response.json();

        if (!result.ok) {
          console.error('[bootstrap] error:', result.error);
          setStatus(`Error: ${result.error}`);
          setTimeout(() => router.push('/login'), 2000);
          return;
        }

        if (result.created) {
          console.log(`[bootstrap] created new org ${result.organizationId}`);
        } else {
          console.log(`[bootstrap] user already has org ${result.organizationId}`);
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

