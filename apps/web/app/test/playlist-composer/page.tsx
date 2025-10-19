"use client";

import { PlaylistComposer } from '@lyra/ui';

export default function PlaylistComposerTestPage() {
  const handlePlaylistGenerated = (playlist: any) => {
    console.log('Generated playlist:', playlist);
    // You can handle the generated playlist here
    // For example, save it to a database, redirect to a playlist view, etc.
  };

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
        />
      </div>
    </div>
  );
}
