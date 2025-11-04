import React, { useState } from 'react';
import { 
  Search, 
  Bell, 
  Sun, 
  Moon, 
  User,
  Settings,
  CreditCard,
  LogOut,
  Sparkles,
  Menu,
  Wand2,
  Server,
  Shield,
  HelpCircle
} from 'lucide-react';
import { Button } from '../primitives/button';
import { Badge } from '../primitives/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../primitives/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../primitives/dropdown-menu';
import { useTheme } from '../components/ThemeProvider';
import { DashboardView } from '../components/Dashboard';
import lyraLogoLight from '../assets/1524d315371893ccd33b602f2291ee7ae8e0063f.png';
import lyraLogoDark from '../assets/29856cf506e23b11cdc68cf83fd6317137588f3c.png';

interface TopNavBarProps {
  currentView: DashboardView;
  onViewChange: (view: DashboardView) => void;
  onNotificationsClick: () => void;
  notificationCount?: number;
  onGenerateClick?: () => void;
  onMenuToggle?: () => void;
  sidebarCollapsed?: boolean;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  currentView,
  onViewChange,
  onNotificationsClick,
  notificationCount = 3,
  onGenerateClick,
  onMenuToggle,
  sidebarCollapsed = false
}) => {
  const { theme, toggleTheme } = useTheme();
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering theme-dependent UI after mount
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Use a consistent theme for initial render to match SSR
  const displayTheme = mounted ? theme : 'light';

  const handleLogout = () => {
    localStorage.removeItem('lyra-onboarding-complete');
    localStorage.removeItem('lyra-auth-token');
    window.location.reload();
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-14 md:h-16">
      {/* Frosted glass background */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-xl border-b border-border/50" />
      
      {/* Main nav content */}
      <nav className="relative h-full px-4 md:px-6 flex items-center justify-between gap-3 md:gap-6">
        {/* LEFT SECTION */}
        <div className="flex items-center gap-4 min-w-0 flex-shrink-0">
          {/* Menu Toggle Button - Render placeholder on SSR to match client */}
          {!mounted ? (
            <div className="w-9 h-9 flex items-center justify-center" aria-label="Toggle sidebar" />
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMenuToggle}
              className="text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}

          {/* Lyra Logo - Hidden on mobile when sidebar takes space */}
          <button
            onClick={() => onViewChange('overview')}
            className="hidden sm:flex items-center group transition-all hover:scale-105"
            aria-label="Go to Dashboard Overview"
          >
            <img 
              src={displayTheme === 'light' ? lyraLogoLight : lyraLogoDark} 
              alt="Lyra"
              className="h-10 w-auto object-contain"
              style={{ background: 'transparent' }}
            />
          </button>
        </div>

        {/* CENTER SECTION - Search Bar */}
        <div className="flex-1 max-w-xl lg:max-w-2xl hidden md:block">
          <div className="relative">
            <div
              className={`
                relative flex items-center
                transition-all duration-300 ease-in-out
                ${searchFocused ? 'scale-[1.02]' : 'scale-100'}
              `}
            >
              {mounted && (
                <Search className="absolute left-3 lg:left-4 w-4 lg:w-5 h-4 lg:h-5 text-muted-foreground pointer-events-none" />
              )}
              <input
                type="text"
                placeholder="Search playlists, songs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className={`
                  w-full h-10 lg:h-12 pl-10 lg:pl-12 pr-4
                  bg-secondary/30 dark:bg-secondary/10
                  border-2 transition-all duration-300
                  rounded-full
                  text-sm lg:text-base
                  text-foreground placeholder:text-muted-foreground
                  focus:outline-none
                  ${
                    searchFocused
                      ? 'border-primary shadow-lg shadow-primary/20'
                      : 'border-transparent hover:border-border'
                  }
                `}
              />
            </div>
          </div>
        </div>

        {/* Search Icon for Mobile */}
        {!mounted ? (
          <div className="md:hidden w-9 h-9" />
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileSearchOpen(true)}
            className="md:hidden text-muted-foreground hover:text-foreground h-9 w-9 p-0"
          >
            <Search className="w-4 h-4" />
          </Button>
        )}

        {/* Mobile Search Modal removed in this integration */}

        {/* RIGHT SECTION */}
        <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
          {/* Generate Button */}
          {!mounted ? (
            <div className="hidden md:flex items-center gap-2 h-9 lg:h-10 w-24" />
          ) : (
            <Button
              onClick={onGenerateClick}
              className="hidden md:flex items-center gap-2 bg-gradient-coral text-white hover:opacity-90 transition-all shadow-md hover:shadow-lg h-9 lg:h-10"
              size="sm"
            >
              <Wand2 className="w-3.5 lg:w-4 h-3.5 lg:h-4" />
              <span className="hidden lg:inline text-sm">Generate New</span>
              <span className="lg:hidden text-sm">Generate</span>
            </Button>
          )}

          {/* Notifications */}
          {!mounted ? (
            <div className="w-9 h-9 relative" />
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="relative text-muted-foreground hover:text-foreground hover:bg-secondary/50 h-9 w-9 p-0"
              onClick={onNotificationsClick}
            >
              <Bell className="w-4 lg:w-5 h-4 lg:h-5" />
              {notificationCount > 0 && (
                <Badge className="absolute -top-0.5 -right-0.5 h-4 w-4 lg:h-5 lg:w-5 flex items-center justify-center p-0 bg-primary text-white border-2 border-background text-[10px] lg:text-xs">
                  {notificationCount}
                </Badge>
              )}
            </Button>
          )}

          {/* Theme Toggle */}
          {!mounted ? (
            <div className="hidden md:flex w-9 h-9" />
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="hidden md:flex text-muted-foreground hover:text-foreground hover:bg-secondary/50 h-9 w-9 p-0"
            >
              {displayTheme === 'light' ? (
                <Moon className="w-4 lg:w-5 h-4 lg:h-5" />
              ) : (
                <Sun className="w-4 lg:w-5 h-4 lg:h-5" />
              )}
            </Button>
          )}

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="relative h-8 w-8 lg:h-9 lg:w-9 rounded-full hover:bg-secondary/50 p-0 cursor-pointer"
                aria-label="User menu"
              >
                <Avatar className="h-7 w-7 lg:h-8 lg:w-8 pointer-events-none">
                  <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Lyra" alt="User" />
                  <AvatarFallback className="bg-gradient-coral text-white text-xs lg:text-sm">
                    LY
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 z-[100]">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">Lyra User</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    user@business.com
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {/* Account Section */}
              <DropdownMenuItem onClick={() => onViewChange('settings')}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onViewChange('settings')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onViewChange('billing')}>
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Billing & Plans</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              {/* Admin Section */}
              <DropdownMenuItem onClick={() => onViewChange('admin-providers')}>
                <Server className="mr-2 h-4 w-4" />
                <span>AI Providers</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onViewChange('status')}>
                <Shield className="mr-2 h-4 w-4" />
                <span>System Status</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              {/* Support Section */}
              <DropdownMenuItem onClick={() => onViewChange('support')}>
                <HelpCircle className="mr-2 h-4 w-4" />
                <span>Help & Support</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                onClick={handleLogout}
                className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
    </div>
  );
};