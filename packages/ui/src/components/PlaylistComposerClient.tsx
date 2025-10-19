"use client";

import dynamic from 'next/dynamic';

// Define the props interface locally to avoid import issues
interface PlaylistComposerProps {
  onPlaylistGenerated?: (playlist: any) => void;
}

// Dynamically import the PlaylistComposer with no SSR
const PlaylistComposer = dynamic(
  () => import('./PlaylistComposer').then(mod => ({ default: mod.PlaylistComposer })),
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
) as React.ComponentType<PlaylistComposerProps>;

export { PlaylistComposer };
export type { PlaylistComposerProps };
