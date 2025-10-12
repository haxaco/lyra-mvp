// Lyra Design System Export — v1.0.0
"use client";

import * as React from "react";
import { Menu, Search, X } from "lucide-react@0.487.0";
import { cn } from "../../components/ui/utils";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";

export type NavItem = {
  id: string;
  label: string;
  href?: string;
  icon?: React.ReactNode;
  active?: boolean;
  badge?: number | string;
  onClick?: () => void;
};

export type UserMenuItem = {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onSelect?: () => void;
  variant?: "default" | "destructive";
  separator?: boolean;
};

export interface AppShellProps {
  /** Logo element or image */
  logo?: React.ReactNode;
  /** Top navigation configuration */
  topNav?: {
    searchPlaceholder?: string;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    onSearchSubmit?: (value: string) => void;
    userAvatarUrl?: string;
    userName?: string;
    userEmail?: string;
    userMenuItems?: UserMenuItem[];
  };
  /** Sidebar configuration */
  sidebar?: {
    items: NavItem[];
    collapsed?: boolean;
    onToggleCollapsed?: () => void;
  };
  /** Main content */
  children: React.ReactNode;
  /** Bottom player component */
  bottomPlayer?: React.ReactNode;
  /** Custom className */
  className?: string;
}

export const AppShell = React.forwardRef<HTMLDivElement, AppShellProps>(
  (
    {
      logo,
      topNav,
      sidebar,
      children,
      bottomPlayer,
      className,
    },
    ref
  ) => {
    const [sidebarOpen, setSidebarOpen] = React.useState(false);
    const [searchValue, setSearchValue] = React.useState("");

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchValue(value);
      topNav?.onSearchChange?.(value);
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      topNav?.onSearchSubmit?.(searchValue);
    };

    const toggleSidebar = () => {
      if (sidebar?.onToggleCollapsed) {
        sidebar.onToggleCollapsed();
      } else {
        setSidebarOpen(!sidebarOpen);
      }
    };

    const sidebarCollapsed = sidebar?.collapsed ?? false;

    return (
      <div ref={ref} className={cn("min-h-screen bg-background", className)}>
        {/* Top Navigation Bar */}
        <header className="fixed top-0 left-0 right-0 z-50 h-14 md:h-16 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="h-full px-4 md:px-6 flex items-center gap-4">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={toggleSidebar}
              aria-label="Toggle menu"
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Logo */}
            <div className="flex-shrink-0">
              {logo || (
                <div className="text-xl font-semibold text-gradient-coral">
                  Lyra
                </div>
              )}
            </div>

            {/* Search Bar */}
            <form
              onSubmit={handleSearchSubmit}
              className="hidden md:flex flex-1 max-w-md items-center gap-2"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={topNav?.searchPlaceholder || "Search..."}
                  value={topNav?.searchValue ?? searchValue}
                  onChange={handleSearchChange}
                  className="pl-9"
                />
              </div>
            </form>

            <div className="flex-1 md:hidden" />

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-9 w-9 rounded-full"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={topNav?.userAvatarUrl} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {topNav?.userName?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {topNav?.userName && (
                  <>
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{topNav.userName}</p>
                        {topNav.userEmail && (
                          <p className="text-xs text-muted-foreground">
                            {topNav.userEmail}
                          </p>
                        )}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                  </>
                )}
                {topNav?.userMenuItems?.map((item, index) =>
                  item.separator ? (
                    <DropdownMenuSeparator key={`separator-${index}`} />
                  ) : (
                    <DropdownMenuItem
                      key={item.id}
                      onClick={item.onSelect}
                      className={cn(
                        item.variant === "destructive" &&
                          "text-destructive focus:text-destructive"
                      )}
                    >
                      {item.icon && (
                        <span className="mr-2 h-4 w-4">{item.icon}</span>
                      )}
                      {item.label}
                    </DropdownMenuItem>
                  )
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Sidebar */}
        {sidebar && (
          <>
            {/* Mobile Overlay */}
            {sidebarOpen && (
              <div
                className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
                onClick={() => setSidebarOpen(false)}
              />
            )}

            {/* Sidebar Panel */}
            <aside
              className={cn(
                "fixed top-14 md:top-16 bottom-0 left-0 z-40",
                "bg-sidebar border-r border-sidebar-border",
                "transition-all duration-300",
                sidebarCollapsed ? "w-[72px]" : "w-[280px] md:w-[240px]",
                // Mobile behavior
                sidebarOpen
                  ? "translate-x-0"
                  : "-translate-x-full md:translate-x-0"
              )}
            >
              <div className="h-full flex flex-col overflow-hidden">
                {/* Mobile Close Button */}
                <div className="md:hidden p-4 flex justify-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4">
                  <div className="space-y-1">
                    {sidebar.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={item.onClick}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg",
                          "transition-all duration-200",
                          "focus:outline-none focus:ring-2 focus:ring-ring/20",
                          item.active
                            ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          sidebarCollapsed && "justify-center"
                        )}
                        title={sidebarCollapsed ? item.label : undefined}
                      >
                        {item.icon && (
                          <span className="flex-shrink-0 w-5 h-5">
                            {item.icon}
                          </span>
                        )}
                        {!sidebarCollapsed && (
                          <span className="flex-1 text-left text-sm font-medium truncate">
                            {item.label}
                          </span>
                        )}
                        {item.badge && !sidebarCollapsed && (
                          <span
                            className={cn(
                              "flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-medium",
                              item.active
                                ? "bg-sidebar-primary-foreground/20 text-sidebar-primary-foreground"
                                : "bg-primary/10 text-primary"
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </nav>

                {/* Collapse Toggle (Desktop Only) */}
                <div className="hidden md:block p-3 border-t border-sidebar-border">
                  <button
                    onClick={toggleSidebar}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg",
                      "text-sidebar-foreground hover:bg-sidebar-accent",
                      "transition-all duration-200",
                      sidebarCollapsed && "justify-center"
                    )}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={cn(
                        "transition-transform duration-200",
                        sidebarCollapsed && "rotate-180"
                      )}
                    >
                      <path d="m15 18-6-6 6-6" />
                    </svg>
                    {!sidebarCollapsed && (
                      <span className="text-sm font-medium">Collapse</span>
                    )}
                  </button>
                </div>
              </div>
            </aside>
          </>
        )}

        {/* Main Content Area */}
        <main
          className={cn(
            "pt-14 md:pt-16",
            bottomPlayer && "pb-20 md:pb-24",
            sidebar &&
              (sidebarCollapsed
                ? "md:pl-[72px]"
                : "md:pl-[240px]")
          )}
        >
          <div className="min-h-[calc(100vh-3.5rem)] md:min-h-[calc(100vh-4rem)]">
            {children}
          </div>
        </main>

        {/* Bottom Player */}
        {bottomPlayer && (
          <div className="fixed bottom-0 left-0 right-0 z-30">
            {bottomPlayer}
          </div>
        )}
      </div>
    );
  }
);

AppShell.displayName = "AppShell";
