// Lyra Design System Export — v1.0.0
"use client";

import * as React from "react";
import { Sparkles, Wand2, Save, Play, ArrowLeft } from "lucide-react";
import { Button } from "@lyra/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@lyra/ui";
import { Input } from "@lyra/ui";
import { Label } from "@lyra/ui";
import { Slider } from "@lyra/ui";
import { Badge } from "@lyra/ui";
import { cn } from "@lyra/ui";

export interface GenreTag {
  id: string;
  label: string;
  selected?: boolean;
}

export interface PlaylistBuilderPageProps {
  /** Playlist name */
  playlistName?: string;
  onPlaylistNameChange?: (name: string) => void;
  /** Energy level (0-100) */
  energy?: number;
  onEnergyChange?: (value: number) => void;
  /** Tempo level (0-100) */
  tempo?: number;
  onTempoChange?: (value: number) => void;
  /** Mood level (0-100) */
  mood?: number;
  onMoodChange?: (value: number) => void;
  /** Genre tags */
  genres?: GenreTag[];
  onGenreToggle?: (genreId: string) => void;
  /** Locations */
  selectedLocations?: string[];
  /** Actions */
  onGenerate?: () => void;
  onSave?: () => void;
  onPreview?: () => void;
  onBack?: () => void;
  /** Loading state */
  isGenerating?: boolean;
  className?: string;
}

export const PlaylistBuilderPage = React.forwardRef<HTMLDivElement, PlaylistBuilderPageProps>(
  (
    {
      playlistName = "",
      onPlaylistNameChange,
      energy = 50,
      onEnergyChange,
      tempo = 50,
      onTempoChange,
      mood = 50,
      onMoodChange,
      genres = [],
      onGenreToggle,
      selectedLocations = [],
      onGenerate,
      onSave,
      onPreview,
      onBack,
      isGenerating = false,
      className,
    },
    ref
  ) => {
    const defaultGenres: GenreTag[] = genres.length > 0 ? genres : [
      { id: "ambient", label: "Ambient", selected: false },
      { id: "electronic", label: "Electronic", selected: false },
      { id: "jazz", label: "Jazz", selected: false },
      { id: "classical", label: "Classical", selected: false },
      { id: "lo-fi", label: "Lo-Fi", selected: false },
      { id: "indie", label: "Indie", selected: false },
      { id: "chill", label: "Chill", selected: false },
      { id: "upbeat", label: "Upbeat", selected: false },
    ];

    return (
      <div ref={ref} className={cn("p-6 max-w-5xl mx-auto space-y-6", className)}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onBack && (
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Wand2 className="h-6 w-6 text-primary" />
                AI Playlist Builder
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Create custom AI-generated music for your business
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {onPreview && (
              <Button variant="outline" onClick={onPreview}>
                <Play className="h-4 w-4 mr-2" />
                Preview
              </Button>
            )}
            {onSave && (
              <Button variant="outline" onClick={onSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Playlist Details */}
            <Card>
              <CardHeader>
                <CardTitle>Playlist Details</CardTitle>
                <CardDescription>
                  Give your playlist a name and configure the settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="playlist-name">Playlist Name</Label>
                  <Input
                    id="playlist-name"
                    placeholder="e.g., Morning Café Vibes"
                    value={playlistName}
                    onChange={(e) => onPlaylistNameChange?.(e.target.value)}
                  />
                </div>

                {selectedLocations.length > 0 && (
                  <div className="space-y-2">
                    <Label>Selected Locations</Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedLocations.map((location) => (
                        <Badge key={location} variant="secondary">
                          {location}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Energy Sliders */}
            <Card>
              <CardHeader>
                <CardTitle>Music Parameters</CardTitle>
                <CardDescription>
                  Adjust the energy, tempo, and mood of your playlist
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Energy */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Energy Level</Label>
                    <span className="text-sm font-medium text-muted-foreground">
                      {energy}%
                    </span>
                  </div>
                  <Slider
                    value={[energy]}
                    onValueChange={(value) => onEnergyChange?.(value[0])}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Calm</span>
                    <span>Energetic</span>
                  </div>
                </div>

                {/* Tempo */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Tempo</Label>
                    <span className="text-sm font-medium text-muted-foreground">
                      {tempo}%
                    </span>
                  </div>
                  <Slider
                    value={[tempo]}
                    onValueChange={(value) => onTempoChange?.(value[0])}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Slow</span>
                    <span>Fast</span>
                  </div>
                </div>

                {/* Mood */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Mood</Label>
                    <span className="text-sm font-medium text-muted-foreground">
                      {mood}%
                    </span>
                  </div>
                  <Slider
                    value={[mood]}
                    onValueChange={(value) => onMoodChange?.(value[0])}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Relaxed</span>
                    <span>Uplifting</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Genre Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Genre Tags</CardTitle>
                <CardDescription>
                  Select one or more genres for your playlist
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {defaultGenres.map((genre) => (
                    <Badge
                      key={genre.id}
                      variant={genre.selected ? "default" : "outline"}
                      className="cursor-pointer hover:bg-primary/90 transition-colors"
                      onClick={() => onGenreToggle?.(genre.id)}
                    >
                      {genre.label}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Preview/Generate */}
          <div className="space-y-6">
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle>AI Generation</CardTitle>
                <CardDescription>
                  Generate your custom playlist with AI
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-medium">~60 min</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tracks</span>
                    <span className="font-medium">15-20</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Energy</span>
                    <span className="font-medium">{energy}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Genres</span>
                    <span className="font-medium">
                      {defaultGenres.filter((g) => g.selected).length || "None"}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={onGenerate}
                  disabled={isGenerating || !playlistName}
                  className="w-full"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Playlist
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  AI generation typically takes 30-60 seconds
                </p>
              </CardContent>
            </Card>

            {/* Tips Card */}
            <Card>
              <CardHeader>
                <CardTitle>Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• Higher energy levels work well for gyms and retail</p>
                <p>• Lower tempo is ideal for cafés and spas</p>
                <p>• Mix genres for variety and customer engagement</p>
                <p>• Save drafts to compare different configurations</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }
);

PlaylistBuilderPage.displayName = "PlaylistBuilderPage";
