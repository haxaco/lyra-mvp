import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Clock, TrendingUp } from 'lucide-react';
import { Button } from '../primitives/button';
import { Dialog, DialogContent, DialogDescription } from '../primitives/dialog';

interface MobileSearchModalProps {
  open: boolean;
  onClose: () => void;
}

export const MobileSearchModal: React.FC<MobileSearchModalProps> = ({ open, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches] = useState([
    'Upbeat morning playlist',
    'Calm evening',
    'Jazz for cafes',
    'Workout energy'
  ]);
  const [trendingSearches] = useState([
    'Lo-fi study music',
    'Retail background',
    'Happy hour vibes',
    'Spa relaxation'
  ]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && inputRef.current) {
      // Focus input when modal opens
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log('Searching for:', searchQuery);
      // Add your search logic here
      onClose();
    }
  };

  const handleQuickSearch = (query: string) => {
    setSearchQuery(query);
    console.log('Quick search:', query);
    // Add your search logic here
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl p-0 m-0 max-w-none h-full border-0 rounded-none md:hidden">
        <DialogDescription className="sr-only">
          Search for playlists, tracks, and more
        </DialogDescription>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b border-border/50">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-10 w-10 p-0 rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>
            
            <form onSubmit={handleSearchSubmit} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search playlists, songs, moods..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-12 pl-11 pr-4 bg-secondary/30 dark:bg-secondary/10 border-2 border-transparent focus:border-primary rounded-full text-sm text-foreground placeholder:text-muted-foreground focus:outline-none transition-all"
                />
              </div>
            </form>
          </div>

          {/* Search Results / Suggestions */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {searchQuery ? (
              // Show search results when typing
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Search Results
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {/* Results count would go here */}
                  </span>
                </div>
                
                <div className="space-y-2">
                  {/* Mock search results - replace with actual search */}
                  <div className="p-4 bg-card rounded-xl border border-border/50 hover:border-primary/50 active:scale-[0.98] transition-all">
                    <h4 className="font-medium mb-1">Morning Vibes Playlist</h4>
                    <p className="text-sm text-muted-foreground">12 tracks • 45 min</p>
                  </div>
                  <div className="p-4 bg-card rounded-xl border border-border/50 hover:border-primary/50 active:scale-[0.98] transition-all">
                    <h4 className="font-medium mb-1">Upbeat Workout Mix</h4>
                    <p className="text-sm text-muted-foreground">20 tracks • 1h 15min</p>
                  </div>
                  <div className="p-4 bg-card rounded-xl border border-border/50 hover:border-primary/50 active:scale-[0.98] transition-all">
                    <h4 className="font-medium mb-1">Calm Coffee Shop</h4>
                    <p className="text-sm text-muted-foreground">18 tracks • 58 min</p>
                  </div>
                </div>
              </div>
            ) : (
              // Show suggestions when empty
              <>
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                        Recent Searches
                      </h3>
                    </div>
                    
                    <div className="space-y-2">
                      {recentSearches.map((search, index) => (
                        <button
                          key={index}
                          onClick={() => handleQuickSearch(search)}
                          className="w-full flex items-center justify-between p-3 bg-secondary/30 dark:bg-secondary/10 rounded-xl hover:bg-secondary/50 dark:hover:bg-secondary/20 active:scale-[0.98] transition-all text-left group"
                        >
                          <span className="text-sm">{search}</span>
                          <Search className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trending Searches */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      Trending
                    </h3>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {trendingSearches.map((search, index) => (
                      <button
                        key={index}
                        onClick={() => handleQuickSearch(search)}
                        className="px-4 py-2 bg-gradient-coral text-white rounded-full text-sm hover:opacity-90 active:scale-95 transition-all shadow-sm"
                      >
                        {search}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-3 pt-4 border-t border-border/50">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Quick Actions
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleQuickSearch('upbeat')}
                      className="p-4 bg-card rounded-xl border border-border/50 hover:border-primary/50 active:scale-[0.98] transition-all text-left"
                    >
                      <div className="text-2xl mb-2">🎵</div>
                      <h4 className="font-medium text-sm mb-1">Browse Moods</h4>
                      <p className="text-xs text-muted-foreground">Find by vibe</p>
                    </button>
                    
                    <button
                      onClick={() => handleQuickSearch('genre')}
                      className="p-4 bg-card rounded-xl border border-border/50 hover:border-primary/50 active:scale-[0.98] transition-all text-left"
                    >
                      <div className="text-2xl mb-2">🎸</div>
                      <h4 className="font-medium text-sm mb-1">By Genre</h4>
                      <p className="text-xs text-muted-foreground">Explore styles</p>
                    </button>
                    
                    <button
                      onClick={() => handleQuickSearch('popular')}
                      className="p-4 bg-card rounded-xl border border-border/50 hover:border-primary/50 active:scale-[0.98] transition-all text-left"
                    >
                      <div className="text-2xl mb-2">⭐</div>
                      <h4 className="font-medium text-sm mb-1">Popular</h4>
                      <p className="text-xs text-muted-foreground">Top picks</p>
                    </button>
                    
                    <button
                      onClick={() => handleQuickSearch('new')}
                      className="p-4 bg-card rounded-xl border border-border/50 hover:border-primary/50 active:scale-[0.98] transition-all text-left"
                    >
                      <div className="text-2xl mb-2">✨</div>
                      <h4 className="font-medium text-sm mb-1">New Releases</h4>
                      <p className="text-xs text-muted-foreground">Latest tracks</p>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};