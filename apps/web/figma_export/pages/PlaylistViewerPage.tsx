// Lyra Design System Export — v1.0.0
"use client";

import * as React from "react";
import {
  ArrowLeft,
  Play,
  Pause,
  MoreVertical,
  Edit,
  Trash2,
  Share2,
  Download,
  Clock,
} from "lucide-react@0.487.0";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { cn } from "../../components/ui/utils";

export interface Track {
  id: string;
  title: string;
  artist: string;
  duration: string;
  album?: string;
  isPlaying?: boolean;
}

export interface PlaylistViewerPageProps {
  /** Playlist details */
  playlistName?: string;
  playlistDescription?: string;
  playlistGenres?: string[];
  playlistCoverUrl?: string;
  totalDuration?: string;
  trackCount?: number;
  createdDate?: string;
  /** Tracks */
  tracks?: Track[];
  /** Currently playing track */
  currentTrackId?: string;
  /** Actions */
  onBack?: () => void;
  onPlayAll?: () => void;
  onPlayTrack?: (trackId: string) => void;
  onPauseTrack?: (trackId: string) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
  onDownload?: () => void;
  /** Playing state */
  isPlaying?: boolean;
  className?: string;
}

export const PlaylistViewerPage = React.forwardRef<HTMLDivElement, PlaylistViewerPageProps>(
  (
    {
      playlistName = "Untitled Playlist",
      playlistDescription,
      playlistGenres = [],
      playlistCoverUrl,
      totalDuration = "0:00",
      trackCount = 0,
      createdDate,
      tracks = [],
      currentTrackId,
      onBack,
      onPlayAll,
      onPlayTrack,
      onPauseTrack,
      onEdit,
      onDelete,
      onShare,
      onDownload,
      isPlaying = false,
      className,
    },
    ref
  ) => {
    return (
      <div ref={ref} className={cn("min-h-screen", className)}>
        {/* Hero Section */}
        <div className="bg-gradient-lyra text-foreground">
          <div className="max-w-7xl mx-auto p-6 md:p-8">
            <div className="flex items-start gap-4 mb-4">
              {onBack && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onBack}
                  className="hover:bg-background/10"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
            </div>

            <div className="flex flex-col md:flex-row gap-6 md:gap-8">
              {/* Cover Art */}
              <div className="flex-shrink-0">
                <div className="w-48 h-48 md:w-56 md:h-56 rounded-lg bg-background/20 backdrop-blur-sm shadow-2xl overflow-hidden">
                  {playlistCoverUrl ? (
                    <img
                      src={playlistCoverUrl}
                      alt={playlistName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="64"
                        height="64"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-background/40"
                      >
                        <path d="M9 18V5l12-2v13" />
                        <circle cx="6" cy="18" r="3" />
                        <circle cx="18" cy="16" r="3" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Playlist Info */}
              <div className="flex-1 flex flex-col justify-end">
                <div className="mb-2">
                  <Badge variant="secondary" className="mb-3">
                    Playlist
                  </Badge>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  {playlistName}
                </h1>
                {playlistDescription && (
                  <p className="text-foreground/80 mb-4 max-w-2xl">
                    {playlistDescription}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 mb-4">
                  {playlistGenres.map((genre) => (
                    <Badge key={genre} variant="outline" className="bg-background/10">
                      {genre}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-medium">{trackCount} tracks</span>
                  <span className="text-foreground/60">•</span>
                  <span className="text-foreground/80">{totalDuration}</span>
                  {createdDate && (
                    <>
                      <span className="text-foreground/60">•</span>
                      <span className="text-foreground/80">{createdDate}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 mt-6">
              <Button
                size="lg"
                onClick={onPlayAll}
                className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-5 w-5 mr-2 fill-current" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5 mr-2 fill-current" />
                    Play All
                  </>
                )}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="bg-background/10 border-background/20 hover:bg-background/20"
                  >
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {onEdit && (
                    <DropdownMenuItem onClick={onEdit}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Playlist
                    </DropdownMenuItem>
                  )}
                  {onShare && (
                    <DropdownMenuItem onClick={onShare}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </DropdownMenuItem>
                  )}
                  {onDownload && (
                    <DropdownMenuItem onClick={onDownload}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={onDelete}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Playlist
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Tracks List */}
        <div className="max-w-7xl mx-auto p-6 md:p-8">
          <Card>
            <CardContent className="p-0">
              {tracks.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No tracks in this playlist yet</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {/* Table Header */}
                  <div className="grid grid-cols-12 gap-4 px-4 py-3 text-sm text-muted-foreground border-b">
                    <div className="col-span-1 text-center">#</div>
                    <div className="col-span-6 md:col-span-5">Title</div>
                    <div className="hidden md:block col-span-4">Artist</div>
                    <div className="col-span-4 md:col-span-2 text-right">
                      <Clock className="h-4 w-4 inline" />
                    </div>
                  </div>

                  {/* Tracks */}
                  {tracks.map((track, index) => {
                    const isCurrentTrack = track.id === currentTrackId;
                    const isTrackPlaying = isCurrentTrack && isPlaying;

                    return (
                      <div
                        key={track.id}
                        className={cn(
                          "grid grid-cols-12 gap-4 px-4 py-3 hover:bg-muted/50 transition-colors group cursor-pointer",
                          isCurrentTrack && "bg-muted/30"
                        )}
                        onClick={() =>
                          isTrackPlaying
                            ? onPauseTrack?.(track.id)
                            : onPlayTrack?.(track.id)
                        }
                      >
                        {/* Track Number / Play Button */}
                        <div className="col-span-1 flex items-center justify-center">
                          <span className="group-hover:hidden text-muted-foreground">
                            {isTrackPlaying ? (
                              <span className="text-primary">♫</span>
                            ) : (
                              index + 1
                            )}
                          </span>
                          <Play className="h-4 w-4 hidden group-hover:block fill-current" />
                        </div>

                        {/* Title */}
                        <div className="col-span-6 md:col-span-5 flex flex-col justify-center min-w-0">
                          <div
                            className={cn(
                              "font-medium truncate",
                              isCurrentTrack && "text-primary"
                            )}
                          >
                            {track.title}
                          </div>
                          <div className="text-sm text-muted-foreground truncate md:hidden">
                            {track.artist}
                          </div>
                        </div>

                        {/* Artist (Desktop) */}
                        <div className="hidden md:flex col-span-4 items-center">
                          <span className="text-sm text-muted-foreground truncate">
                            {track.artist}
                          </span>
                        </div>

                        {/* Duration */}
                        <div className="col-span-4 md:col-span-2 flex items-center justify-end">
                          <span className="text-sm text-muted-foreground">
                            {track.duration}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
);

PlaylistViewerPage.displayName = "PlaylistViewerPage";
