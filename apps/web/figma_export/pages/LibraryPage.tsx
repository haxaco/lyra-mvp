// Lyra Design System Export — v1.0.0
"use client";

import * as React from "react";
import { Music, Search, Filter, Play, Heart, MoreVertical } from "lucide-react";
import { Button } from "@lyra/ui";
import { Card, CardContent } from "@lyra/ui";
import { Input } from "@lyra/ui";
import { Badge } from "@lyra/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@lyra/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@lyra/ui";
import { cn } from "@lyra/ui";

export interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: string;
  genre: string;
  bpm?: number;
  energy?: number;
  mood?: string;
  isLiked?: boolean;
}

export interface LibraryPageProps {
  /** Songs data */
  songs?: Song[];
  /** Search */
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  /** Filters */
  genreFilter?: string;
  onGenreFilterChange?: (genre: string) => void;
  moodFilter?: string;
  onMoodFilterChange?: (mood: string) => void;
  /** Available filter options */
  genres?: string[];
  moods?: string[];
  /** Actions */
  onSongClick?: (songId: string) => void;
  onSongPlay?: (songId: string) => void;
  onSongLike?: (songId: string) => void;
  onAddToPlaylist?: (songId: string) => void;
  className?: string;
}

export const LibraryPage = React.forwardRef<HTMLDivElement, LibraryPageProps>(
  (
    {
      songs = [],
      searchValue = "",
      onSearchChange,
      genreFilter = "all",
      onGenreFilterChange,
      moodFilter = "all",
      onMoodFilterChange,
      genres = ["All Genres", "Ambient", "Electronic", "Jazz", "Classical", "Lo-Fi"],
      moods = ["All Moods", "Calm", "Energetic", "Happy", "Melancholic", "Uplifting"],
      onSongClick,
      onSongPlay,
      onSongLike,
      onAddToPlaylist,
      className,
    },
    ref
  ) => {
    const filteredSongs = songs.filter((song) => {
      const matchesSearch =
        !searchValue ||
        song.title.toLowerCase().includes(searchValue.toLowerCase()) ||
        song.artist.toLowerCase().includes(searchValue.toLowerCase());
      const matchesGenre =
        genreFilter === "all" ||
        genreFilter === "All Genres" ||
        song.genre === genreFilter;
      const matchesMood =
        moodFilter === "all" ||
        moodFilter === "All Moods" ||
        song.mood === moodFilter;

      return matchesSearch && matchesGenre && matchesMood;
    });

    return (
      <div ref={ref} className={cn("p-6 space-y-6", className)}>
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Music Library</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse all available AI-generated tracks
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search songs or artists..."
              value={searchValue}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange?.(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Genre Filter */}
          <Select value={genreFilter} onValueChange={onGenreFilterChange}>
            <SelectTrigger className="w-full md:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Genre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genres</SelectItem>
              {genres.map((genre) => (
                <SelectItem key={genre} value={genre}>
                  {genre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Mood Filter */}
          <Select value={moodFilter} onValueChange={onMoodFilterChange}>
            <SelectTrigger className="w-full md:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Mood" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Moods</SelectItem>
              {moods.map((mood) => (
                <SelectItem key={mood} value={mood}>
                  {mood}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Results Count */}
        <div className="text-sm text-muted-foreground">
          {filteredSongs.length} {filteredSongs.length === 1 ? "track" : "tracks"}
        </div>

        {/* Songs List */}
        {filteredSongs.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Music className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-medium mb-2">No tracks found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or filters
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 px-4 py-3 text-sm text-muted-foreground border-b bg-muted/30">
                  <div className="col-span-1 text-center">#</div>
                  <div className="col-span-5 md:col-span-4">Title</div>
                  <div className="hidden md:block col-span-3">Artist</div>
                  <div className="col-span-4 md:col-span-2">Genre</div>
                  <div className="hidden md:block col-span-1">BPM</div>
                  <div className="col-span-2 md:col-span-1 text-right">Duration</div>
                  <div className="col-span-0 md:col-span-1"></div>
                </div>

                {/* Songs */}
                {filteredSongs.map((song, index) => (
                  <div
                    key={song.id}
                    className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-muted/50 transition-colors group cursor-pointer"
                    onClick={() => onSongClick?.(song.id)}
                  >
                    {/* Number / Play Button */}
                    <div className="col-span-1 flex items-center justify-center">
                      <span className="group-hover:hidden text-muted-foreground">
                        {index + 1}
                      </span>
                      <button
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          onSongPlay?.(song.id);
                        }}
                        className="hidden group-hover:flex items-center justify-center"
                      >
                        <Play className="h-4 w-4 fill-current" />
                      </button>
                    </div>

                    {/* Title */}
                    <div className="col-span-5 md:col-span-4 flex flex-col justify-center min-w-0">
                      <div className="font-medium truncate">{song.title}</div>
                      <div className="text-sm text-muted-foreground truncate md:hidden">
                        {song.artist}
                      </div>
                    </div>

                    {/* Artist (Desktop) */}
                    <div className="hidden md:flex col-span-3 items-center">
                      <span className="text-sm text-muted-foreground truncate">
                        {song.artist}
                      </span>
                    </div>

                    {/* Genre */}
                    <div className="col-span-4 md:col-span-2 flex items-center">
                      <Badge variant="secondary" className="text-xs">
                        {song.genre}
                      </Badge>
                    </div>

                    {/* BPM (Desktop) */}
                    <div className="hidden md:flex col-span-1 items-center">
                      <span className="text-sm text-muted-foreground">
                        {song.bpm || "-"}
                      </span>
                    </div>

                    {/* Duration */}
                    <div className="col-span-2 md:col-span-1 flex items-center justify-end">
                      <span className="text-sm text-muted-foreground">
                        {song.duration}
                      </span>
                    </div>

                    {/* Actions (Desktop) */}
                    <div className="hidden md:flex col-span-1 items-center justify-end gap-2">
                      <button
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          onSongLike?.(song.id);
                        }}
                        className={cn(
                          "p-2 rounded-md transition-colors",
                          song.isLiked
                            ? "text-red-500 hover:text-red-600"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Heart
                          className={cn(
                            "h-4 w-4",
                            song.isLiked && "fill-current"
                          )}
                        />
                      </button>

                      <DropdownMenu>
                        <DropdownMenuTrigger
                          asChild
                          onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        >
                          <button className="p-2 rounded-md text-muted-foreground hover:text-foreground transition-colors">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              onSongPlay?.(song.id);
                            }}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Play Now
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              onAddToPlaylist?.(song.id);
                            }}
                          >
                            Add to Playlist
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              onSongLike?.(song.id);
                            }}
                          >
                            <Heart className="h-4 w-4 mr-2" />
                            {song.isLiked ? "Unlike" : "Like"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Mobile Actions */}
                    <div className="md:hidden col-span-12 flex items-center gap-2 pt-2">
                      {song.mood && (
                        <Badge variant="outline" className="text-xs">
                          {song.mood}
                        </Badge>
                      )}
                      {song.bpm && (
                        <span className="text-xs text-muted-foreground">
                          {song.bpm} BPM
                        </span>
                      )}
                      {song.energy && (
                        <span className="text-xs text-muted-foreground">
                          Energy: {song.energy}%
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }
);

LibraryPage.displayName = "LibraryPage";
