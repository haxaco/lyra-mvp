import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../primitives/card';
import { Button } from '../primitives/button';
import { Input } from '../primitives/input';
import { Label } from '../primitives/label';
import { Slider } from '../primitives/slider';
import { Badge } from '../primitives/badge';
import { Textarea } from '../primitives/textarea';
import { Switch } from '../primitives/switch';
import { Play, Plus, X, Wand2, Save, Clock, Music, Zap, Heart } from 'lucide-react';

interface PlaylistBuilderProps {
  onPlayTrack: (track: any) => void;
}

const genreTags = [
  'Pop', 'Rock', 'Jazz', 'Classical', 'Electronic', 'Hip Hop', 'R&B', 'Country',
  'Folk', 'Reggae', 'Blues', 'Funk', 'Soul', 'Ambient', 'Lo-fi', 'Indie',
  'Alternative', 'Punk', 'Metal', 'House', 'Techno', 'Drum & Bass'
];

const moodTags = [
  'Energetic', 'Calm', 'Happy', 'Melancholic', 'Romantic', 'Aggressive',
  'Peaceful', 'Uplifting', 'Dark', 'Dreamy', 'Nostalgic', 'Motivational'
];

export const PlaylistBuilder: React.FC<PlaylistBuilderProps> = ({ onPlayTrack }) => {
  const [playlistName, setPlaylistName] = useState('');
  const [description, setDescription] = useState('');
  const [energy, setEnergy] = useState([65]);
  const [tempo, setTempo] = useState([120]);
  const [danceability, setDanceability] = useState([50]);
  const [valence, setValence] = useState([60]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [duration, setDuration] = useState([60]);
  const [instrumental, setInstrumental] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTracks, setGeneratedTracks] = useState<any[]>([]);

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const toggleMood = (mood: string) => {
    setSelectedMoods(prev => 
      prev.includes(mood) 
        ? prev.filter(m => m !== mood)
        : [...prev, mood]
    );
  };

  const generatePlaylist = async () => {
    setIsGenerating(true);
    
    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mockTracks = [
      {
        id: 1,
        title: 'Ambient Morning',
        artist: 'Lyra AI',
        duration: '3:24',
        energy: energy[0],
        genre: selectedGenres[0] || 'Ambient',
        image: 'https://images.unsplash.com/photo-1718217028088-a23cb3b277c4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtdXNpYyUyMHN0dWRpbyUyMGhlYWRwaG9uZXN8ZW58MXx8fHwxNzU5Nzc0ODczfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
      },
      {
        id: 2,
        title: 'Gentle Flow',
        artist: 'Lyra AI',
        duration: '4:12',
        energy: energy[0] - 10,
        genre: selectedGenres[1] || 'Lo-fi',
        image: 'https://images.unsplash.com/photo-1718217028088-a23cb3b277c4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtdXNpYyUyMHN0dWRpbyUyMGhlYWRwaG9uZXN8ZW58MXx8fHwxNzU5Nzc0ODczfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
      },
      {
        id: 3,
        title: 'Rhythmic Pulse',
        artist: 'Lyra AI',
        duration: '3:45',
        energy: energy[0] + 15,
        genre: selectedGenres[0] || 'Electronic',
        image: 'https://images.unsplash.com/photo-1718217028088-a23cb3b277c4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtdXNpYyUyMHN0dWRpbyUyMGhlYWRwaG9uZXN8ZW58MXx8fHwxNzU5Nzc0ODczfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
      }
    ];
    
    setGeneratedTracks(mockTracks);
    setIsGenerating(false);
  };

  const playTrack = (track: any) => {
    onPlayTrack(track);
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-gradient-lyra p-8 mx-6 rounded-2xl">
        <div>
          <h2 className="text-3xl font-bold mb-2">Playlist Builder</h2>
          <p className="text-muted-foreground text-lg">
            Create the perfect soundtrack for your space with AI-powered music generation.
          </p>
        </div>
      </div>

      <div className="p-6 max-w-6xl mx-auto space-y-6">

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Panel */}
        <div className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Playlist Details</CardTitle>
              <CardDescription>Name and describe your new playlist</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="playlist-name">Playlist Name</Label>
                <Input
                  id="playlist-name"
                  value={playlistName}
                  onChange={(e) => setPlaylistName(e.target.value)}
                  placeholder="e.g., Morning Rush, Lunch Ambience"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the vibe and purpose of this playlist..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Audio Characteristics */}
          <Card>
            <CardHeader>
              <CardTitle>Audio Characteristics</CardTitle>
              <CardDescription>Fine-tune the musical properties</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Energy Level</Label>
                  <span className="text-sm text-muted-foreground">{energy[0]}%</span>
                </div>
                <Slider
                  value={energy}
                  onValueChange={setEnergy}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Calm</span>
                  <span>Energetic</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Tempo (BPM)</Label>
                  <span className="text-sm text-muted-foreground">{tempo[0]}</span>
                </div>
                <Slider
                  value={tempo}
                  onValueChange={setTempo}
                  min={60}
                  max={180}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Slow</span>
                  <span>Fast</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Danceability</Label>
                  <span className="text-sm text-muted-foreground">{danceability[0]}%</span>
                </div>
                <Slider
                  value={danceability}
                  onValueChange={setDanceability}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Positivity</Label>
                  <span className="text-sm text-muted-foreground">{valence[0]}%</span>
                </div>
                <Slider
                  value={valence}
                  onValueChange={setValence}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Melancholic</span>
                  <span>Upbeat</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Duration (minutes)</Label>
                  <span className="text-sm text-muted-foreground">{duration[0]}m</span>
                </div>
                <Slider
                  value={duration}
                  onValueChange={setDuration}
                  min={15}
                  max={180}
                  step={15}
                  className="w-full"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="instrumental">Instrumental Only</Label>
                <Switch
                  id="instrumental"
                  checked={instrumental}
                  onCheckedChange={setInstrumental}
                />
              </div>
            </CardContent>
          </Card>

          {/* Genre Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Genres</CardTitle>
              <CardDescription>Select musical genres to include</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {genreTags.map((genre) => (
                  <Badge
                    key={genre}
                    variant={selectedGenres.includes(genre) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleGenre(genre)}
                  >
                    {genre}
                    {selectedGenres.includes(genre) && (
                      <X className="w-3 h-3 ml-1" />
                    )}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Mood Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Moods</CardTitle>
              <CardDescription>Choose the emotional feel</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {moodTags.map((mood) => (
                  <Badge
                    key={mood}
                    variant={selectedMoods.includes(mood) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleMood(mood)}
                  >
                    {mood}
                    {selectedMoods.includes(mood) && (
                      <X className="w-3 h-3 ml-1" />
                    )}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Button 
            onClick={generatePlaylist} 
            className="w-full" 
            disabled={isGenerating || !playlistName}
          >
            <Wand2 className="w-4 h-4 mr-2" />
            {isGenerating ? 'Generating...' : 'Generate Playlist'}
          </Button>
        </div>

        {/* Preview Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>
                {generatedTracks.length > 0 
                  ? `${generatedTracks.length} tracks generated`
                  : 'Your generated tracks will appear here'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isGenerating ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 animate-pulse">
                    <div className="w-12 h-12 bg-muted rounded-lg"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 animate-pulse">
                    <div className="w-12 h-12 bg-muted rounded-lg"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-2/3"></div>
                      <div className="h-3 bg-muted rounded w-1/3"></div>
                    </div>
                  </div>
                </div>
              ) : generatedTracks.length > 0 ? (
                <div className="space-y-3">
                  {generatedTracks.map((track, index) => (
                    <div key={track.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 group">
                      <div className="relative">
                        <img 
                          src={track.image} 
                          alt={track.title}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="p-1 h-auto"
                            onClick={() => playTrack(track)}
                          >
                            <Play className="w-3 h-3 text-white" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{track.title}</p>
                        <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <Zap className="w-3 h-3" />
                        <span>{track.energy}%</span>
                        <Clock className="w-3 h-3 ml-2" />
                        <span>{track.duration}</span>
                      </div>
                    </div>
                  ))}
                  
                  <div className="pt-4 border-t border-border">
                    <Button className="w-full">
                      <Save className="w-4 h-4 mr-2" />
                      Save Playlist
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Configure your preferences and generate a playlist</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </div>
  );
};