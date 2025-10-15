import React, { useState } from 'react';
import { Button } from '../primitives/button';
import { Card, CardContent } from '../primitives/card';
import { Badge } from '../primitives/badge';
import { ScrollArea } from '../primitives/scroll-area';
import { 
  Play, 
  Pause, 
  Edit3, 
  Sparkles, 
  Clock, 
  Music, 
  Zap, 
  Heart, 
  MoreHorizontal,
  BarChart3,
  Users,
  TrendingUp,
  SkipForward
} from 'lucide-react';

interface Track {
  id: string;
  title: string;
  duration: string;
  energyLevel: number;
  provider: 'Mureka' | 'MusicGen' | 'Suno';
  isLiked: boolean;
  isPlaying: boolean;
}

interface PlaylistData {
  id: string;
  name: string;
  location: string;
  totalTracks: number;
  totalDuration: string;
  averageEnergy: number;
  hoursStreamed: number;
  skipRate: number;
  likes: number;
  tracks: Track[];
}

// Mock data
const mockPlaylist: PlaylistData = {
  id: '1',
  name: 'Morning Brew Vibes',
  location: 'Downtown Café',
  totalTracks: 47,
  totalDuration: '3h 24m',
  averageEnergy: 6.8,
  hoursStreamed: 142,
  skipRate: 8.2,
  likes: 89,
  tracks: [
    {
      id: '1',
      title: 'Gentle Coffee House Ambience',
      duration: '4:23',
      energyLevel: 5,
      provider: 'Mureka',
      isLiked: true,
      isPlaying: true
    },
    {
      id: '2',
      title: 'Warm Morning Jazz Flow',
      duration: '3:47',
      energyLevel: 6,
      provider: 'Suno',
      isLiked: false,
      isPlaying: false
    },
    {
      id: '3',
      title: 'Acoustic Sunrise Melody',
      duration: '5:12',
      energyLevel: 7,
      provider: 'MusicGen',
      isLiked: true,
      isPlaying: false
    },
    {
      id: '4',
      title: 'Smooth Café Instrumental',
      duration: '4:56',
      energyLevel: 5,
      provider: 'Mureka',
      isLiked: false,
      isPlaying: false
    },
    {
      id: '5',
      title: 'Cozy Morning Atmosphere',
      duration: '6:18',
      energyLevel: 4,
      provider: 'Suno',
      isLiked: true,
      isPlaying: false
    },
    {
      id: '6',
      title: 'Urban Coffee Vibes',
      duration: '3:29',
      energyLevel: 8,
      provider: 'MusicGen',
      isLiked: false,
      isPlaying: false
    }
  ]
};

interface PlaylistViewerProps {
  playlist?: any;
  onPlayTrack?: (track: any) => void;
}

export const PlaylistViewer: React.FC<PlaylistViewerProps> = ({ playlist: passedPlaylist, onPlayTrack }) => {
  // Generate mock tracks if not provided
  const generateMockTracks = (count: number): Track[] => {
    const providers: Array<'Mureka' | 'MusicGen' | 'Suno'> = ['Mureka', 'MusicGen', 'Suno'];
    const trackTitles = [
      'Gentle Coffee House Ambience',
      'Warm Morning Jazz Flow',
      'Acoustic Sunrise Melody',
      'Smooth Afternoon Groove',
      'Cozy Corner Atmosphere',
      'Urban Coffee Vibes',
      'Relaxing Piano Interlude',
      'Mellow Beats Session',
      'Ambient Space Sounds',
      'Tranquil Garden Music',
    ];
    
    return Array.from({ length: Math.min(count, 10) }, (_, i) => ({
      id: `${i + 1}`,
      title: trackTitles[i % trackTitles.length],
      duration: `${Math.floor(Math.random() * 3) + 3}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
      energyLevel: Math.floor(Math.random() * 10) + 1,
      provider: providers[i % providers.length],
      isLiked: Math.random() > 0.7,
      isPlaying: i === 0,
    }));
  };

  // Convert passed playlist to PlaylistData format if needed
  const convertedPlaylist = passedPlaylist ? {
    id: passedPlaylist.id || mockPlaylist.id,
    name: passedPlaylist.title || passedPlaylist.name || mockPlaylist.name,
    location: passedPlaylist.location || 'Your Location',
    totalTracks: passedPlaylist.trackCount || passedPlaylist.totalTracks || mockPlaylist.totalTracks,
    totalDuration: passedPlaylist.duration || passedPlaylist.totalDuration || mockPlaylist.totalDuration,
    averageEnergy: passedPlaylist.averageEnergy || 6.5,
    hoursStreamed: passedPlaylist.hoursStreamed || 100,
    skipRate: passedPlaylist.skipRate || 8.5,
    likes: passedPlaylist.likes || 75,
    tracks: passedPlaylist.tracks || generateMockTracks(passedPlaylist.trackCount || passedPlaylist.totalTracks || 10),
  } : mockPlaylist;

  const [playlist] = useState<PlaylistData>(convertedPlaylist);
  const [currentTrack, setCurrentTrack] = useState<string>('1');
  const [isPlaying, setIsPlaying] = useState(true);

  const getEnergyColor = (level: number) => {
    if (level <= 3) return 'bg-blue-400';
    if (level <= 6) return 'bg-yellow-400';
    return 'bg-red-400';
  };

  const getEnergyEmoji = (level: number) => {
    if (level <= 3) return '😌';
    if (level <= 6) return '🎵';
    return '⚡';
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'Mureka': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
      case 'Suno': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'MusicGen': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const handlePlayTrack = (trackId: string) => {
    setCurrentTrack(trackId);
    setIsPlaying(true);
    
    // Find the track and pass it to the global player
    const track = playlist.tracks.find((t: Track) => t.id === trackId);
    if (track && onPlayTrack) {
      onPlayTrack({
        id: track.id,
        title: track.title,
        artist: 'Lyra AI',
        duration: track.duration,
        image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
        playlistId: playlist.id,
        playlistName: playlist.name,
      });
    }
  };

  const toggleLike = (trackId: string) => {
    // In a real app, this would update the backend
    console.log(`Toggle like for track ${trackId}`);
  };

  return (
    <div className="flex h-full">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar / Header */}
        <div className="p-8 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2 font-['Outfit']">
                {playlist.name}
              </h1>
              <p className="text-xl text-muted-foreground font-medium">
                {playlist.location}
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="hover-coral"
                size="lg"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Playlist
              </Button>
              <Button 
                className="bg-gradient-coral text-white hover:opacity-90 transition-opacity"
                size="lg"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Generate New
              </Button>
            </div>
          </div>
        </div>

        {/* Playlist Summary Card */}
        <div className="px-8 pb-6">
          <Card className="overflow-hidden border-0 shadow-lg">
            <CardContent className="p-0">
              <div className="bg-gradient-to-br from-[#FF6F61] via-[#E6B8C2] to-[#F5CBA7] p-8 text-white relative">
                {/* Subtle music visualization pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="w-full h-full" style={{
                    backgroundImage: `repeating-linear-gradient(
                      45deg,
                      transparent,
                      transparent 10px,
                      rgba(255,255,255,0.1) 10px,
                      rgba(255,255,255,0.1) 20px
                    )`
                  }} />
                </div>
                
                <div className="relative z-10 grid grid-cols-4 gap-8">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Music className="w-5 h-5 mr-2" />
                      <span className="text-sm font-semibold uppercase tracking-wide font-['Inter']">
                        Total Tracks
                      </span>
                    </div>
                    <div className="text-3xl font-bold font-['Outfit']">
                      {playlist.totalTracks}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Clock className="w-5 h-5 mr-2" />
                      <span className="text-sm font-semibold uppercase tracking-wide font-['Inter']">
                        Duration
                      </span>
                    </div>
                    <div className="text-3xl font-bold font-['Outfit']">
                      {playlist.totalDuration}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Zap className="w-5 h-5 mr-2" />
                      <span className="text-sm font-semibold uppercase tracking-wide font-['Inter']">
                        Energy Level
                      </span>
                    </div>
                    <div className="text-3xl font-bold font-['Outfit']">
                      {playlist.averageEnergy}/10
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Heart className="w-5 h-5 mr-2" />
                      <span className="text-sm font-semibold uppercase tracking-wide font-['Inter']">
                        Likes
                      </span>
                    </div>
                    <div className="text-3xl font-bold font-['Outfit']">
                      {playlist.likes}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Track List Section */}
        <div className="flex-1 px-8">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold font-['Outfit'] mb-2">Tracks</h2>
            <p className="text-muted-foreground font-['Inter']">
              {playlist.totalTracks} songs • {playlist.totalDuration}
            </p>
          </div>
          
          <Card className="border-0 shadow-sm">
            <ScrollArea className="h-[400px]">
              <div className="divide-y divide-border/50">
                {playlist.tracks.map((track, index) => (
                  <div 
                    key={track.id}
                    className={`p-4 flex items-center gap-4 hover:bg-secondary/30 transition-colors ${
                      index % 2 === 0 ? 'bg-background' : 'bg-secondary/10'
                    }`}
                  >
                    {/* Play Button */}
                    <Button
                      size="sm"
                      variant={track.id === currentTrack && isPlaying ? "default" : "ghost"}
                      className={`w-10 h-10 rounded-full ${
                        track.id === currentTrack && isPlaying 
                          ? 'bg-gradient-coral text-white hover:opacity-90' 
                          : 'hover:bg-primary/20'
                      }`}
                      onClick={() => handlePlayTrack(track.id)}
                    >
                      {track.id === currentTrack && isPlaying ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>

                    {/* Track Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground font-['Inter'] truncate">
                        {track.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${getProviderColor(track.provider)}`}
                        >
                          {track.provider}
                        </Badge>
                      </div>
                    </div>

                    {/* Duration */}
                    <div className="text-sm text-muted-foreground font-['Inter'] min-w-[50px] text-right">
                      {track.duration}
                    </div>

                    {/* Energy Level */}
                    <div className="flex items-center gap-2 min-w-[80px]">
                      <span className="text-lg">
                        {getEnergyEmoji(track.energyLevel)}
                      </span>
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${getEnergyColor(track.energyLevel)}`} />
                        <span className="text-xs text-muted-foreground font-['Inter']">
                          {track.energyLevel}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className={`w-8 h-8 rounded-full p-0 ${
                          track.isLiked 
                            ? 'text-red-500 hover:text-red-600' 
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                        onClick={() => toggleLike(track.id)}
                      >
                        <Heart className={`w-4 h-4 ${track.isLiked ? 'fill-current' : ''}`} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-8 h-8 rounded-full p-0 text-muted-foreground hover:text-foreground"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </div>
      </div>

      {/* Right-Side Drawer - Playlist Insights */}
      <div className="w-80 border-l border-border/50 bg-secondary/30 p-6">
        <h3 className="text-lg font-semibold font-['Outfit'] mb-6">Playlist Insights</h3>
        
        <div className="space-y-6">
          {/* Hours Streamed */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold font-['Inter'] uppercase tracking-wide">
                    Hours Streamed
                  </span>
                </div>
              </div>
              <div className="text-2xl font-bold font-['Outfit'] text-primary">
                {playlist.hoursStreamed}h
              </div>
              <div className="mt-2 bg-secondary rounded-full h-2">
                <div 
                  className="bg-gradient-coral h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((playlist.hoursStreamed / 200) * 100, 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Skip Rate */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <SkipForward className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-semibold font-['Inter'] uppercase tracking-wide">
                    Skip Rate
                  </span>
                </div>
              </div>
              <div className="text-2xl font-bold font-['Outfit'] text-yellow-600">
                {playlist.skipRate}%
              </div>
              <p className="text-xs text-muted-foreground mt-1 font-['Inter']">
                Lower is better
              </p>
            </CardContent>
          </Card>

          {/* Customer Likes */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-semibold font-['Inter'] uppercase tracking-wide">
                    Customer Likes
                  </span>
                </div>
              </div>
              <div className="text-2xl font-bold font-['Outfit'] text-red-500">
                {playlist.likes}
              </div>
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground font-['Inter']">
                <TrendingUp className="w-3 h-3" />
                +12% this week
              </div>
            </CardContent>
          </Card>

          {/* Audience Reach */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-semibold font-['Inter'] uppercase tracking-wide">
                    Daily Listeners
                  </span>
                </div>
              </div>
              <div className="text-2xl font-bold font-['Outfit'] text-blue-500">
                324
              </div>
              <p className="text-xs text-muted-foreground mt-1 font-['Inter']">
                Unique visitors daily
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Button 
            variant="outline" 
            className="w-full hover-coral"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            View Full Analytics
          </Button>
        </div>
      </div>
    </div>
  );
};