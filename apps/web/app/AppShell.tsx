"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { TopNavBar } from "@lyra/ui/dist/layout/TopNavBar";
import { Sidebar } from "@lyra/ui/dist/layout/Sidebar";
import { MusicPlayer } from "@lyra/ui/dist/layout/MusicPlayer";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);
  const [theme, setTheme] = React.useState<'light' | 'dark'>('light');

  React.useEffect(() => {
    const savedTheme = (typeof window !== 'undefined' && localStorage.getItem('lyra-theme')) as 'light' | 'dark' | null;
    if (savedTheme) setTheme(savedTheme);
  }, []);

  const onThemeToggle = React.useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      if (typeof window !== 'undefined') {
        document.documentElement.classList.toggle('dark', next === 'dark');
        localStorage.setItem('lyra-theme', next);
      }
      return next;
    });
  }, []);

  const navigation = [
    {
      items: [
        { id: 'overview', label: 'Overview', onClick: () => router.push('/') },
        { id: 'playlists', label: 'Playlists', onClick: () => router.push('/playlists') },
        { id: 'library', label: 'Library', onClick: () => router.push('/library') },
        { id: 'analytics', label: 'Analytics', onClick: () => router.push('/analytics') },
      ],
    },
  ];

  const activeItem = React.useMemo(() => {
    if (!pathname) return 'overview';
    if (pathname.startsWith('/playlists')) return 'playlists';
    if (pathname.startsWith('/library')) return 'library';
    if (pathname.startsWith('/analytics')) return 'analytics';
    return 'overview';
  }, [pathname]);

  return (
    <div>
      <TopNavBar
        onMenuToggle={() => setSidebarOpen((v) => !v)}
        onThemeToggle={onThemeToggle}
        theme={theme}
        onSearchSubmit={(q) => {
          if (!q) return;
          router.push(`/library?query=${encodeURIComponent(q)}`);
        }}
      />

      <Sidebar
        navigation={navigation}
        activeItem={activeItem}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((v) => !v)}
        showOnMobile={sidebarOpen}
        onMobileOverlayClick={() => setSidebarOpen(false)}
      />

      <main className="pt-14 md:pt-16 pb-20 md:pb-24 md:pl-[240px]">
        {children}
      </main>

      <MusicPlayer />
    </div>
  );
}


