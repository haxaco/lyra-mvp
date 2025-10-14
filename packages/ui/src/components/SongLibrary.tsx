import React, { useState } from 'react';
import { Button } from '../primitives/button';
import { TextInput } from './TextInput';
import { Badge } from '../primitives/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../primitives/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../primitives/select';
import {
  Play,
  Pause,
  Search,
  SlidersHorizontal,
  Music,
  Heart,
  MoreVertical,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../primitives/dropdown-menu';

interface Song {
  id: string;
  title: string;
  artist: string;
  duration: string;
  genre: string;
  mood: string;
  provider: 'OpenAI' | 'Anthropic' | 'Google AI' | 'Stability AI' | 'Mureka' | 'Suno' | 'MusicGen';
  playlistName: string;
  createdAt: string;
  plays: number;
  liked: boolean;
}

interface SongLibraryProps {
  onPlayTrack?: (track: any) => void;
  songs?: Song[]; // Optional external songs data
  currentTrack?: any; // Currently playing track
  isPlaying?: boolean; // Whether music is currently playing
}

export const SongLibrary: React.FC<SongLibraryProps> = ({ 
  onPlayTrack, 
  songs, 
  currentTrack, 
  isPlaying = false 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMood, setFilterMood] = useState('all');
  const [filterGenre, setFilterGenre] = useState('all');
  const [filterProvider, setFilterProvider] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  // Remove local currentlyPlaying state since we're using props now
  const [likedSongs, setLikedSongs] = useState<Set<string>>(new Set(['1', '3', '7']));

  // Use external songs data if provided, otherwise fallback to mock data
  const allSongs: Song[] = songs || [
    {
      id: '1',
      title: 'Morning Sunlight',
      artist: 'Lyra AI',
      duration: '3:45',
      genre: 'Ambient',
      mood: 'Calm',
      provider: 'OpenAI',
      playlistName: 'Morning Energy Boost',
      createdAt: '2025-10-09',
      plays: 142,
      liked: true,
    },
    {
      id: '2',
      title: 'Focus Flow State',
      artist: 'Lyra AI',
      duration: '4:12',
      genre: 'Electronic',
      mood: 'Focus',
      provider: 'Anthropic',
      playlistName: 'Focus Flow',
      createdAt: '2025-10-09',
      plays: 98,
      liked: false,
    },
    {
      id: '3',
      title: 'Café Jazz Dreams',
      artist: 'Lyra AI',
      duration: '3:28',
      genre: 'Jazz',
      mood: 'Chill',
      provider: 'Google AI',
      playlistName: 'Café Lounge Vibes',
      createdAt: '2025-10-08',
      plays: 215,
      liked: true,
    },
    {
      id: '4',
      title: 'Power Surge',
      artist: 'Lyra AI',
      duration: '2:56',
      genre: 'Electronic',
      mood: 'Energetic',
      provider: 'Stability AI',
      playlistName: 'Gym Motivation',
      createdAt: '2025-10-08',
      plays: 178,
      liked: false,
    },
    {
      id: '5',
      title: 'Evening Twilight',
      artist: 'Lyra AI',
      duration: '4:34',
      genre: 'Ambient',
      mood: 'Calm',
      provider: 'OpenAI',
      playlistName: 'Evening Wind Down',
      createdAt: '2025-10-07',
      plays: 124,
      liked: false,
    },
    {
      id: '6',
      title: 'Boutique Vibes',
      artist: 'Lyra AI',
      duration: '3:15',
      genre: 'Pop',
      mood: 'Upbeat',
      provider: 'Anthropic',
      playlistName: 'Retail Ambience',
      createdAt: '2025-10-07',
      plays: 203,
      liked: false,
    },
    {
      id: '7',
      title: 'Spa Serenity',
      artist: 'Lyra AI',
      duration: '5:22',
      genre: 'Ambient',
      mood: 'Peaceful',
      provider: 'Google AI',
      playlistName: 'Spa Serenity',
      createdAt: '2025-10-06',
      plays: 167,
      liked: true,
    },
    {
      id: '8',
      title: 'Fine Dining',
      artist: 'Lyra AI',
      duration: '4:01',
      genre: 'Classical',
      mood: 'Elegant',
      provider: 'OpenAI',
      playlistName: 'Restaurant Elegance',
      createdAt: '2025-10-06',
      plays: 145,
      liked: false,
    },
    {
      id: '9',
      title: 'Golden Hour Groove',
      artist: 'Lyra AI',
      duration: '3:38',
      genre: 'Jazz',
      mood: 'Chill',
      provider: 'Stability AI',
      playlistName: 'Sunset Grooves',
      createdAt: '2025-10-05',
      plays: 189,
      liked: false,
    },
    {
      id: '10',
      title: 'Workout Beast Mode',
      artist: 'Lyra AI',
      duration: '2:45',
      genre: 'Electronic',
      mood: 'Intense',
      provider: 'Anthropic',
      playlistName: 'Gym Motivation',
      createdAt: '2025-10-05',
      plays: 234,
      liked: false,
    },
    {
      id: '11',
      title: 'Lounge Luxury',
      artist: 'Lyra AI',
      duration: '4:18',
      genre: 'Lounge',
      mood: 'Sophisticated',
      provider: 'Google AI',
      playlistName: 'Café Lounge Vibes',
      createdAt: '2025-10-04',
      plays: 156,
      liked: false,
    },
    {
      id: '12',
      title: 'Morning Meditation',
      artist: 'Lyra AI',
      duration: '6:00',
      genre: 'Ambient',
      mood: 'Peaceful',
      provider: 'OpenAI',
      playlistName: 'Spa Serenity',
      createdAt: '2025-10-04',
      plays: 112,
      liked: false,
    },
  ];

  // Filter options
  const moodOptions = ['all', 'Calm', 'Energetic', 'Chill', 'Focus', 'Peaceful', 'Upbeat', 'Intense', 'Elegant', 'Sophisticated'];
  const genreOptions = ['all', 'Ambient', 'Electronic', 'Jazz', 'Pop', 'Classical', 'Lounge'];
  const providerOptions = ['all', 'OpenAI', 'Anthropic', 'Google AI', 'Stability AI', 'Mureka', 'Suno', 'MusicGen'];

  // Provider badge colors
  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'OpenAI':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'Anthropic':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Google AI':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Stability AI':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'Mureka':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'Suno':
        return 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400';
      case 'MusicGen':
        return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  // Filter songs
  const filteredSongs = allSongs.filter((song) => {
    const matchesSearch =
      song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.playlistName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesMood = filterMood === 'all' || song.mood === filterMood;
    const matchesGenre = filterGenre === 'all' || song.genre === filterGenre;
    const matchesProvider = filterProvider === 'all' || song.provider === filterProvider;

    return matchesSearch && matchesMood && matchesGenre && matchesProvider;
  });

  const handlePlay = (song: Song) => {
    // If this is the currently playing track and it's playing, pause it
    if (currentTrack?.id === song.id && isPlaying) {
      // Call onPlayTrack with null to signal pause
      onPlayTrack?.(null);
    } else {
      // Otherwise, play this track
      onPlayTrack?.({
        id: song.id,
        title: song.title,
        artist: song.artist,
        duration: song.duration,
        image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
        playlistId: song.id, // Use song id as playlistId since it's not in the Song interface
        playlistName: song.playlistName,
      });
    }
  };

  const toggleLike = (songId: string) => {
    const newLiked = new Set(likedSongs);
    if (newLiked.has(songId)) {
      newLiked.delete(songId);
    } else {
      newLiked.add(songId);
    }
    setLikedSongs(newLiked);
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
                  <Music className="w-6 h-6 text-white" />
                </div>
                <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                  {filteredSongs.length} Tracks
                </Badge>
              </div>
              <h1 className="text-white mb-2">Song Library</h1>
              <p className="text-white/90 max-w-2xl">
                Browse and search through all your AI-generated tracks. Filter by mood, genre, and provider.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="px-8 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="flex-1">
            <TextInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by track, artist, or playlist..."
              icon={<Search className="w-4 h-4" />}
            />
          </div>

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

        {/* Filter Controls */}
        {showFilters && (
          <div className="mb-6 p-6 bg-card rounded-lg border border-border space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Mood Filter */}
              <div>
                <label className="text-muted-foreground mb-2 block">Mood</label>
                <Select value={filterMood} onValueChange={setFilterMood}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="All Moods" />
                  </SelectTrigger>
                  <SelectContent>
                    {moodOptions.map((mood) => (
                      <SelectItem key={mood} value={mood}>
                        {mood === 'all' ? 'All Moods' : mood}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Genre Filter */}
              <div>
                <label className="text-muted-foreground mb-2 block">Genre</label>
                <Select value={filterGenre} onValueChange={setFilterGenre}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="All Genres" />
                  </SelectTrigger>
                  <SelectContent>
                    {genreOptions.map((genre) => (
                      <SelectItem key={genre} value={genre}>
                        {genre === 'all' ? 'All Genres' : genre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Provider Filter */}
              <div>
                <label className="text-muted-foreground mb-2 block">AI Provider</label>
                <Select value={filterProvider} onValueChange={setFilterProvider}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="All Providers" />
                  </SelectTrigger>
                  <SelectContent>
                    {providerOptions.map((provider) => (
                      <SelectItem key={provider} value={provider}>
                        {provider === 'all' ? 'All Providers' : provider}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active Filters Summary */}
            {(filterMood !== 'all' || filterGenre !== 'all' || filterProvider !== 'all') && (
              <div className="flex items-center gap-2 pt-2">
                <span className="text-muted-foreground">Active filters:</span>
                {filterMood !== 'all' && (
                  <Badge variant="secondary" className="cursor-pointer" onClick={() => setFilterMood('all')}>
                    {filterMood} ✕
                  </Badge>
                )}
                {filterGenre !== 'all' && (
                  <Badge variant="secondary" className="cursor-pointer" onClick={() => setFilterGenre('all')}>
                    {filterGenre} ✕
                  </Badge>
                )}
                {filterProvider !== 'all' && (
                  <Badge variant="secondary" className="cursor-pointer" onClick={() => setFilterProvider('all')}>
                    {filterProvider} ✕
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFilterMood('all');
                    setFilterGenre('all');
                    setFilterProvider('all');
                  }}
                >
                  Clear all
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Songs Table */}
      <div className="px-8 pb-8">
        {filteredSongs.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-secondary/30 flex items-center justify-center mx-auto mb-4">
              <Music className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-foreground mb-2">No tracks found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/20 hover:bg-secondary/20">
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Playlist</TableHead>
                  <TableHead>Genre</TableHead>
                  <TableHead>Mood</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Plays</TableHead>
                  <TableHead className="w-12"></TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSongs.map((song, index) => (
                  <TableRow
                    key={song.id}
                    className={`transition-colors ${
                      currentTrack?.id === song.id && isPlaying
                        ? 'bg-primary/10 border-l-4 border-l-primary'
                        : index % 2 === 0 
                        ? 'bg-[#FAF9F7] dark:bg-card' 
                        : 'bg-background'
                    } hover:bg-secondary/30`}
                  >
                    {/* Play Button */}
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-full hover:bg-primary/20"
                        onClick={() => handlePlay(song)}
                      >
                        {currentTrack?.id === song.id && isPlaying ? (
                          <Pause className="w-4 h-4 text-primary" />
                        ) : (
                          <Play className="w-4 h-4 text-primary" />
                        )}
                      </Button>
                    </TableCell>

                    {/* Title & Artist */}
                    <TableCell>
                      <div>
                        <p className="text-foreground">{song.title}</p>
                        <p className="text-muted-foreground">{song.artist}</p>
                      </div>
                    </TableCell>

                    {/* Playlist */}
                    <TableCell>
                      <p className="text-muted-foreground">{song.playlistName}</p>
                    </TableCell>

                    {/* Genre */}
                    <TableCell>
                      <Badge variant="outline" className="border-primary/30 text-foreground">
                        {song.genre}
                      </Badge>
                    </TableCell>

                    {/* Mood */}
                    <TableCell>
                      <Badge variant="secondary" className="bg-secondary/50 text-secondary-foreground">
                        {song.mood}
                      </Badge>
                    </TableCell>

                    {/* Provider */}
                    <TableCell>
                      <Badge className={getProviderColor(song.provider)}>{song.provider}</Badge>
                    </TableCell>

                    {/* Duration */}
                    <TableCell>
                      <p className="text-muted-foreground">{song.duration}</p>
                    </TableCell>

                    {/* Plays */}
                    <TableCell>
                      <p className="text-muted-foreground">{song.plays}</p>
                    </TableCell>

                    {/* Like Button */}
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => toggleLike(song.id)}
                      >
                        <Heart
                          className={`w-4 h-4 transition-colors ${
                            likedSongs.has(song.id)
                              ? 'fill-primary text-primary'
                              : 'text-muted-foreground hover:text-primary'
                          }`}
                        />
                      </Button>
                    </TableCell>

                    {/* More Options */}
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm transition-all hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0">
                          <MoreVertical className="w-4 h-4 text-muted-foreground" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handlePlay(song)}>
                            <Play className="w-4 h-4 mr-2" />
                            Play Track
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Music className="w-4 h-4 mr-2" />
                            Add to Playlist
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Heart className="w-4 h-4 mr-2" />
                            {likedSongs.has(song.id) ? 'Unlike' : 'Like'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Results Summary */}
        {filteredSongs.length > 0 && (
          <div className="mt-4 text-center text-muted-foreground">
            Showing {filteredSongs.length} of {allSongs.length} tracks
          </div>
        )}
      </div>
    </div>
  );
};
