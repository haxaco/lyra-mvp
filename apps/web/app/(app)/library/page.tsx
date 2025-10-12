"use client";
import React from "react";
import { WithAppShell } from "../_shell";
import { LibraryPage } from "@/figma_export/pages";
import { useTracks } from "@lyra/sdk";
import { usePlayer } from "../../../components/player";
import { getPlayableUrl } from "../../../lib/getPlayableUrl";

export default function LibraryController() {
  const { data, isLoading } = useTracks();
  const { play } = usePlayer();
  const [searchValue, setSearchValue] = React.useState("");
  const [genreFilter, setGenreFilter] = React.useState("all");
  const [moodFilter, setMoodFilter] = React.useState("all");

  const songs = (data?.items ?? []).map(t => ({
    id: t.id,
    title: t.title || "Untitled",
    artist: "AI Generated",
    album: undefined,
    duration: t.duration_seconds ? `${Math.floor(t.duration_seconds / 60)}:${String(t.duration_seconds % 60).padStart(2, '0')}` : "0:00",
    genre: (t.meta as any)?.genre || "Unknown",
    bpm: (t.meta as any)?.bpm,
    energy: (t.meta as any)?.energy,
    mood: (t.meta as any)?.mood,
    isLiked: false,
  }));

  return (
    <WithAppShell>
      <LibraryPage
        songs={songs}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        genreFilter={genreFilter}
        onGenreFilterChange={setGenreFilter}
        moodFilter={moodFilter}
        onMoodFilterChange={setMoodFilter}
        genres={["All Genres", "Electronic", "Ambient", "Jazz"]}
        moods={["All Moods", "Energetic", "Calm", "Happy"]}
        onSongClick={(id) => console.log("Song clicked:", id)}
        onSongPlay={async (id) => {
          const tr = (data?.items ?? []).find(x => x.id === id);
          if (!tr) return;
          const url = await getPlayableUrl(tr.r2_key || "");
          await play({ id: tr.id, title: tr.title, getUrl: async () => url });
        }}
        onSongLike={() => {}}
        onAddToPlaylist={() => {}}
      />
    </WithAppShell>
  );
}

