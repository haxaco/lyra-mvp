import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '../primitives/button';
import { PlaylistCard } from './PlaylistCard';
import { Plus, Search, SlidersHorizontal, Music2 } from 'lucide-react';
import { TextInput } from './TextInput';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../primitives/select';
import { Badge } from '../primitives/badge';

interface Playlist {
  id: string;
  title: string;
  description: string;
  duration: string;
  trackCount: number;
  tags: string[];
  imageUrl?: string;
  createdAt: string;
  lastPlayed?: string;
  r2Key?: string | null;
}

interface PlaylistLibraryProps {
  onCreatePlaylist?: () => void;
  onPlayTrack?: (track: any) => void;
  onViewPlaylist?: (playlist: Playlist) => void;
}

export const PlaylistLibrary: React.FC<PlaylistLibraryProps> = ({
  onCreatePlaylist,
  onPlayTrack,
  onViewPlaylist
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [filterMood, setFilterMood] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  // Fetch playlists from API
  const [allPlaylists, setAllPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        const res = await fetch('/api/playlists', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to load playlists');
        const json = await res.json();
        const items = (json?.items || []) as any[];
        const formatDuration = (seconds?: number | null) => {
          if (!seconds || seconds <= 0) return '—';
          const h = Math.floor(seconds / 3600);
          const m = Math.floor((seconds % 3600) / 60);
          return h > 0 ? `${h}h ${m}m` : `${m}m`;
        };
        const mapped: Playlist[] = items.map((p) => ({
          id: p.id,
          title: p.name,
          description: `AI-generated playlist created on ${new Date(p.created_at).toLocaleDateString()}`,
          duration: formatDuration(p.total_duration_seconds),
          trackCount: p.track_count ?? 0,
          tags: [],
          imageUrl: undefined,
          createdAt: p.created_at,
          lastPlayed: undefined,
          r2Key: p.album_cover_r2_key ?? null,
        }));
        if (isMounted) setAllPlaylists(mapped);
      } catch (e:any) {
        if (isMounted) setLoadError(e?.message || 'Failed to load playlists');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  // Available mood tags
  const moodTags = ['all', 'Energetic', 'Calm', 'Chill', 'Upbeat', 'Jazz', 'Ambient'];

  // Filter and sort playlists
  const filteredPlaylists = allPlaylists
    .filter(playlist => {
      // Search filter
      const matchesSearch = playlist.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           playlist.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Mood filter
      const matchesMood = filterMood === 'all' || playlist.tags.includes(filterMood);
      
      return matchesSearch && matchesMood;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'name':
          return a.title.localeCompare(b.title);
        case 'tracks':
          return b.trackCount - a.trackCount;
        case 'lastPlayed':
          const aDate = a.lastPlayed ? new Date(a.lastPlayed).getTime() : 0;
          const bDate = b.lastPlayed ? new Date(b.lastPlayed).getTime() : 0;
          return bDate - aDate;
        default:
          return 0;
      }
    });

  const handlePlayPlaylist = (playlist: Playlist) => {
    // Mock track data
    const mockTrack = {
      id: `${playlist.id}-track-1`,
      title: `Track from ${playlist.title}`,
      artist: 'Lyra AI',
      duration: '3:45',
      image: playlist.imageUrl,
      playlistId: playlist.id,
      playlistName: playlist.title,
    };
    onPlayTrack?.(mockTrack);
  };

  return (
    <div className="h-full">
      {/* Gradient Hero Header */}
      <div className="relative bg-gradient-to-br from-primary via-[#E6B8C2] to-secondary px-8 py-12 mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent"></div>
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Music2 className="w-6 h-6 text-white" />
                </div>
                <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                  {filteredPlaylists.length} Playlists
                </Badge>
              </div>
              <h1 className="text-white mb-2">Your Playlists</h1>
              <p className="text-white/90 max-w-2xl">
                All your AI-generated playlists in one place. Create custom soundscapes tailored to your business needs.
              </p>
            </div>
            <Button 
              className="bg-white text-primary hover:bg-white/90 shadow-lg"
              onClick={onCreatePlaylist}
            >
              <Plus className="w-4 h-4 mr-2" />
              Generate New Playlist
            </Button>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="px-8 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="flex-1">
            <TextInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search playlists..."
              icon={<Search className="w-4 h-4" />}
            />
          </div>

          {/* Sort */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-48 bg-card border-border">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recently Created</SelectItem>
              <SelectItem value="lastPlayed">Last Played</SelectItem>
              <SelectItem value="name">Name (A-Z)</SelectItem>
              <SelectItem value="tracks">Track Count</SelectItem>
            </SelectContent>
          </Select>

          {/* Filter Toggle */}
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? 'bg-primary/10 border-primary' : ''}
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Mood Filter Tags */}
        {showFilters && (
          <div className="mb-6 p-4 bg-card rounded-lg border border-border">
            <p className="text-muted-foreground mb-3">Filter by mood:</p>
            <div className="flex flex-wrap gap-2">
              {moodTags.map((mood) => (
                <Badge
                  key={mood}
                  variant={filterMood === mood ? 'default' : 'outline'}
                  className={`cursor-pointer transition-all ${
                    filterMood === mood 
                      ? 'bg-primary text-white border-primary' 
                      : 'hover:bg-secondary/50'
                  }`}
                  onClick={() => setFilterMood(mood)}
                >
                  {mood === 'all' ? 'All Moods' : mood}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Playlists Grid */}
      <div className="px-8 pb-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-72 rounded-lg bg-card border border-border animate-pulse" />
            ))}
          </div>
        ) : loadError ? (
          <div className="text-center py-16">
            <h3 className="text-foreground mb-2">Failed to load playlists</h3>
            <p className="text-muted-foreground mb-6">{loadError}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        ) : filteredPlaylists.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-secondary/30 flex items-center justify-center mx-auto mb-4">
              <Music2 className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-foreground mb-2">No playlists found</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery || filterMood !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Create your first playlist to get started'}
            </p>
            <Button onClick={onCreatePlaylist}>
              <Plus className="w-4 h-4 mr-2" />
              Generate New Playlist
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPlaylists.map((playlist) => (
              <PlaylistCard
                key={playlist.id}
                id={playlist.id}
                title={playlist.title}
                description={playlist.description}
                duration={playlist.duration}
                trackCount={playlist.trackCount}
                tags={playlist.tags}
                imageUrl={playlist.imageUrl}
                r2Key={playlist.r2Key}
                onPlay={() => handlePlayPlaylist(playlist)}
                onViewDetails={() => {
                  try {
                    // Helpful debug payload when navigating to details
                    console.log('[PlaylistLibrary] View Details clicked', {
                      id: playlist.id,
                      title: playlist.title,
                      trackCount: playlist.trackCount,
                      duration: playlist.duration,
                      r2Key: playlist.r2Key,
                      createdAt: playlist.createdAt,
                      lastPlayed: playlist.lastPlayed,
                      tags: playlist.tags,
                    });
                  } catch {}
                  onViewPlaylist?.(playlist);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
