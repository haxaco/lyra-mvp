'use client';

import React from 'react';
import { PlaylistLibrary } from '@lyra/ui/dist/components';
import { useRouter } from 'next/navigation';

export default function PlaylistsRoutedPage() {
  const router = useRouter();
  return (
    <div className="px-4 md:px-6 py-6">
      <PlaylistLibrary
        onCreatePlaylist={() => router.push('/compose')}
        onPlayTrack={() => {}}
        onViewPlaylist={(p: any) => router.push(`/playlists/${p.id}`)}
      />
    </div>
  );
}


