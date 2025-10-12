"use client";
import React from "react";
import { WithAppShell } from "../_shell";
import { PlaylistBuilderPage } from "@/figma_export/pages";
import { useEnqueueJob } from "@lyra/sdk";

export default function PlaylistBuilderController() {
  const [playlistName, setPlaylistName] = React.useState("");
  const [energy, setEnergy] = React.useState(50);
  const [tempo, setTempo] = React.useState(50);
  const [mood, setMood] = React.useState(50);
  const [selectedGenres, setSelectedGenres] = React.useState<string[]>([]);
  
  const enqueue = useEnqueueJob();

  const genres = [
    { id: "electronic", label: "Electronic", selected: selectedGenres.includes("electronic") },
    { id: "ambient", label: "Ambient", selected: selectedGenres.includes("ambient") },
    { id: "jazz", label: "Jazz", selected: selectedGenres.includes("jazz") },
    { id: "pop", label: "Pop", selected: selectedGenres.includes("pop") },
  ];

  const handleGenreToggle = (genreId: string) => {
    setSelectedGenres(prev => 
      prev.includes(genreId) 
        ? prev.filter(g => g !== genreId)
        : [...prev, genreId]
    );
  };

  const handleGenerate = async () => {
    const prompt = `Energy: ${energy}%, Tempo: ${tempo}%, Mood: ${mood}%. Genres: ${selectedGenres.join(", ") || "any"}`;
    try {
      await enqueue.mutateAsync({
        prompt,
        n: 2,
        lyrics: "[Instrumental only]",
        model: "auto",
      });
    } catch (error) {
      console.error("Generation failed:", error);
    }
  };

  return (
    <WithAppShell>
      <PlaylistBuilderPage
        playlistName={playlistName}
        onPlaylistNameChange={setPlaylistName}
        energy={energy}
        onEnergyChange={setEnergy}
        tempo={tempo}
        onTempoChange={setTempo}
        mood={mood}
        onMoodChange={setMood}
        genres={genres}
        onGenreToggle={handleGenreToggle}
        onGenerate={handleGenerate}
        isGenerating={enqueue.isPending}
      />
    </WithAppShell>
  );
}

