import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../primitives/card';
import { Button } from '../primitives/button';
import { Badge } from '../primitives/badge';
import { Play, Clock, Heart, TrendingUp, Music, Users, DollarSign } from 'lucide-react';

interface OverviewProps {
  onPlayTrack: (track: any) => void;
}

const mockPlaylists = [
  {
    id: 1,
    name: 'Morning Energy',
    description: 'Upbeat tracks to start the day',
    tracks: 24,
    duration: '1h 32m',
    genre: 'Pop/Electronic',
    energy: 85,
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop'
  },
  {
    id: 2,
    name: 'Afternoon Focus',
    description: 'Background music for productivity',
    tracks: 18,
    duration: '1h 8m',
    genre: 'Ambient/Lo-fi',
    energy: 45,
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop'
  },
  {
    id: 3,
    name: 'Evening Chill',
    description: 'Relaxing vibes for winding down',
    tracks: 21,
    duration: '1h 24m',
    genre: 'Jazz/Soul',
    energy: 30,
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&h=300&fit=crop'
  }
];

const quickStats = [
  {
    title: 'Hours Streamed',
    value: '127.5',
    change: '+12%',
    icon: Clock,
    color: 'text-primary'
  },
  {
    title: 'Active Playlists',
    value: '8',
    change: '+2',
    icon: Music,
    color: 'text-accent'
  },
  {
    title: 'Customer Satisfaction',
    value: '94%',
    change: '+3%',
    icon: Heart,
    color: 'text-primary'
  },
  {
    title: 'Monthly Cost',
    value: '$89',
    change: '-5%',
    icon: DollarSign,
    color: 'text-accent'
  }
];

export const Overview: React.FC<OverviewProps> = ({ onPlayTrack }) => {
  const [bannerDismissed, setBannerDismissed] = React.useState(false);

  const handlePlayPlaylist = (playlist: any) => {
    const mockTrack = {
      title: `Track from ${playlist.name}`,
      artist: 'Lyra AI',
      album: playlist.name,
      duration: '3:24',
      image: playlist.image,
      playlistId: playlist.id.toString(),
      playlistName: playlist.name,
    };
    onPlayTrack(mockTrack);
  };

  const handlePlayMorningEnergy = () => {
    const morningEnergyPlaylist = mockPlaylists.find(p => p.name === 'Morning Energy');
    if (morningEnergyPlaylist) {
      handlePlayPlaylist(morningEnergyPlaylist);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Section with Gradient - Dismissable */}
      {!bannerDismissed && (
        <div className="relative bg-gradient-coral p-6 md:p-8 rounded-2xl overflow-hidden group">
          {/* Dismiss Button */}
          <button
            onClick={() => setBannerDismissed(true)}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-all opacity-70 hover:opacity-100"
            aria-label="Dismiss banner"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="text-white pr-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Good morning! Ready to set the perfect mood?</h2>
            <p className="text-white/90 text-base md:text-lg mb-4">
              Your AI-curated playlists are ready to enhance your space and delight your customers.
            </p>
            
            {/* Play Morning Energy Button */}
            <Button
              onClick={handlePlayMorningEnergy}
              className="bg-white text-charcoal hover:bg-white/90 hover:scale-105 transition-all shadow-lg mt-2"
            >
              <Play className="w-4 h-4 mr-2" />
              Play Morning Energy
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-6">

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {quickStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <h3 className="text-2xl font-semibold mt-1">{stat.value}</h3>
                    <p className="text-xs text-green-600 mt-1">{stat.change} from last month</p>
                  </div>
                  <Icon className={`w-8 h-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Active Playlists */}
      <Card>
        <CardHeader>
          <CardTitle>Your Active Playlists</CardTitle>
          <CardDescription>
            AI-generated playlists tailored to your brand and customer flow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {mockPlaylists.map((playlist) => (
              <Card key={playlist.id} className="relative group hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="aspect-square bg-gradient-lyra rounded-lg mb-4 relative overflow-hidden">
                    <img 
                      src={playlist.image} 
                      alt={playlist.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button 
                        size="sm" 
                        className="rounded-full"
                        onClick={() => handlePlayPlaylist(playlist)}
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4>{playlist.name}</h4>
                    <p className="text-sm text-muted-foreground">{playlist.description}</p>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{playlist.tracks} tracks</span>
                      <span>{playlist.duration}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs">
                        {playlist.genre}
                      </Badge>
                      <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                        <TrendingUp className="w-3 h-3" />
                        <span>{playlist.energy}% energy</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>What's been happening with your music</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-3 rounded-lg bg-muted/50">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <Play className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">New playlist "Lunch Rush" generated</p>
                <p className="text-xs text-muted-foreground">Based on peak customer hours - 2h ago</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 p-3 rounded-lg bg-muted/50">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <Heart className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">High engagement on "Morning Energy"</p>
                <p className="text-xs text-muted-foreground">96% positive customer feedback - 5h ago</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 p-3 rounded-lg bg-muted/50">
              <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Weekly report ready</p>
                <p className="text-xs text-muted-foreground">Analytics show 15% increase in dwell time - 1d ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
};