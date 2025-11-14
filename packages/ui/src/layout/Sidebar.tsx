import React from 'react';
import { Button } from '../primitives/button';
import { useTheme } from '../components/ThemeProvider';
import { 
  Home, 
  BarChart3, 
  Sun, 
  Moon,
  LogOut,
  Bell,
  Library,
  Disc3,
  Sparkles,
  X
} from 'lucide-react';
import { Badge } from '../primitives/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../primitives/tooltip';
import type { DashboardView } from '../components/Dashboard';

interface SidebarProps {
  currentView: DashboardView;
  onViewChange: (view: DashboardView) => void;
  onNotificationsClick?: () => void;
  collapsed: boolean;
  mobileVisible?: boolean;
  onClose?: () => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onViewChange,
  onNotificationsClick,
  collapsed,
  mobileVisible = false,
  onClose,
  onLogout
}) => {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Prevent hydration mismatch by only rendering theme-dependent UI after mount
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Use a consistent theme for initial render to match SSR
  const displayTheme = mounted ? theme : 'light';

  const menuItems = [
    { id: 'overview' as DashboardView, label: 'Overview', icon: Home },
    { id: 'playlist-library' as DashboardView, label: 'My Playlists', icon: Library },
    { id: 'song-library' as DashboardView, label: 'Song Library', icon: Disc3 },
    { id: 'playlists' as DashboardView, label: 'Playlist Builder', icon: Sparkles },
  ];

  const insightsItems = [
    { id: 'analytics' as DashboardView, label: 'Analytics', icon: BarChart3 },
  ];

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      // Fallback for when onLogout is not provided
      localStorage.removeItem('lyra-onboarding-complete');
      localStorage.removeItem('lyra-auth-token');
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  };

  const NavItem = ({ item, showLabel }: { item: any; showLabel: boolean }) => {
    const Icon = item.icon;
    const isActive = currentView === item.id;
    
    const buttonContent = (
      <>
        <Icon className={`w-5 h-5 ${showLabel ? 'mr-3' : ''}`} />
        {showLabel && <span className="truncate">{item.label}</span>}
      </>
    );

    const buttonClassName = `w-full ${
      showLabel ? 'justify-start' : 'justify-center'
    } text-charcoal dark:text-white hover:bg-white/30 dark:hover:bg-white/10 transition-all duration-200 ${
      isActive 
        ? 'bg-white/40 dark:bg-white/20 shadow-sm border border-white/30' 
        : ''
    }`;

    if (!showLabel) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              className={buttonClassName}
              onClick={() => onViewChange(item.id)}
            >
              {buttonContent}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-charcoal dark:bg-background text-white dark:text-foreground">
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return (
      <Button
        variant="ghost"
        className={buttonClassName}
        onClick={() => onViewChange(item.id)}
      >
        {buttonContent}
      </Button>
    );
  };

  const SectionHeader = ({ title, showLabel }: { title: string; showLabel: boolean }) => {
    if (!showLabel) return null;
    
    return (
      <h3 className="px-3 py-2 text-xs font-semibold text-charcoal/70 dark:text-white/70 uppercase tracking-wider">
        {title}
      </h3>
    );
  };

  return (
    <TooltipProvider delayDuration={0}>
      {/* Sidebar */}
      <aside
        className={`
          fixed top-14 md:top-16 bottom-0 left-0 z-40
          bg-gradient-to-b from-primary via-blush to-secondary
          border-r border-white/20
          flex flex-col
          shadow-[2px_0_10px_rgba(0,0,0,0.08)]
          transition-all duration-300 ease-in-out
          ${collapsed ? 'w-[72px]' : 'w-[280px] md:w-[240px]'}
          ${mobileVisible ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Mobile Close Button */}
        {mobileVisible && (
          <div className="flex justify-end p-4 md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-charcoal hover:bg-white/30"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20">
          {/* Main Menu */}
          <div className="space-y-1">
            {menuItems.map((item) => (
              <NavItem key={item.id} item={item} showLabel={!collapsed} />
            ))}
          </div>

          {/* Insights */}
          <div className="space-y-1">
            <SectionHeader title="Insights" showLabel={!collapsed} />
            {insightsItems.map((item) => (
              <NavItem key={item.id} item={item} showLabel={!collapsed} />
            ))}
          </div>
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-white/10 space-y-2">
          {/* Notifications */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={`w-full ${
                  collapsed ? 'justify-center' : 'justify-start'
                } text-charcoal dark:text-white hover:bg-white/30 dark:hover:bg-white/10 transition-all duration-200 relative`}
                onClick={onNotificationsClick}
              >
                <Bell className={`w-5 h-5 ${collapsed ? '' : 'mr-3'}`} />
                {!collapsed && 'Notifications'}
                {!collapsed && (
                  <Badge className="ml-auto bg-white/30 text-charcoal dark:text-white border-white/30">
                    3
                  </Badge>
                )}
                {collapsed && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-white" />
                )}
              </Button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right" className="bg-charcoal dark:bg-background text-white dark:text-foreground">
                Notifications (3)
              </TooltipContent>
            )}
          </Tooltip>

          {/* Theme Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={`w-full ${
                  collapsed ? 'justify-center' : 'justify-start'
                } text-charcoal dark:text-white hover:bg-white/30 dark:hover:bg-white/10 transition-all duration-200`}
                onClick={toggleTheme}
                suppressHydrationWarning
              >
                {displayTheme === 'light' ? (
                  <Moon className={`w-5 h-5 ${collapsed ? '' : 'mr-3'}`} />
                ) : (
                  <Sun className={`w-5 h-5 ${collapsed ? '' : 'mr-3'}`} />
                )}
                {!collapsed && (displayTheme === 'light' ? 'Dark Mode' : 'Light Mode')}
              </Button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right" className="bg-charcoal dark:bg-background text-white dark:text-foreground">
                {displayTheme === 'light' ? 'Dark Mode' : 'Light Mode'}
              </TooltipContent>
            )}
          </Tooltip>
          
          {/* Sign Out */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={`w-full ${
                  collapsed ? 'justify-center' : 'justify-start'
                } text-charcoal dark:text-white hover:bg-red-500/20 hover:text-red-700 dark:hover:text-red-400 transition-all duration-200`}
                onClick={handleLogout}
              >
                <LogOut className={`w-5 h-5 ${collapsed ? '' : 'mr-3'}`} />
                {!collapsed && 'Sign Out'}
              </Button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right" className="bg-charcoal dark:bg-background text-white dark:text-foreground">
                Sign Out
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
};