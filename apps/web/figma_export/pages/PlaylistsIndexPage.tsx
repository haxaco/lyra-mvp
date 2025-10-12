// Lyra Design System Export — v1.0.0
"use client";

import * as React from "react";
import { Music, Plus, Search, Grid, List, Play, MoreVertical } from "lucide-react";
import { Button } from "@lyra/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@lyra/ui";
import { Input } from "@lyra/ui";
import { Badge } from "@lyra/ui";
import { Tabs, TabsList, TabsTrigger } from "@lyra/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@lyra/ui";
import { cn } from "@lyra/ui";

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  genre: string;
  trackCount: number;
  duration: string;
  coverUrl?: string;
  status: "active" | "draft" | "scheduled";
  createdAt?: string;
  updatedAt?: string;
}

export interface PlaylistsIndexPageProps {
  /** Playlists data */
  playlists?: Playlist[];
  /** Search */
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  /** View mode */
  viewMode?: "grid" | "list";
  onViewModeChange?: (mode: "grid" | "list") => void;
  /** Filter */
  filter?: "all" | "active" | "draft" | "scheduled";
  onFilterChange?: (filter: "all" | "active" | "draft" | "scheduled") => void;
  /** Actions */
  onCreatePlaylist?: () => void;
  onPlaylistClick?: (playlistId: string) => void;
  onPlaylistPlay?: (playlistId: string) => void;
  onPlaylistEdit?: (playlistId: string) => void;
  onPlaylistDelete?: (playlistId: string) => void;
  className?: string;
}

export const PlaylistsIndexPage = React.forwardRef<HTMLDivElement, PlaylistsIndexPageProps>(
  (
    {
      playlists = [],
      searchValue = "",
      onSearchChange,
      viewMode = "grid",
      onViewModeChange,
      filter = "all",
      onFilterChange,
      onCreatePlaylist,
      onPlaylistClick,
      onPlaylistPlay,
      onPlaylistEdit,
      onPlaylistDelete,
      className,
    },
    ref
  ) => {
    const filteredPlaylists =
      filter === "all"
        ? playlists
        : playlists.filter((p) => p.status === filter);

    const searchedPlaylists = searchValue
      ? filteredPlaylists.filter(
          (p) =>
            p.name.toLowerCase().includes(searchValue.toLowerCase()) ||
            p.genre.toLowerCase().includes(searchValue.toLowerCase())
        )
      : filteredPlaylists;

    const getStatusColor = (status: Playlist["status"]) => {
      switch (status) {
        case "active":
          return "default";
        case "draft":
          return "outline";
        case "scheduled":
          return "secondary";
        default:
          return "outline";
      }
    };

    return (
      <div ref={ref} className={cn("p-6 space-y-6", className)}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Playlists</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your AI-generated music playlists
            </p>
          </div>
          <Button onClick={onCreatePlaylist} size="lg">
            <Plus className="h-4 w-4 mr-2" />
            Create Playlist
          </Button>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search playlists..."
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filter Tabs */}
          <Tabs
            value={filter}
            onValueChange={(value) =>
              onFilterChange?.(value as typeof filter)
            }
          >
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="draft">Drafts</TabsTrigger>
              <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* View Toggle */}
          <div className="flex gap-1 border rounded-lg p-1">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => onViewModeChange?.("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => onViewModeChange?.("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Playlists */}
        {searchedPlaylists.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Music className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-medium mb-2">
                {searchValue
                  ? "No playlists found"
                  : filter === "all"
                  ? "No playlists yet"
                  : `No ${filter} playlists`}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchValue
                  ? "Try adjusting your search"
                  : "Create your first playlist to get started"}
              </p>
              {!searchValue && (
                <Button onClick={onCreatePlaylist}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Playlist
                </Button>
              )}
            </CardContent>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {searchedPlaylists.map((playlist) => (
              <Card
                key={playlist.id}
                className="cursor-pointer hover:shadow-md transition-shadow group"
                onClick={() => onPlaylistClick?.(playlist.id)}
              >
                <CardHeader className="p-4">
                  <div className="aspect-square rounded-lg bg-gradient-lyra mb-3 relative overflow-hidden">
                    {playlist.coverUrl ? (
                      <img
                        src={playlist.coverUrl}
                        alt={playlist.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="h-12 w-12 text-white/60" />
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlaylistPlay?.(playlist.id);
                      }}
                      className="absolute bottom-2 right-2 p-3 rounded-full bg-primary text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Play className="h-4 w-4 fill-current" />
                    </button>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="truncate text-base">
                        {playlist.name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Badge variant={getStatusColor(playlist.status)}>
                          {playlist.status}
                        </Badge>
                        <span className="text-xs">{playlist.genre}</span>
                      </CardDescription>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger
                        asChild
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onPlaylistPlay?.(playlist.id);
                          }}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Play
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onPlaylistEdit?.(playlist.id);
                          }}
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onPlaylistDelete?.(playlist.id);
                          }}
                          className="text-destructive focus:text-destructive"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="text-xs text-muted-foreground mt-2">
                    {playlist.trackCount} tracks • {playlist.duration}
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {searchedPlaylists.map((playlist) => (
                  <div
                    key={playlist.id}
                    className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer group"
                    onClick={() => onPlaylistClick?.(playlist.id)}
                  >
                    {/* Cover */}
                    <div className="flex-shrink-0 w-16 h-16 rounded-md bg-gradient-lyra relative overflow-hidden">
                      {playlist.coverUrl ? (
                        <img
                          src={playlist.coverUrl}
                          alt={playlist.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Music className="h-6 w-6 text-white/60" />
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPlaylistPlay?.(playlist.id);
                        }}
                        className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Play className="h-6 w-6 text-white fill-current" />
                      </button>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{playlist.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={getStatusColor(playlist.status)} className="text-xs">
                          {playlist.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {playlist.genre}
                        </span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
                      <div>{playlist.trackCount} tracks</div>
                      <div>{playlist.duration}</div>
                    </div>

                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        asChild
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onPlaylistPlay?.(playlist.id);
                          }}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Play
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onPlaylistEdit?.(playlist.id);
                          }}
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onPlaylistDelete?.(playlist.id);
                          }}
                          className="text-destructive focus:text-destructive"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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

PlaylistsIndexPage.displayName = "PlaylistsIndexPage";
