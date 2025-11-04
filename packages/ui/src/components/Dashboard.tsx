import React, { useState, useEffect } from 'react';
import { DashboardLayout } from './DashboardLayout';
import { Overview } from './Overview';
import { PlaylistBuilder } from './PlaylistBuilder';
import { PlaylistLibrary } from './PlaylistLibrary';
import { SongLibrary } from './SongLibrary';
import { PlaylistViewer } from './PlaylistViewer';
import { Analytics } from './Analytics';
import { Billing } from './Billing';
import { Settings } from './Settings';
import { Support } from './Support';
import { AdminProviders } from './AdminProviders';
import { Status } from './Status';
import { NotificationDrawer } from './NotificationDrawer';
import { ComponentShowcase } from './ComponentShowcase';

export type DashboardView = 
  | 'overview' 
  | 'playlists' 
  | 'playlist-library'
  | 'song-library'
  | 'playlist-viewer' 
  | 'analytics' 
  | 'billing' 
  | 'settings' 
  | 'support'
  | 'admin-providers'
  | 'status'
  | 'showcase';

interface DashboardProps {
  onNavigate?: (path: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [currentView, setCurrentView] = useState<DashboardView>('overview');
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<any>(null);

  // Auto-play when track changes
  useEffect(() => {
    if (currentTrack) {
      setIsPlaying(true);
    }
  }, [currentTrack]);

  const renderView = () => {
    switch (currentView) {
      case 'overview':
        return <Overview onPlayTrack={setCurrentTrack} />;
      case 'playlists':
        console.log('[Dashboard] Rendering PlaylistBuilder');
        return <PlaylistBuilder onPlayTrack={setCurrentTrack} />;
      case 'playlist-library':
        console.log('[Dashboard] Rendering PlaylistLibrary');
        return <PlaylistLibrary 
          onCreatePlaylist={() => onNavigate?.('/compose')} 
          onPlayTrack={setCurrentTrack}
          onViewPlaylist={(playlist) => {
            console.log('[Dashboard] Navigating to playlist details:', playlist);
            onNavigate?.(`/playlists/${playlist.id}`);
          }}
        />;
      case 'song-library':
        return <SongLibrary onPlayTrack={setCurrentTrack} />;
      case 'playlist-viewer':
        return <PlaylistViewer playlist={selectedPlaylist} onPlayTrack={setCurrentTrack} />;
      case 'analytics':
        return <Analytics />;
      case 'billing':
        return <Billing />;
      case 'settings':
        return <Settings />;
      case 'support':
        return <Support />;
      case 'admin-providers':
        return <AdminProviders />;
      case 'status':
        return <Status />;
      case 'showcase':
        return <ComponentShowcase />;
      default:
        return <Overview onPlayTrack={setCurrentTrack} />;
    }
  };

  return (
    <>
      <DashboardLayout
        currentView={currentView}
        onViewChange={setCurrentView}
        onNotificationsClick={() => setShowNotifications(true)}
        notificationCount={3}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onPlayPause={() => setIsPlaying(!isPlaying)}
        onGoToPlaylist={(playlist) => {
          setSelectedPlaylist(playlist);
          setCurrentView('playlist-viewer');
        }}
        onNavigate={onNavigate}
      >
        {renderView()}
      </DashboardLayout>

      {/* Notification Drawer */}
      {showNotifications && (
        <NotificationDrawer onClose={() => setShowNotifications(false)} />
      )}
    </>
  );
};