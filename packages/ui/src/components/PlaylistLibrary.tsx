import React, { useState } from 'react';
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

  // Mock playlists data
  const allPlaylists: Playlist[] = [
    {
      id: '1',
      title: 'Morning Energy Boost',
      description: 'Uplifting tracks to start your day with positive vibes',
      duration: '2h 34m',
      trackCount: 42,
      tags: ['Energetic', 'Upbeat', 'Morning'],
      createdAt: '2025-10-09',
      lastPlayed: '2025-10-09',
    },
    {
      id: '2',
      title: 'Focus Flow',
      description: 'Ambient music designed for deep work and concentration',
      duration: '3h 15m',
      trackCount: 38,
      tags: ['Calm', 'Ambient', 'Focus'],
      createdAt: '2025-10-08',
      lastPlayed: '2025-10-08',
    },
    {
      id: '3',
      title: 'Café Lounge Vibes',
      description: 'Smooth jazz and lounge music perfect for cafés',
      duration: '4h 12m',
      trackCount: 56,
      tags: ['Chill', 'Jazz', 'Lounge'],
      createdAt: '2025-10-07',
      lastPlayed: '2025-10-09',
    },
    {
      id: '4',
      title: 'Gym Motivation',
      description: 'High-energy beats to power through your workout',
      duration: '1h 45m',
      trackCount: 28,
      tags: ['Energetic', 'Intense', 'Workout'],
      createdAt: '2025-10-06',
      lastPlayed: '2025-10-07',
    },
    {
      id: '5',
      title: 'Evening Wind Down',
      description: 'Relaxing melodies to help you unwind after a long day',
      duration: '2h 20m',
      trackCount: 35,
      tags: ['Calm', 'Relaxing', 'Evening'],
      createdAt: '2025-10-05',
      lastPlayed: '2025-10-08',
    },
    {
      id: '6',
      title: 'Retail Ambience',
      description: 'Contemporary background music for boutique stores',
      duration: '3h 45m',
      trackCount: 48,
      tags: ['Chill', 'Upbeat', 'Retail'],
      createdAt: '2025-10-04',
      lastPlayed: '2025-10-09',
    },
    {
      id: '7',
      title: 'Spa Serenity',
      description: 'Peaceful soundscapes for wellness and relaxation',
      duration: '5h 00m',
      trackCount: 62,
      tags: ['Calm', 'Peaceful', 'Spa'],
      createdAt: '2025-10-03',
      lastPlayed: '2025-10-06',
    },
    {
      id: '8',
      title: 'Restaurant Elegance',
      description: 'Sophisticated dining music for upscale restaurants',
      duration: '3h 30m',
      trackCount: 44,
      tags: ['Chill', 'Jazz', 'Elegant'],
      createdAt: '2025-10-02',
      lastPlayed: '2025-10-09',
    },
    {
      id: '9',
      title: 'Sunset Grooves',
      description: 'Smooth beats for golden hour relaxation',
      duration: '2h 15m',
      trackCount: 32,
      tags: ['Chill', 'Upbeat', 'Sunset'],
      createdAt: '2025-10-01',
      lastPlayed: '2025-10-05',
    },
  ];

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
        {filteredPlaylists.length === 0 ? (
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
                onPlay={() => handlePlayPlaylist(playlist)}
                onViewDetails={() => onViewPlaylist?.(playlist)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
