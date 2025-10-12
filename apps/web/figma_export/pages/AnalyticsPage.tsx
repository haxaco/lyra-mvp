// Lyra Design System Export — v1.0.0
"use client";

import * as React from "react";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Music,
  SkipForward,
  Heart,
  Users,
  DollarSign,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@lyra/ui";
import { Tabs, TabsList, TabsTrigger } from "@lyra/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@lyra/ui";
import { cn } from "@lyra/ui";

export interface AnalyticsStat {
  title: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon?: React.ReactNode;
}

export interface ChartData {
  label: string;
  value: number;
}

export interface AnalyticsPageProps {
  /** Time period filter */
  period?: "7d" | "30d" | "90d" | "1y";
  onPeriodChange?: (period: "7d" | "30d" | "90d" | "1y") => void;
  /** Stats data */
  stats?: AnalyticsStat[];
  /** Chart data */
  streamingData?: ChartData[];
  topGenres?: { genre: string; streams: number; percentage: number }[];
  topPlaylists?: { name: string; streams: number; skipRate: number }[];
  /** Loading state */
  isLoading?: boolean;
  className?: string;
}

export const AnalyticsPage = React.forwardRef<HTMLDivElement, AnalyticsPageProps>(
  (
    {
      period = "30d",
      onPeriodChange,
      stats = [],
      streamingData = [],
      topGenres = [],
      topPlaylists = [],
      isLoading = false,
      className,
    },
    ref
  ) => {
    const defaultStats: AnalyticsStat[] = stats.length > 0 ? stats : [
      {
        title: "Total Streams",
        value: "45.2K",
        change: "+12.3%",
        trend: "up",
        icon: <Music className="h-5 w-5" />,
      },
      {
        title: "Hours Streamed",
        value: "1,284",
        change: "+8.1%",
        trend: "up",
        icon: <Clock className="h-5 w-5" />,
      },
      {
        title: "Avg Skip Rate",
        value: "8.2%",
        change: "-2.1%",
        trend: "down",
        icon: <SkipForward className="h-5 w-5" />,
      },
      {
        title: "Customer Satisfaction",
        value: "4.8/5",
        change: "+0.3",
        trend: "up",
        icon: <Heart className="h-5 w-5" />,
      },
    ];

    const defaultGenres = topGenres.length > 0 ? topGenres : [
      { genre: "Ambient", streams: 12450, percentage: 28 },
      { genre: "Lo-Fi", streams: 10230, percentage: 23 },
      { genre: "Jazz", streams: 8910, percentage: 20 },
      { genre: "Electronic", streams: 7650, percentage: 17 },
      { genre: "Classical", streams: 5310, percentage: 12 },
    ];

    const defaultPlaylists = topPlaylists.length > 0 ? topPlaylists : [
      { name: "Morning Café Vibes", streams: 5420, skipRate: 6.2 },
      { name: "Workout Energy", streams: 4890, skipRate: 8.5 },
      { name: "Evening Chill", streams: 4320, skipRate: 5.1 },
      { name: "Focus Flow", streams: 3980, skipRate: 7.3 },
      { name: "Retail Upbeat", streams: 3560, skipRate: 9.2 },
    ];

    return (
      <div ref={ref} className={cn("p-6 space-y-6", className)}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Analytics</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track your music performance and customer engagement
            </p>
          </div>

          {/* Period Filter */}
          <Select value={period} onValueChange={onPeriodChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>

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
                    {stat.trend === "up" && <TrendingUp className="h-3 w-3" />}
                    {stat.trend === "down" && <TrendingDown className="h-3 w-3" />}
                    {stat.change}
                    <span className="text-muted-foreground ml-1">vs last period</span>
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Streaming Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Streaming Activity</CardTitle>
              <CardDescription>Daily streams over the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-end justify-between gap-2">
                {[45, 62, 58, 70, 65, 78, 82, 75, 88, 92, 85, 95, 90, 100].map(
                  (height, index) => (
                    <div
                      key={index}
                      className="flex-1 bg-primary/20 hover:bg-primary/40 rounded-t transition-colors cursor-pointer relative group"
                      style={{ height: `${height}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-popover border rounded px-2 py-1 text-xs whitespace-nowrap">
                        {Math.round(height * 50)} streams
                      </div>
                    </div>
                  )
                )}
              </div>
              <div className="flex justify-between mt-4 text-xs text-muted-foreground">
                <span>Mon</span>
                <span>Fri</span>
                <span>Sun</span>
              </div>
            </CardContent>
          </Card>

          {/* Top Genres */}
          <Card>
            <CardHeader>
              <CardTitle>Top Genres</CardTitle>
              <CardDescription>Most streamed genres this period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {defaultGenres.map((genre, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{genre.genre}</span>
                      <span className="text-muted-foreground">
                        {genre.streams.toLocaleString()} streams
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${genre.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Playlists */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Playlists</CardTitle>
            <CardDescription>Your most popular playlists</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-4 py-2 text-sm text-muted-foreground border-b">
                <div className="col-span-1">#</div>
                <div className="col-span-6 md:col-span-5">Playlist</div>
                <div className="col-span-3 md:col-span-3 text-right">Streams</div>
                <div className="col-span-2 md:col-span-3 text-right">Skip Rate</div>
              </div>

              {/* Playlists */}
              {defaultPlaylists.map((playlist, index) => (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-muted/50 rounded-lg transition-colors"
                >
                  <div className="col-span-1 flex items-center text-muted-foreground">
                    {index + 1}
                  </div>
                  <div className="col-span-6 md:col-span-5 flex items-center font-medium">
                    {playlist.name}
                  </div>
                  <div className="col-span-3 md:col-span-3 flex items-center justify-end text-sm">
                    {playlist.streams.toLocaleString()}
                  </div>
                  <div className="col-span-2 md:col-span-3 flex items-center justify-end">
                    <span
                      className={cn(
                        "text-sm font-medium",
                        playlist.skipRate < 7
                          ? "text-green-600"
                          : playlist.skipRate > 8
                          ? "text-red-600"
                          : "text-yellow-600"
                      )}
                    >
                      {playlist.skipRate}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Cost Analysis */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Cost Analysis</CardTitle>
              <CardDescription>AI generation and streaming costs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <div className="text-sm text-muted-foreground">AI Generation</div>
                  <div className="text-2xl font-bold">$248</div>
                </div>
                <DollarSign className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <div className="text-sm text-muted-foreground">Streaming</div>
                  <div className="text-2xl font-bold">$156</div>
                </div>
                <Music className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10">
                <div>
                  <div className="text-sm text-muted-foreground">Total Cost</div>
                  <div className="text-2xl font-bold text-primary">$404</div>
                </div>
                <div className="text-sm text-green-600 font-medium">
                  -12% vs last month
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Engagement Metrics</CardTitle>
              <CardDescription>Customer interaction stats</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Completion Rate</span>
                  <span className="font-medium">87%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: "87%" }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Repeat Listeners</span>
                  <span className="font-medium">62%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: "62%" }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Peak Hours</span>
                  <span className="font-medium">9AM - 5PM</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Avg Session</span>
                  <span className="font-medium">45 min</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
);

AnalyticsPage.displayName = "AnalyticsPage";
