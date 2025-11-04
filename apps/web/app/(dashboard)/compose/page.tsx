"use client";

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useLiveCompose } from '@lyra/sdk';
import dynamic from 'next/dynamic';

const PlaylistComposer = dynamic(
  () => import('@lyra/ui').then(mod => ({ default: mod.PlaylistComposer })),
  { ssr: false }
);

export default function ComposeRoutedPage() {
  const [orgId, setOrgId] = useState("");
  const [userId, setUserId] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClientComponentClient();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";

  const liveComposeState = useLiveCompose({
    baseUrl,
    orgId: orgId || "",
    userId: userId || "",
    debounceMs: 1500,
  });

  useEffect(() => {
    async function getUserAndOrg() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          const { data: memberships } = await supabase
            .from('user_memberships')
            .select('organization_id')
            .eq('user_id', user.id)
            .limit(1);
          if (memberships && memberships.length > 0) {
            setOrgId(memberships[0].organization_id);
            setIsAuthenticated(true);
          }
        }
      } finally {
        setIsLoading(false);
      }
    }
    getUserAndOrg();
  }, [supabase]);

  if (isLoading) return null;
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <PlaylistComposer 
          orgId={orgId}
          userId={userId}
          baseUrl={baseUrl}
          liveComposeState={liveComposeState}
        />
      </div>
    </div>
  );
}

