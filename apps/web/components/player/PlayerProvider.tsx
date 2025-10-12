"use client";

import React, { createContext, useContext, useState, useRef } from "react";

type Track = {
  id: string;
  title: string | null;
  getUrl: () => Promise<string>;
};

type PlayerState = {
  currentTrack: Track | null;
  isPlaying: boolean;
  queue: Track[];
  currentIndex: number;
};

type PlayerContextType = {
  state: PlayerState;
  play: (track: Track) => Promise<void>;
  playQueue: (tracks: Track[], startIndex?: number) => Promise<void>;
  pause: () => void;
  resume: () => void;
  next: () => Promise<void>;
  previous: () => Promise<void>;
};

const PlayerContext = createContext<PlayerContextType | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<PlayerState>({
    currentTrack: null,
    isPlaying: false,
    queue: [],
    currentIndex: -1,
  });

  // Initialize audio element
  React.useEffect(() => {
    if (typeof window !== "undefined" && !audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.addEventListener("ended", () => {
        // Auto-play next track
        next();
      });
    }
  }, []);

  const play = async (track: Track) => {
    if (!audioRef.current) return;
    
    const url = await track.getUrl();
    audioRef.current.src = url;
    audioRef.current.play();
    
    setState({
      currentTrack: track,
      isPlaying: true,
      queue: [track],
      currentIndex: 0,
    });
  };

  const playQueue = async (tracks: Track[], startIndex = 0) => {
    if (!audioRef.current || tracks.length === 0) return;
    
    const track = tracks[startIndex];
    const url = await track.getUrl();
    audioRef.current.src = url;
    audioRef.current.play();
    
    setState({
      currentTrack: track,
      isPlaying: true,
      queue: tracks,
      currentIndex: startIndex,
    });
  };

  const pause = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    setState((s) => ({ ...s, isPlaying: false }));
  };

  const resume = () => {
    if (!audioRef.current) return;
    audioRef.current.play();
    setState((s) => ({ ...s, isPlaying: true }));
  };

  const next = async () => {
    const nextIndex = state.currentIndex + 1;
    if (nextIndex < state.queue.length) {
      await playQueue(state.queue, nextIndex);
    }
  };

  const previous = async () => {
    const prevIndex = state.currentIndex - 1;
    if (prevIndex >= 0) {
      await playQueue(state.queue, prevIndex);
    }
  };

  return (
    <PlayerContext.Provider value={{ state, play, playQueue, pause, resume, next, previous }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}

