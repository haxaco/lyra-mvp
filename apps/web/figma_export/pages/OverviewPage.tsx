// Lyra Design System Export — v1.0.0
"use client";

import * as React from "react";
import {
  Home,
  Music,
  TrendingUp,
  Users,
  Clock,
  SkipForward,
  Heart,
  DollarSign,
  Play,
  Plus,
} from "lucide-react";
import { Button } from "@lyra/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@lyra/ui";
import { Badge } from "@lyra/ui";
import { cn } from "@lyra/ui";

export interface StatCardData {
  title: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon?: React.ReactNode;
}

export interface PlaylistCardData {
  id: string;
  name: string;
  genre: string;
  duration: string;
  tracks: number;
  imageUrl?: string;
  status?: "active" | "draft" | "scheduled";
}

export interface OverviewPageProps {
  /** Welcome message (e.g., "Good morning, Alex") */
  welcomeMessage?: string;
  /** Statistics data */
  stats?: StatCardData[];
  /** Recent playlists */
  recentPlaylists?: PlaylistCardData[];
  /** Quick actions */
  onCreatePlaylist?: () => void;
  onViewAnalytics?: () => void;
  onViewLibrary?: () => void;
  /** Playlist actions */
  onPlaylistClick?: (playlistId: string) => void;
  onPlaylistPlay?: (playlistId: string) => void;
  /** Show banner */
  showBanner?: boolean;
  onBannerDismiss?: () => void;
  className?: string;
}

export const OverviewPage = React.forwardRef<HTMLDivElement, OverviewPageProps>(
  (
    {
      welcomeMessage = "Good morning",
      stats = [],
      recentPlaylists = [],
      onCreatePlaylist,
      onViewAnalytics,
      onViewLibrary,
      onPlaylistClick,
      onPlaylistPlay,
      showBanner = true,
      onBannerDismiss,
      className,
    },
    ref
  ) => {
    const [bannerVisible, setBannerVisible] = React.useState(showBanner);

    const handleDismissBanner = () => {
      setBannerVisible(false);
      onBannerDismiss?.();
    };

    const defaultStats: StatCardData[] = stats.length > 0 ? stats : [
      {
        title: "Hours Streamed",
        value: "1,284",
        change: "+12.3%",
        trend: "up",
        icon: <Clock className="h-5 w-5" />,
      },
      {
        title: "Active Playlists",
        value: "24",
        change: "+3",
        trend: "up",
        icon: <Music className="h-5 w-5" />,
      },
      {
        title: "Skip Rate",
        value: "8.2%",
        change: "-2.1%",
        trend: "down",
        icon: <SkipForward className="h-5 w-5" />,
      },
      {
        title: "Customer Likes",
        value: "4.8/5",
        change: "+0.3",
        trend: "up",
        icon: <Heart className="h-5 w-5" />,
      },
    ];

    return (
      <div ref={ref} className={cn("p-6 space-y-6", className)}>
        {/* Welcome Banner */}
        {bannerVisible && (
          <Card className="bg-gradient-coral text-white border-0 shadow-lg">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">{welcomeMessage}</h2>
                <p className="text-white/90 mb-4">
                  Your AI-generated playlists are performing 23% better this week
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={onCreatePlaylist}
                    variant="secondary"
                    className="bg-white/20 hover:bg-white/30 text-white border-white/20"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Playlist
                  </Button>
                  <Button
                    onClick={onViewAnalytics}
                    variant="ghost"
                    className="text-white hover:bg-white/10"
                  >
                    View Analytics
                  </Button>
                </div>
              </div>
              <button
                onClick={handleDismissBanner}
                className="text-white/70 hover:text-white ml-4"
                aria-label="Dismiss banner"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {defaultStats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                {stat.icon && (
                  <div className="text-muted-foreground">{stat.icon}</div>
                )}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                {stat.change && (
                  <p
                    className={cn(
                      "text-xs flex items-center gap-1 mt-1",
                      stat.trend === "up" && "text-green-600",
                      stat.trend === "down" && "text-red-600",
                      stat.trend === "neutral" && "text-muted-foreground"
                    )}
                  >
                    {stat.trend === "up" && "↗"}
                    {stat.trend === "down" && "↘"}
                    {stat.change}
                    <span className="text-muted-foreground ml-1">vs last week</span>
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onCreatePlaylist}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary/10 text-primary">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>Create Playlist</CardTitle>
                  <CardDescription>Generate AI music for your space</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onViewAnalytics}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-accent/10 text-accent">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>View Analytics</CardTitle>
                  <CardDescription>Track performance metrics</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onViewLibrary}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-secondary/50 text-foreground">
                  <Music className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>Music Library</CardTitle>
                  <CardDescription>Browse all tracks</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Recent Playlists */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Recent Playlists</h3>
            <Button variant="ghost" size="sm" onClick={onViewLibrary}>
              View All
            </Button>
          </div>

          {recentPlaylists.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Music className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h4 className="font-medium mb-2">No playlists yet</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first AI-generated playlist to get started
                </p>
                <Button onClick={onCreatePlaylist}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Playlist
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentPlaylists.map((playlist) => (
                <Card
                  key={playlist.id}
                  className="cursor-pointer hover:shadow-md transition-shadow group"
                  onClick={() => onPlaylistClick?.(playlist.id)}
                >
                  <CardHeader>
                    <div className="aspect-square rounded-lg bg-gradient-lyra mb-3 relative overflow-hidden">
                      {playlist.imageUrl ? (
                        <img
                          src={playlist.imageUrl}
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
                    <CardTitle className="truncate">{playlist.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Badge variant="secondary">{playlist.genre}</Badge>
                      {playlist.status && (
                        <Badge
                          variant={
                            playlist.status === "active"
                              ? "default"
                              : playlist.status === "draft"
                              ? "outline"
                              : "secondary"
                          }
                        >
                          {playlist.status}
                        </Badge>
                      )}
                    </CardDescription>
                    <div className="text-xs text-muted-foreground mt-2">
                      {playlist.tracks} tracks • {playlist.duration}
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
);

OverviewPage.displayName = "OverviewPage";
