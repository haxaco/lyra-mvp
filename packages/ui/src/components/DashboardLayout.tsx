import React, { useState, useEffect } from 'react';
import { TopNavBar } from './TopNavBar';
import { Sidebar } from './Sidebar';
import { MusicPlayerResponsive } from './MusicPlayerResponsive';
import { DashboardView } from './Dashboard';

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentView: DashboardView;
  onViewChange: (view: DashboardView) => void;
  onNotificationsClick: () => void;
  notificationCount?: number;
  currentTrack?: any;
  isPlaying: boolean;
  onPlayPause: () => void;
  onGoToPlaylist?: (playlist: any) => void;
  onNavigate?: (path: string) => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  currentView,
  onViewChange,
  onNotificationsClick,
  notificationCount = 3,
  currentTrack,
  isPlaying,
  onPlayPause,
  onGoToPlaylist,
  onNavigate
}) => {
  // Sidebar collapse state - responsive default
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);

  // Initialize sidebar state based on screen size
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width >= 1280) {
        // Desktop: expanded by default
        setSidebarCollapsed(false);
        setSidebarVisible(false);
      } else if (width >= 768) {
        // Tablet: collapsed by default
        setSidebarCollapsed(true);
        setSidebarVisible(false);
      } else {
        // Mobile: hidden, shows as overlay
        setSidebarCollapsed(false);
        setSidebarVisible(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    const width = window.innerWidth;
    if (width < 768) {
      // Mobile: toggle overlay visibility
      setSidebarVisible(!sidebarVisible);
    } else {
      // Desktop/Tablet: toggle collapse state
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  const closeMobileSidebar = () => {
    if (window.innerWidth < 768) {
      setSidebarVisible(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Fixed Top Navigation Bar - 56px mobile, 64px desktop */}
      <TopNavBar
        currentView={currentView}
        onViewChange={onViewChange}
        onNotificationsClick={onNotificationsClick}
        notificationCount={notificationCount}
        onGenerateClick={() => onNavigate?.('/compose')}
        onMenuToggle={toggleSidebar}
        sidebarCollapsed={sidebarCollapsed}
      />

      {/* Layout container below TopNavBar */}
      <div className="flex flex-1 pt-14 md:pt-16 overflow-hidden">
        <Sidebar
          currentView={currentView}
          onViewChange={(view) => {
            // Map dashboard views to URLs
            switch (view) {
              case 'overview':
                onNavigate?.('/');
                break;
              case 'playlist-library':
                onNavigate?.('/playlists');
                break;
              case 'song-library':
                onNavigate?.('/library');
                break;
              case 'analytics':
                onNavigate?.('/analytics');
                break;
              case 'billing':
                onNavigate?.('/billing');
                break;
              case 'settings':
                onNavigate?.('/settings');
                break;
              case 'support':
                onNavigate?.('/support');
                break;
              default:
                onViewChange(view);
            }
            closeMobileSidebar();
          }}
          onNotificationsClick={onNotificationsClick}
          collapsed={sidebarCollapsed}
          mobileVisible={sidebarVisible}
          onClose={closeMobileSidebar}
        />

        {/* Mobile Overlay */}
        {/* {sidebarVisible && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={closeMobileSidebar}
          />
        )} */}

        {/* Main Content Area */}
        <main 
          className={`flex-1 overflow-y-auto transition-all duration-300 ease-in-out pb-12 md:pb-[88px] ${
            sidebarCollapsed ? 'ml-0 md:ml-[72px]' : 'ml-0 md:ml-[240px]'
          }`}
        >
          {/* Subtle fade effect under top bar */}
          <div className="sticky top-0 h-4 bg-gradient-to-b from-background/80 to-transparent pointer-events-none z-10" />
          
          {/* Content wrapper with responsive padding */}
          <div className="min-h-full bg-gradient-to-br from-background via-background to-secondary/20">
            <div className="container mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-6 max-w-[1920px]">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Fixed Bottom Music Player - 48px mobile, 88px desktop */}
      <div 
        className={`fixed bottom-0 right-0 z-40 h-12 md:h-[88px] transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'left-0 md:left-[72px]' : 'left-0 md:left-[240px]'
        }`}
      >
        {/* Elevation shadow for depth */}
        <div className="absolute inset-0 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_12px_rgba(0,0,0,0.3)]" />
        
        {/* Gradient background with slight blur */}
        <div className="absolute inset-0 bg-gradient-to-r from-blush via-secondary to-warm-nude backdrop-blur-sm" />
        
        {/* Player content */}
        <div className="relative h-full">
          <MusicPlayerResponsive
            currentTrack={currentTrack}
            onGoToPlaylist={onGoToPlaylist}
          />
        </div>
      </div>
    </div>
  );
};
