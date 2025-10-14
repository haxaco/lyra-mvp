import React, { useState, useEffect } from 'react';
import { Button } from '../primitives/button';
import { Slider } from '../primitives/slider';
import { ImageWithFallback } from './figma/ImageWithFallback';
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
  List,
  ChevronDown,
  X
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
  const [isFullScreen, setIsFullScreen] = useState(false);

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

  // Mobile Full Screen Player
  if (isFullScreen) {
    return (
      <div className="fixed inset-0 z-[100] bg-gradient-to-br from-primary via-blush to-secondary md:hidden">
        {/* Close Button */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullScreen(false)}
            className="text-charcoal dark:text-white hover:bg-white/20 h-10 w-10 rounded-full p-0"
          >
            <ChevronDown className="w-6 h-6" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-charcoal dark:text-white hover:bg-white/20 h-10 w-10 rounded-full p-0"
          >
            <MoreHorizontal className="w-6 h-6" />
          </Button>
        </div>

        {/* Album Art */}
        <div className="flex flex-col items-center justify-center h-full px-6 pb-20">
          <div className="w-full max-w-sm aspect-square rounded-3xl overflow-hidden shadow-2xl ring-4 ring-white/20 mb-8">
            <ImageWithFallback 
              src={currentTrack.image || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop'} 
              alt={currentTrack.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Track Info */}
          <div className="w-full max-w-sm text-center mb-6">
            <h2 className="text-2xl font-bold text-charcoal dark:text-white mb-2 truncate">
              {currentTrack.title}
            </h2>
            <p className="text-lg text-charcoal/70 dark:text-white/70 truncate">
              {currentTrack.artist}
            </p>
            {currentTrack.playlistName && (
              <button
                onClick={() => {
                  setIsFullScreen(false);
                  onGoToPlaylist?.({ id: currentTrack.playlistId, title: currentTrack.playlistName });
                }}
                className="text-sm text-charcoal/60 dark:text-white/60 hover:text-charcoal dark:hover:text-white hover:underline mt-2"
              >
                From: {currentTrack.playlistName}
              </button>
            )}
          </div>

          {/* Progress Bar */}
          <div className="w-full max-w-sm mb-4">
            <Slider
              value={[currentTime]}
              onValueChange={handleSeek}
              max={duration}
              step={1}
              className="mb-2"
            />
            <div className="flex justify-between text-sm text-charcoal/70 dark:text-white/70">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="w-full max-w-sm flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsShuffle(!isShuffle)}
              className={`text-charcoal dark:text-white hover:bg-white/20 h-12 w-12 rounded-full p-0 ${isShuffle ? 'text-primary' : ''}`}
            >
              <Shuffle className="w-5 h-5" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-charcoal dark:text-white hover:bg-white/20 h-14 w-14 rounded-full p-0"
            >
              <SkipBack className="w-7 h-7" />
            </Button>
            
            <Button 
              onClick={onPlayPause}
              className="w-20 h-20 rounded-full bg-white text-charcoal hover:scale-105 transition-transform shadow-2xl"
            >
              {isPlaying ? (
                <Pause className="w-10 h-10" />
              ) : (
                <Play className="w-10 h-10 ml-1" />
              )}
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-charcoal dark:text-white hover:bg-white/20 h-14 w-14 rounded-full p-0"
            >
              <SkipForward className="w-7 h-7" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsRepeat(!isRepeat)}
              className={`text-charcoal dark:text-white hover:bg-white/20 h-12 w-12 rounded-full p-0 ${isRepeat ? 'text-primary' : ''}`}
            >
              <Repeat className="w-5 h-5" />
            </Button>
          </div>

          {/* Bottom Actions */}
          <div className="w-full max-w-sm flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsLiked(!isLiked)}
              className="text-charcoal dark:text-white hover:bg-white/20 h-12 w-12 rounded-full p-0"
            >
              <Heart className={`w-6 h-6 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMute}
                className="text-charcoal dark:text-white hover:bg-white/20 h-10 w-10 rounded-full p-0"
              >
                {isMuted || volume[0] === 0 ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </Button>
              <Slider
                value={isMuted ? [0] : volume}
                onValueChange={handleVolumeChange}
                max={100}
                step={1}
                className="w-24"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mobile Mini Player
  return (
    <>
      {/* Desktop/Tablet Full Player */}
      <div className="hidden md:flex h-full items-center justify-between px-4 lg:px-6 gap-4 lg:gap-8">
        {/* Track Info */}
        <div className="flex items-center space-x-3 lg:space-x-4 min-w-0 flex-1">
          <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-lg lg:rounded-xl overflow-hidden flex-shrink-0 shadow-lg ring-2 ring-white/20">
            <ImageWithFallback 
              src={currentTrack.image || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop'} 
              alt={currentTrack.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-medium truncate text-sm lg:text-base text-charcoal dark:text-white">
              {currentTrack.title}
            </h4>
            <p className="text-xs lg:text-sm text-charcoal/70 dark:text-white/70 truncate">
              {currentTrack.artist}
            </p>
            {currentTrack.playlistName && (
              <button
                onClick={() => onGoToPlaylist?.({ id: currentTrack.playlistId, title: currentTrack.playlistName })}
                className="text-xs text-charcoal/60 dark:text-white/60 hover:text-charcoal dark:hover:text-white hover:underline truncate text-left hidden lg:block"
              >
                From: {currentTrack.playlistName}
              </button>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsLiked(!isLiked)}
            className="flex-shrink-0 text-charcoal dark:text-white hover:bg-white/10 h-9 w-9 p-0 hidden md:flex"
          >
            <Heart className={`w-4 lg:w-5 h-4 lg:h-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
          </Button>
        </div>

        {/* Player Controls */}
        <div className="hidden lg:flex flex-col items-center space-y-2 flex-1 max-w-2xl">
          <div className="flex items-center space-x-3 xl:space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsShuffle(!isShuffle)}
              className={`text-charcoal dark:text-white hover:bg-white/10 h-8 w-8 p-0 ${isShuffle ? 'text-primary' : ''}`}
            >
              <Shuffle className="w-3.5 h-3.5" />
            </Button>
            
            <Button variant="ghost" size="sm" className="text-charcoal dark:text-white hover:bg-white/10 h-9 w-9 p-0">
              <SkipBack className="w-4 h-4" />
            </Button>
            
            <Button 
              onClick={onPlayPause}
              className="w-10 h-10 xl:w-12 xl:h-12 rounded-full bg-charcoal dark:bg-white text-white dark:text-charcoal hover:scale-105 transition-transform shadow-lg"
            >
              {isPlaying ? (
                <Pause className="w-4 xl:w-5 h-4 xl:h-5" />
              ) : (
                <Play className="w-4 xl:w-5 h-4 xl:h-5 ml-0.5" />
              )}
            </Button>
            
            <Button variant="ghost" size="sm" className="text-charcoal dark:text-white hover:bg-white/10 h-9 w-9 p-0">
              <SkipForward className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsRepeat(!isRepeat)}
              className={`text-charcoal dark:text-white hover:bg-white/10 h-8 w-8 p-0 ${isRepeat ? 'text-primary' : ''}`}
            >
              <Repeat className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center space-x-2 xl:space-x-3 w-full">
            <span className="text-[10px] xl:text-xs text-charcoal/70 dark:text-white/70 w-8 xl:w-10 text-right">
              {formatTime(currentTime)}
            </span>
            <Slider
              value={[currentTime]}
              onValueChange={handleSeek}
              max={duration}
              step={1}
              className="flex-1"
            />
            <span className="text-[10px] xl:text-xs text-charcoal/70 dark:text-white/70 w-8 xl:w-10">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Tablet Play Button */}
        <div className="flex lg:hidden items-center gap-2">
          <Button 
            onClick={onPlayPause}
            className="w-10 h-10 rounded-full bg-charcoal dark:bg-white text-white dark:text-charcoal hover:scale-105 transition-transform shadow-lg"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 ml-0.5" />
            )}
          </Button>
        </div>

        {/* Volume and Options */}
        <div className="hidden lg:flex items-center space-x-3 xl:space-x-4 flex-1 justify-end">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMute}
              className="text-charcoal dark:text-white hover:bg-white/10 h-8 w-8 p-0"
            >
              {isMuted || volume[0] === 0 ? (
                <VolumeX className="w-3.5 h-3.5" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
            </Button>
            <Slider
              value={isMuted ? [0] : volume}
              onValueChange={handleVolumeChange}
              max={100}
              step={1}
              className="w-20 xl:w-24"
            />
          </div>
          
          {currentTrack.playlistId && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onGoToPlaylist?.({ id: currentTrack.playlistId, title: currentTrack.playlistName })}
              title="Go to Playlist"
              className="text-charcoal dark:text-white hover:bg-white/10 h-8 w-8 p-0"
            >
              <List className="w-3.5 h-3.5" />
            </Button>
          )}
          
          <Button variant="ghost" size="sm" className="text-charcoal dark:text-white hover:bg-white/10 h-8 w-8 p-0">
            <MoreHorizontal className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Mobile Mini Player */}
      <div 
        className="flex md:hidden h-full items-center px-3 gap-3 cursor-pointer"
        onClick={() => setIsFullScreen(true)}
      >
        {/* Track Info */}
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 shadow-md ring-1 ring-white/20">
            <ImageWithFallback 
              src={currentTrack.image || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop'} 
              alt={currentTrack.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-medium truncate text-sm text-charcoal dark:text-white">
              {currentTrack.title}
            </h4>
            <p className="text-xs text-charcoal/70 dark:text-white/70 truncate">
              {currentTrack.artist}
            </p>
          </div>
        </div>

        {/* Mobile Controls */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setIsLiked(!isLiked);
            }}
            className="text-charcoal dark:text-white hover:bg-white/20 h-9 w-9 p-0"
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
          </Button>
          <Button 
            onClick={(e) => {
              e.stopPropagation();
              onPlayPause();
            }}
            className="w-10 h-10 rounded-full bg-charcoal dark:bg-white text-white dark:text-charcoal hover:scale-105 transition-transform shadow-lg"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 ml-0.5" />
            )}
          </Button>
        </div>
      </div>
    </>
  );
};
