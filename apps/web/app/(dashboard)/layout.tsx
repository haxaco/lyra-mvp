"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { TopNavBar, Sidebar } from "@lyra/ui";
import { NotificationDrawer, MusicPlayerResponsive } from "@lyra/ui/dist/components";
import { ThemeProvider } from "@lyra/ui/dist/components";

// Player context for sharing play state across dashboard
type PlayerTrack = {
  id: string;
  title: string;
  artist: string;
  image?: string;
  audioUrl?: string;
  r2Key?: string; // For on-demand URL signing
  playlistId?: string;
  playlistName?: string;
};

const PlayerContext = React.createContext<{
  currentTrack: PlayerTrack | null;
  isPlaying: boolean;
  queue: PlayerTrack[];
  currentIndex: number;
  setCurrentTrack: (track: PlayerTrack | null) => void;
  setIsPlaying: (playing: boolean) => void;
  playTrack: (track: PlayerTrack, queue?: PlayerTrack[], startIndex?: number) => void;
  next: () => Promise<void>;
  previous: () => Promise<void>;
} | null>(null);

export function usePlayerContext() {
  const ctx = React.useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayerContext must be used within DashboardLayout");
  return ctx;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [sidebarVisible, setSidebarVisible] = React.useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  const navigation = [
    {
      items: [
        { id: "overview", label: "Overview", onClick: () => router.push("/") },
        { id: "playlists", label: "Playlists", onClick: () => router.push("/playlists") },
        { id: "library", label: "Library", onClick: () => router.push("/library") },
        { id: "analytics", label: "Analytics", onClick: () => router.push("/analytics") },
        { id: "settings", label: "Settings", onClick: () => router.push("/settings") },
        { id: "showcase", label: "Showcase", onClick: () => router.push("/showcase") },
      ],
    },
  ];

  const activeItem = React.useMemo(() => {
    if (!pathname) return "overview";
    if (pathname.startsWith("/compose")) return "playlists"; // Playlist Builder
    if (pathname.startsWith("/playlists")) return "playlist-library";
    if (pathname.startsWith("/library")) return "song-library";
    if (pathname.startsWith("/analytics")) return "analytics";
    if (pathname.startsWith("/settings")) return "settings";
    if (pathname.startsWith("/showcase")) return "showcase";
    return "overview";
  }, [pathname]);

  const currentView = activeItem as any;
  const onViewChange = (view: any) => {
    switch (view) {
      case 'overview':
        router.push('/');
        break;
      case 'playlists':
        router.push('/compose');
        break;
      case 'playlist-library':
        router.push('/playlists');
        break;
      case 'song-library':
        router.push('/library');
        break;
      case 'analytics':
        router.push('/analytics');
        break;
      case 'settings':
        router.push('/settings');
        break;
      case 'billing':
        router.push('/billing');
        break;
      case 'support':
        router.push('/support');
        break;
      default:
        break;
    }
  };

  const toggleSidebar = () => {
    const width = typeof window !== "undefined" ? window.innerWidth : 0;
    if (width < 768) setSidebarVisible((v) => !v);
    else setSidebarCollapsed((v) => !v);
  };

  const closeMobileSidebar = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768) setSidebarVisible(false);
  };

  // Initialize theme to 'light' to match SSR, then sync from localStorage on mount
  const [theme, setTheme] = React.useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = React.useState(false);

  // Sync theme from localStorage and DOM on mount
  React.useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('lyra-theme') as 'light' | 'dark' | null;
    const initialTheme = stored || 'light';
    setTheme(initialTheme);
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = React.useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      if (typeof window !== 'undefined') {
        document.documentElement.classList.toggle('dark', next === 'dark');
        localStorage.setItem('lyra-theme', next);
      }
      return next;
    });
  }, []);

  const [showNotifications, setShowNotifications] = React.useState(false);
  
  // Player state
  const [currentTrack, setCurrentTrack] = React.useState<PlayerTrack | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [queue, setQueue] = React.useState<PlayerTrack[]>([]);
  const [currentIndex, setCurrentIndex] = React.useState<number>(-1);

  // Helper to sign URL for a track
  const signTrackUrl = React.useCallback(async (track: PlayerTrack): Promise<string | undefined> => {
    if (track.audioUrl) return track.audioUrl;
    if (!track.r2Key) return undefined;
    
    try {
      const res = await fetch('/api/r2/sign-get', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: track.r2Key }),
      });
      const data = await res.json();
      return data?.url || undefined;
    } catch (e) {
      console.error('Failed to sign URL:', e);
      return undefined;
    }
  }, []);

  const playTrack = React.useCallback(async (track: PlayerTrack, queueParam?: PlayerTrack[], startIndex?: number) => {
    // Sign URL if needed
    const audioUrl = await signTrackUrl(track);
    const trackWithUrl = { ...track, audioUrl };
    
    // Determine queue and index
    const newQueue = queueParam || [trackWithUrl];
    const newIndex = startIndex !== undefined ? startIndex : (queueParam ? queueParam.findIndex(t => t.id === track.id) : 0);
    
    setCurrentTrack(trackWithUrl);
    setQueue(newQueue);
    setCurrentIndex(newIndex >= 0 ? newIndex : 0);
    setIsPlaying(true);
  }, [signTrackUrl]);

  const next = React.useCallback(async () => {
    if (currentIndex < 0 || currentIndex >= queue.length - 1) return;
    
    const nextIndex = currentIndex + 1;
    const nextTrack = queue[nextIndex];
    if (!nextTrack) return;
    
    // Sign URL if needed
    const audioUrl = await signTrackUrl(nextTrack);
    const trackWithUrl = { ...nextTrack, audioUrl };
    
    // Update queue with signed URL
    const updatedQueue = [...queue];
    updatedQueue[nextIndex] = trackWithUrl;
    
    setCurrentTrack(trackWithUrl);
    setQueue(updatedQueue);
    setCurrentIndex(nextIndex);
    setIsPlaying(true);
  }, [queue, currentIndex, signTrackUrl]);

  const previous = React.useCallback(async () => {
    if (currentIndex <= 0) return;
    
    const prevIndex = currentIndex - 1;
    const prevTrack = queue[prevIndex];
    if (!prevTrack) return;
    
    // Sign URL if needed
    const audioUrl = await signTrackUrl(prevTrack);
    const trackWithUrl = { ...prevTrack, audioUrl };
    
    // Update queue with signed URL
    const updatedQueue = [...queue];
    updatedQueue[prevIndex] = trackWithUrl;
    
    setCurrentTrack(trackWithUrl);
    setQueue(updatedQueue);
    setCurrentIndex(prevIndex);
    setIsPlaying(true);
  }, [queue, currentIndex, signTrackUrl]);

  const playerContextValue = React.useMemo(() => ({
    currentTrack,
    isPlaying,
    queue,
    currentIndex,
    setCurrentTrack,
    setIsPlaying,
    playTrack,
    next,
    previous,
  }), [currentTrack, isPlaying, queue, currentIndex, playTrack, next, previous]);

  // Memoize the track object for MusicPlayerResponsive to prevent unnecessary re-renders
  const playerTrack = React.useMemo(() => {
    if (!currentTrack) return null;
    return {
      ...currentTrack,
      image: currentTrack.image || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
    };
  }, [currentTrack]);

  return (
    <ThemeProvider theme={theme} toggleTheme={toggleTheme}>
      <PlayerContext.Provider value={playerContextValue}>
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* TopNav fixed (56/64) */}
      <TopNavBar
        currentView={currentView}
        onViewChange={onViewChange}
        onNotificationsClick={() => setShowNotifications(true)}
        onMenuToggle={toggleSidebar}
      />

      {/* Below top bar */}
      <div className="flex flex-1 pt-14 md:pt-16 overflow-hidden">
        <Sidebar
          currentView={currentView}
          onViewChange={onViewChange}
          onNotificationsClick={() => setShowNotifications(true)}
          collapsed={sidebarCollapsed}
          mobileVisible={sidebarVisible}
          onClose={closeMobileSidebar}
        />

        {/* Main */}
        <main
          className={`flex-1 overflow-y-auto transition-all duration-300 ease-in-out ${
            playerTrack ? "pb-12 md:pb-[88px]" : ""
          } ${
            sidebarCollapsed ? "ml-0 md:ml-[72px]" : "ml-0 md:ml-[240px]"
          }`}
        >
          <div className="sticky top-0 h-4 bg-gradient-to-b from-background/80 to-transparent pointer-events-none z-10" />
          <div className="min-h-full bg-gradient-to-br from-background via-background to-secondary/20">
            <div className="container mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-6 max-w-[1920px]">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Notification Drawer */}
      {showNotifications && (
        <NotificationDrawer onClose={() => setShowNotifications(false)} />
      )}

      {/* Bottom Player - Only show when track is loaded */}
      {playerTrack && (
        <div
          className={`fixed bottom-0 right-0 z-40 h-12 md:h-[88px] transition-all duration-300 ease-in-out ${
            sidebarCollapsed ? "left-0 md:left-[72px]" : "left-0 md:left-[240px]"
          }`}
        >
          <div className="absolute inset-0 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_12px_rgba(0,0,0,0.3)]" />
          <div className="absolute inset-0 bg-gradient-to-r from-blush via-secondary to-warm-nude backdrop-blur-sm" />
          <div className="relative h-full">
            <MusicPlayerResponsive
              currentTrack={playerTrack}
              onPlayStateChange={(playing) => setIsPlaying(playing)}
              onNext={() => next()}
              onPrevious={() => previous()}
              onGoToPlaylist={playerTrack?.playlistId ? (playlist: any) => {
                router.push(`/playlists/${playerTrack.playlistId}`);
              } : undefined}
            />
          </div>
        </div>
      )}
    </div>
      </PlayerContext.Provider>
    </ThemeProvider>
  );
}


