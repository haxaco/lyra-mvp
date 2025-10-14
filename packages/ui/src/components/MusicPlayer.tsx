import React, { useState, useEffect } from 'react';
import { Button } from '../primitives/button';
import { Slider } from '../primitives/slider';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  Heart,
  Repeat,
  Shuffle,
  MoreHorizontal,
  List
} from 'lucide-react';

interface MusicPlayerProps {
  currentTrack: any;
  isPlaying: boolean;
  onPlayPause: () => void;
  onGoToPlaylist?: (playlist: any) => void;
}

export const MusicPlayer: React.FC<MusicPlayerProps> = ({ 
  currentTrack, 
  isPlaying, 
  onPlayPause,
  onGoToPlaylist
}) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(204); // 3:24 in seconds
  const [volume, setVolume] = useState([75]);
  const [isMuted, setIsMuted] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying && currentTrack) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= duration) {
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isPlaying, currentTrack, duration]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (value: number[]) => {
    setCurrentTime(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value);
    setIsMuted(value[0] === 0);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  if (!currentTrack) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-charcoal/50 dark:text-white/50 text-sm">No track playing</p>
      </div>
    );
  }

  return (
    <div className="h-full flex items-center justify-between px-6 gap-8">
      {/* Track Info */}
      <div className="flex items-center space-x-4 min-w-0 flex-1">
        <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 shadow-lg ring-2 ring-white/20">
          <img 
            src={currentTrack.image} 
            alt={currentTrack.title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="min-w-0">
          <h4 className="font-medium truncate text-charcoal dark:text-white">{currentTrack.title}</h4>
          <p className="text-sm text-charcoal/70 dark:text-white/70 truncate">{currentTrack.artist}</p>
          {currentTrack.playlistName && (
            <button
              onClick={() => onGoToPlaylist?.({ id: currentTrack.playlistId, title: currentTrack.playlistName })}
              className="text-xs text-charcoal/60 dark:text-white/60 hover:text-charcoal dark:hover:text-white hover:underline truncate text-left"
            >
              From: {currentTrack.playlistName}
            </button>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsLiked(!isLiked)}
          className="flex-shrink-0 text-charcoal dark:text-white hover:bg-white/10"
        >
          <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
        </Button>
      </div>

      {/* Player Controls */}
      <div className="flex flex-col items-center space-y-2 flex-1 max-w-2xl">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsShuffle(!isShuffle)}
            className={`text-charcoal dark:text-white hover:bg-white/10 ${isShuffle ? 'text-primary' : ''}`}
          >
            <Shuffle className="w-4 h-4" />
          </Button>
          
          <Button variant="ghost" size="sm" className="text-charcoal dark:text-white hover:bg-white/10">
            <SkipBack className="w-5 h-5" />
          </Button>
          
          <Button 
            onClick={onPlayPause}
            className="w-12 h-12 rounded-full bg-charcoal dark:bg-white text-white dark:text-charcoal hover:scale-105 transition-transform shadow-lg"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </Button>
          
          <Button variant="ghost" size="sm" className="text-charcoal dark:text-white hover:bg-white/10">
            <SkipForward className="w-5 h-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsRepeat(!isRepeat)}
            className={`text-charcoal dark:text-white hover:bg-white/10 ${isRepeat ? 'text-primary' : ''}`}
          >
            <Repeat className="w-4 h-4" />
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center space-x-3 w-full">
          <span className="text-xs text-charcoal/70 dark:text-white/70 w-10 text-right">
            {formatTime(currentTime)}
          </span>
          <Slider
            value={[currentTime]}
            onValueChange={handleSeek}
            max={duration}
            step={1}
            className="flex-1"
          />
          <span className="text-xs text-charcoal/70 dark:text-white/70 w-10">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Volume and Options */}
      <div className="flex items-center space-x-4 flex-1 justify-end">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMute}
            className="text-charcoal dark:text-white hover:bg-white/10"
          >
            {isMuted || volume[0] === 0 ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </Button>
          <Slider
            value={isMuted ? [0] : volume}
            onValueChange={handleVolumeChange}
            max={100}
            step={1}
            className="w-24 hidden lg:block"
          />
        </div>
        
        {currentTrack.playlistId && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onGoToPlaylist?.({ id: currentTrack.playlistId, title: currentTrack.playlistName })}
            title="Go to Playlist"
            className="text-charcoal dark:text-white hover:bg-white/10 hidden md:flex"
          >
            <List className="w-4 h-4" />
          </Button>
        )}
        
        <Button variant="ghost" size="sm" className="text-charcoal dark:text-white hover:bg-white/10 hidden sm:flex">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};