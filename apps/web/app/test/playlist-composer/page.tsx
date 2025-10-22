"use client";

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useLiveCompose } from '@lyra/sdk';
import dynamic from 'next/dynamic';

// Dynamically import PlaylistComposer with no SSR to prevent hydration issues
const PlaylistComposer = dynamic(
  () => import('@lyra/ui').then(mod => ({ default: mod.PlaylistComposer })),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-gradient-to-br from-[#1A1816] via-[#242220] to-[#1A1816] pb-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/70">Loading Playlist Composer...</p>
        </div>
      </div>
    )
  }
);

export default function PlaylistComposerTestPage() {
  const [orgId, setOrgId] = useState("");
  const [userId, setUserId] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const supabase = createClientComponentClient();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";

  // Use the live compose hook
  const liveComposeState = useLiveCompose({
    baseUrl,
    orgId: orgId || "",
    userId: userId || "",
    debounceMs: 1500,
    onComplete: (blueprints: any[]) => {
      console.log(`🎵 Live composition complete with ${blueprints.length} blueprints`);
    },
  });

  // Load user and organization data
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
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    getUserAndOrg();
  }, [supabase]);

  const handlePlaylistGenerated = (playlist: any) => {
    console.log('Generated playlist:', playlist);
    // You can handle the generated playlist here
    // For example, save it to a database, redirect to a playlist view, etc.
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1A1816] via-[#242220] to-[#1A1816] pb-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/70">Loading authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1A1816] via-[#242220] to-[#1A1816] pb-8 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Authentication Required</h1>
          <p className="text-white/70 mb-6">Please log in to use the Playlist Composer.</p>
          <a 
            href="/login" 
            className="inline-block bg-white text-black px-6 py-3 rounded-lg font-medium hover:bg-white/90 transition-colors"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Playlist Composer Test
          </h1>
          <p className="text-muted-foreground">
            Test the AI-powered PlaylistComposer component with real-time generation and animations.
          </p>
        </div>
        
        <PlaylistComposer 
          onPlaylistGenerated={handlePlaylistGenerated}
          orgId={orgId}
          userId={userId}
          baseUrl={baseUrl}
          liveComposeState={liveComposeState}
        />
      </div>
    </div>
  );
}
