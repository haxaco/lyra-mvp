import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../primitives/card';
import { Button } from '../primitives/button';
import { Input } from '../primitives/input';
import { Label } from '../primitives/label';
import { Slider } from '../primitives/slider';
import { Badge } from '../primitives/badge';
import { Textarea } from '../primitives/textarea';
import { Switch } from '../primitives/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../primitives/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../primitives/tooltip';
import { ScrollArea } from '../primitives/scroll-area';
import { Progress } from '../primitives/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../primitives/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../primitives/collapsible';
import { 
  Sparkles, 
  Music, 
  Zap, 
  RotateCcw, 
  Settings2, 
  CheckCircle2, 
  Info,
  Lightbulb,
  Wand2,
  ArrowRight,
  ChevronRight,
  MessageSquare,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Types
interface TrackBlueprint {
  id: string;
  trackNumber: number;
  title: string;
  prompt: string;
  genre: string;
  energy: number;
  bpm: number;
}

interface AIFeedItem {
  id: string;
  timestamp: Date;
  message: string;
  type: 'suggestion' | 'analysis' | 'insight';
}

interface AISuggestion {
  id: string;
  title: string;
  description: string;
  genres: string[];
  moods: string[];
  energy: number;
  bpmMin: number;
  bpmMax: number;
  numTracks: number;
  thumbnail: string;
}

interface AIMessage {
  id: string;
  role: 'ai' | 'user';
  content: string;
  timestamp: Date;
  actionChips?: ActionChip[];
  suggestion?: AISuggestion;
}

interface ActionChip {
  id: string;
  label: string;
  action: 'apply' | 'regenerate' | 'explain';
  data?: AISuggestion;
}

type PlaylistState = 'idle' | 'advanced' | 'generating' | 'completed' | 'error' | 'enriching' | 'enriched' | 'applying';

interface PlaylistComposerProps {
  onPlayTrack?: (track: TrackBlueprint) => void;
  onPlaylistGenerated?: (playlist: GeneratedPlaylist) => void;
  // Authentication props
  orgId?: string;
  userId?: string;
  baseUrl?: string;
  // Live compose state (optional - if not provided, component will work in standalone mode)
  liveComposeState?: {
    sessionId: string | null;
    isStreaming: boolean;
    suggestions: any[] | null;
    config: any | null;
    blueprints: any[] | null;
    isUpdating: boolean;
    error: string | null;
    startCompose: (brief: string) => Promise<void>;
    updateBrief: (brief: string) => void;
    regenerateBlueprints: (brief: string) => Promise<void>;
    clearAll: () => void;
  };
}

interface GeneratedPlaylist {
  id: string;
  name: string;
  description: string;
  tracks: Array<{
    id: string;
    title: string;
    artist: string;
    duration: string;
    album: string;
    genre: string;
    energy: number;
    bpm: number;
  }>;
  genres: string[];
  moods: string[];
  energy: number;
  createdAt: Date;
}

// Mock Data
const MOOD_OPTIONS = [
  'Energetic', 'Calm', 'Happy', 'Melancholic', 'Romantic', 'Mysterious',
  'Uplifting', 'Dark', 'Dreamy', 'Nostalgic', 'Motivational', 'Peaceful', 'Focused'
];

const GENRE_OPTIONS = [
  'Pop', 'Rock', 'Jazz', 'Classical', 'Electronic', 'Hip Hop', 'R&B', 'Country',
  'Folk', 'Ambient', 'Lo-fi', 'Indie', 'Alternative', 'House', 'Techno', 'Chillhop'
];

const AI_MODELS = [
  { value: 'lyra-pro', label: 'Lyra Pro (Best Quality)' },
  { value: 'lyra-fast', label: 'Lyra Fast (Quick Generation)' },
  { value: 'lyra-creative', label: 'Lyra Creative (Experimental)' }
];





export const PlaylistComposer: React.FC<PlaylistComposerProps> = ({ 
  onPlaylistGenerated, 
  orgId, 
  userId, 
  baseUrl = process.env.NEXT_PUBLIC_APP_URL || "",
  liveComposeState
}) => {
  // Hydration check
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Check if we have authentication data
  const isAuthenticated = !!(orgId && userId);

  // Use live compose state if provided, otherwise use local state
  const sessionId = liveComposeState?.sessionId || null;
  const isStreaming = liveComposeState?.isStreaming || false;
  const liveSuggestions = liveComposeState?.suggestions || null;
  const liveConfig = liveComposeState?.config || null;
  const liveBlueprints = liveComposeState?.blueprints || null;
  const isUpdating = liveComposeState?.isUpdating || false;
  const liveError = liveComposeState?.error || null;
  const startCompose = liveComposeState?.startCompose || (async () => {});
  const updateBrief = liveComposeState?.updateBrief || (() => {});
  const regenerateBlueprints = liveComposeState?.regenerateBlueprints || (async () => {});
  const clearLiveAll = liveComposeState?.clearAll || (() => {});

  // State
  const [state, setState] = useState<PlaylistState>('idle');
  const [brief, setBrief] = useState('');
  const [energy, setEnergy] = useState([6]);
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [bpmMin, setBpmMin] = useState(70);
  const [bpmMax, setBpmMax] = useState(110);
  const [numTracks, setNumTracks] = useState(5);
  const [familyFriendly, setFamilyFriendly] = useState(true);
  const [selectedModel, setSelectedModel] = useState('lyra-pro');
  const [tracks, setTracks] = useState<TrackBlueprint[]>([]);
  const [, setAiFeed] = useState<AIFeedItem[]>([]);
  const [progress, setProgress] = useState(0);
  
  // AI Composer State
  const [activeTab, setActiveTab] = useState<'suggestions' | 'feed'>('feed');
  const [aiFeedback, setAIFeedback] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [applyingSetup, setApplyingSetup] = useState(false);
  const [chatMessages, setChatMessages] = useState<AIMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  // Collapsible State
  const [parametersOpen, setParametersOpen] = useState(true);
  const [advancedMode, setAdvancedMode] = useState(false);

  // Initialize with welcome message when authenticated
  useEffect(() => {
    if (isAuthenticated && isMounted && chatMessages.length === 0) {
      addChatMessage({
        role: 'ai',
        content: 'Hi! I\'m Lyra, your AI music composer. Describe your playlist vision and I\'ll help you create the perfect soundtrack!'
      });
    }
  }, [isAuthenticated, isMounted, chatMessages.length]);

  // Handle brief changes with debouncing
  const handleBriefChange = (newBrief: string) => {
    setBrief(newBrief);
    
    // Start AI composition when user first enters a brief
    if (isAuthenticated && newBrief.trim() && !sessionId) {
      startCompose(newBrief);
    } else if (isAuthenticated && sessionId && newBrief.trim()) {
      updateBrief(newBrief);
    }
  };

  // Sync live suggestions with local state
  useEffect(() => {
    if (liveSuggestions && liveSuggestions.length > 0) {
      const formattedSuggestions = liveSuggestions.map((suggestion: any, index: number) => ({
        id: `live-${index}`,
        title: suggestion.title || `Suggestion ${index + 1}`,
        description: suggestion.notes?.join(', ') || 'AI-generated suggestion',
        genres: suggestion.genres || [],
        energy: suggestion.energy || 5,
        moods: suggestion.moods || [],
        bpmMin: suggestion.bpmRange?.[0] || 80,
        bpmMax: suggestion.bpmRange?.[1] || 120,
        numTracks: suggestion.tracks || 6,
        thumbnail: `https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop&ixlib=rb-4.0.3&ixid=${index}`
      }));
      setSuggestions(formattedSuggestions);
      setIsTyping(false);
    }
  }, [liveSuggestions]);

  // Sync live config with local state
  useEffect(() => {
    if (liveConfig) {
      // Update local state with live config data
      if (liveConfig.genres) setSelectedGenres(liveConfig.genres);
      if (liveConfig.energy) setEnergy([liveConfig.energy]);
      if (liveConfig.moods) setSelectedMoods(liveConfig.moods);
      if (liveConfig.bpmRange) {
        setBpmMin(liveConfig.bpmRange[0]);
        setBpmMax(liveConfig.bpmRange[1]);
      }
      if (liveConfig.tracks) setNumTracks(liveConfig.tracks);
      if (liveConfig.familyFriendly !== undefined) setFamilyFriendly(liveConfig.familyFriendly);
      
      addChatMessage({
        role: 'ai',
        content: '✨ I\'ve analyzed your brief and generated a configuration! Check the suggestions tab to see options.'
      });
    }
  }, [liveConfig]);

  // Sync live blueprints with local state
  useEffect(() => {
    if (liveBlueprints && liveBlueprints.length > 0) {
      const formattedTracks = liveBlueprints.map((blueprint: any, index: number) => ({
        id: `track-${index}`,
        trackNumber: index + 1,
        title: blueprint.title || `Track ${index + 1}`,
        prompt: blueprint.prompt || '',
        genre: blueprint.genre || 'Electronic',
        energy: blueprint.energy || 5,
        bpm: blueprint.bpm || 120
      }));
      setTracks(formattedTracks);
      
      addChatMessage({
        role: 'ai',
        content: `🎵 Generated ${liveBlueprints.length} track blueprints! Ready to create your playlist.`
      });
    }
  }, [liveBlueprints]);

  // Handle live compose errors
  useEffect(() => {
    if (liveError) {
      setIsTyping(false);
      addChatMessage({
        role: 'ai',
        content: `❌ Error: ${liveError}`
      });
      setState('idle');
    }
  }, [liveError]);

  // Regenerate blueprints when creative parameters change (if we have a session and brief)
  useEffect(() => {
    if (isAuthenticated && sessionId && brief.trim() && liveConfig) {
      // Debounce parameter changes to avoid excessive API calls
      const timeoutId = setTimeout(() => {
        regenerateBlueprints(brief);
      }, 2000); // 2 second debounce for parameter changes

      return () => clearTimeout(timeoutId);
    }
  }, [energy, selectedMoods, selectedGenres, bpmMin, bpmMax, numTracks, familyFriendly, selectedModel, isAuthenticated, sessionId, brief, liveConfig, regenerateBlueprints]);

  // Cleanup EventSource on unmount
  useEffect(() => {
    return () => {
      if ((window as any).currentJobEventSource) {
        (window as any).currentJobEventSource.close();
        (window as any).currentJobEventSource = null;
      }
    };
  }, []);

  // Toggle functions
  const toggleMood = (mood: string) => {
    setSelectedMoods(prev =>
      prev.includes(mood) ? prev.filter(m => m !== mood) : [...prev, mood]
    );
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev =>
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );
  };

  const updateTrack = (id: string, updates: Partial<TrackBlueprint>) => {
    setTracks(prev => prev.map(track => 
      track.id === id ? { ...track, ...updates } : track
    ));
  };

  const regenerateTrackSuggestion = (id: string) => {
    const track = tracks.find(t => t.id === id);
    if (track) {
      const newTitle = `${['Sunrise', 'Moonlight', 'Harmony', 'Rhythm', 'Melody'][Math.floor(Math.random() * 5)]} ${track.trackNumber}`;
      updateTrack(id, { title: newTitle });
      
      addAIFeedItem({
        message: `Regenerated suggestion for Track ${track.trackNumber}: "${newTitle}"`,
        type: 'suggestion'
      });
    }
  };

  const addAIFeedItem = (item: Omit<AIFeedItem, 'id' | 'timestamp'>) => {
    setAiFeed(prev => [...prev, {
      id: Date.now().toString(),
      timestamp: new Date(),
      ...item
    }]);
  };

  const addChatMessage = (message: Omit<AIMessage, 'id' | 'timestamp'>) => {
    setChatMessages(prev => [...prev, {
      id: Date.now().toString(),
      timestamp: new Date(),
      ...message
    }]);
  };

  const handleEnrichWithAI = async () => {
    if (!isAuthenticated || !orgId || !userId) {
      addChatMessage({
        role: 'ai',
        content: 'Please log in to use AI features.'
      });
      return;
    }

    if (!brief.trim()) {
      addChatMessage({
        role: 'ai',
        content: 'Please enter a brief description of your playlist vision first!'
      });
      return;
    }

    setState('enriching');
    setActiveTab('feed');
    setAIFeedback([]);
    setIsTyping(true);
    
    try {
      // Start live compose session with current brief
      await startCompose(brief);
      
      addChatMessage({
        role: 'ai',
        content: '🎵 Starting AI analysis of your brief...'
      });
      
      // The live compose will handle the rest via the onComplete callback
      setState('enriched');
    } catch (error: any) {
      console.error('Error starting AI enrichment:', error);
      setIsTyping(false);
      addChatMessage({
        role: 'ai',
        content: `❌ Error: ${error?.message || 'Failed to start AI analysis'}`
      });
      setState('idle');
    }
  };

  const handleActionChip = (chip: ActionChip) => {
    if (chip.action === 'apply' && chip.data) {
      applyAISuggestion(chip.data);
      addChatMessage({
        role: 'user',
        content: `Applied "${chip.data.title}" configuration`
      });
      
      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          addChatMessage({
            role: 'ai',
            content: 'Perfect! I\'ve updated your parameters. This setup will give you that warm cafe atmosphere you\'re looking for. Ready to generate when you are! 🎶'
          });
        }, 1500);
      }, 800);
    } else if (chip.action === 'regenerate') {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        addChatMessage({
          role: 'ai',
          content: 'Let me think of some alternative directions... How about trying a more upbeat afternoon vibe, or perhaps something even more minimal and ambient?'
        });
      }, 2000);
    } else if (chip.action === 'explain') {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        addChatMessage({
          role: 'ai',
          content: 'Here\'s my reasoning: Cafes need music that supports conversation, not competes with it. The 80-100 BPM range keeps energy present but relaxed. Jazz brings sophistication, Indie adds warmth and familiarity, and Lo-fi provides that cozy, textural quality. Together, they create a welcoming sonic environment that makes people want to stay longer. ☕'
        });
      }, 2500);
    }
  };

  const applyAISuggestion = (suggestion: AISuggestion) => {
    setApplyingSetup(true);
    setState('applying');
    
    setTimeout(() => {
      setEnergy([suggestion.energy]);
      setSelectedMoods(suggestion.moods);
      setSelectedGenres(suggestion.genres);
      setBpmMin(suggestion.bpmMin);
      setBpmMax(suggestion.bpmMax);
      setNumTracks(suggestion.numTracks);
      
      addAIFeedItem({
        message: `Applied "${suggestion.title}" configuration`,
        type: 'insight'
      });
      
      setTimeout(() => {
        setApplyingSetup(false);
        setState('enriched');
      }, 800);
    }, 300);
  };

  const handleGenerate = async () => {
    if (!isAuthenticated || !orgId || !userId || !liveConfig || !liveBlueprints?.length) {
      addChatMessage({
        role: 'ai',
        content: '❌ Please wait for AI analysis to complete before generating.'
      });
      return;
    }

    setState('generating');
    setProgress(0);
    
    try {
      // 1) Enqueue playlist generation job
      addChatMessage({
        role: 'ai',
        content: '🚀 Starting playlist generation...'
      });

      const res = await fetch(`${baseUrl}/api/compose/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: liveConfig,
          blueprints: liveBlueprints,
        }),
      });
      
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json?.error || `HTTP ${res.status}`);
      }
      
      const jobId = json.jobId;
      addChatMessage({
        role: 'ai',
        content: `✅ Job enqueued: ${jobId}`
      });

      // 2) Subscribe to job SSE for progress updates
      const streamUrl = `${baseUrl}/api/jobs/${encodeURIComponent(jobId)}/events`;
      const es = new EventSource(streamUrl);
      let jobCompleted = false; // Track if job completed successfully

      es.onmessage = async (e) => {
        try {
          const evt = JSON.parse(e.data);
          
          if (evt.type === "log") {
            addChatMessage({
              role: 'ai',
              content: `🔧 ${evt.data?.message || ""}`
            });
          }
          
          if (evt.type === "progress") {
            const progressPct = evt.data?.progress_pct || 0;
            setProgress(progressPct);
            addChatMessage({
              role: 'ai',
              content: `⏩ Progress: ${progressPct}% - ${evt.data?.message || ""}`
            });
          }
          
          if (evt.type === "succeeded") {
            jobCompleted = true; // Mark job as completed
            setProgress(100);
            setState('completed');
            
            // Close connection after a small delay to ensure jobCompleted flag is set
            setTimeout(() => {
              es.close();
            }, 100);
            
            addChatMessage({
              role: 'ai',
              content: '🎉 Your playlist is ready! I\'ve composed ' + liveBlueprints.length + ' unique tracks that capture that cozy cafe vibe perfectly. Each one flows naturally into the next. Enjoy!'
            });
            
            // Call onPlaylistGenerated with real data
            if (onPlaylistGenerated && evt.data?.result?.playlistId) {
              const generatedPlaylist = {
                id: evt.data.result.playlistId,
                name: liveConfig.playlistTitle || brief.substring(0, 50) || 'New Playlist',
                description: `AI-generated playlist based on: ${brief}`,
                tracks: evt.data.result.tracks || [],
                // include required summary fields
                genres: liveConfig.genres || selectedGenres,
                moods: liveConfig.moods || selectedMoods,
                energy: liveConfig.energy || energy[0],
                createdAt: new Date()
              };
              onPlaylistGenerated(generatedPlaylist);
            }
          }
          
          if (evt.type === "failed") {
            jobCompleted = true; // Mark job as completed (even if failed)
            setState('error');
            
            // Close connection after a small delay to ensure jobCompleted flag is set
            setTimeout(() => {
              es.close();
            }, 100);
            addChatMessage({
              role: 'ai',
              content: `❌ Generation failed: ${evt.data?.error || 'Unknown error'}`
            });
          }
        } catch (parseError) {
          console.error('Error parsing SSE event:', parseError);
        }
      };

      es.onerror = (error) => {
        console.log('SSE connection event:', error);
        
        // When job completes, server closes connection which triggers this event
        // This is normal behavior, not an error
        if (jobCompleted) {
          console.log('SSE connection closed after successful job completion');
          es.close();
          return;
        }
        
        // Check if the connection is already closed (readyState 2 = CLOSED)
        if (es.readyState === EventSource.CLOSED) {
          console.log('SSE connection already closed');
          return;
        }
        
        // Only treat as actual error if job hasn't completed and connection isn't closed
        console.error('SSE error during job execution:', error);
        es.close();
        setState('error');
        addChatMessage({
          role: 'ai',
          content: '❌ Connection error during generation'
        });
      };

      // Store EventSource for cleanup
      (window as any).currentJobEventSource = es;

    } catch (error: any) {
      console.error('Error starting generation:', error);
      setState('error');
      addChatMessage({
        role: 'ai',
        content: `❌ Error: ${error?.message || 'Failed to start generation'}`
      });
    }
  };

  const handleCancel = () => {
    if ((window as any).currentJobEventSource) {
      (window as any).currentJobEventSource.close();
      (window as any).currentJobEventSource = null;
    }
    setState('idle');
    setProgress(0);
    addChatMessage({
      role: 'ai',
      content: '⏹️ Generation cancelled'
    });
  };

  // Prevent hydration mismatch by only rendering on client
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1A1816] via-[#242220] to-[#1A1816] pb-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/70">Loading Playlist Composer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A1816] via-[#242220] to-[#1A1816] pb-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Gradient Waves */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-[#FF6F61] to-[#E6B8C2] rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-br from-[#FF8A80] to-[#F5CBA7] rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-12">
          {/* Header with Generate Button */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-[#FF6F61] to-[#FF8A80] shadow-lg">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl bg-gradient-to-r from-[#FF6F61] via-[#E6B8C2] to-[#FF8A80] bg-clip-text text-transparent">
                  Compose a Playlist
                </h1>
                <p className="text-sm text-[#B8ADA8] mt-1">
                  {selectedGenres.length} genres • {selectedMoods.length} moods • {bpmMin}-{bpmMax} BPM
                </p>
              </div>
            </div>

            {/* Generate Button */}
            <Button
              onClick={state === 'generating' ? handleCancel : handleGenerate}
              size="lg"
              className={`group relative overflow-hidden transition-all duration-300 text-white border-0 px-8 ${
                state === 'generating' 
                  ? 'bg-gradient-to-r from-red-500 to-red-600 hover:shadow-2xl hover:shadow-red-500/50' 
                  : 'bg-gradient-to-r from-[#FF6F61] to-[#FF8A80] hover:shadow-2xl hover:shadow-[#FF6F61]/50'
              }`}
            >
              <span className="relative z-10 flex items-center gap-2">
                {state === 'generating' ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Cancel Generation
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Playlist
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-[#FF8A80] to-[#E6B8C2] opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>
          </motion.div>

          {/* Main Content Grid - Always 2 columns */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column - Collapsible Sections */}
            <div className="lg:col-span-8 space-y-6">
              {/* Playlist Brief Panel */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="bg-[#242220]/80 backdrop-blur-xl border-[#FF6F61]/20 shadow-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-[#FAF9F7]">
                      <Lightbulb className="w-5 h-5 text-[#FF8A80]" />
                      Brand Brief
                    </CardTitle>
                    <CardDescription className="text-[#B8ADA8]">
                      Tell Lyra about your space, audience, and desired atmosphere
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      value={brief}
                      onChange={(e) => handleBriefChange(e.target.value)}
                      placeholder="Describe your playlist vision... e.g., 'Morning energy mix for a cozy neighborhood cafe' or 'Upbeat workout playlist for gym sessions'"
                      className="min-h-32 bg-[#1A1816] border-[#FF6F61]/20 text-[#FAF9F7] placeholder:text-[#6B5B5B] focus:border-[#FF8A80] focus:ring-[#FF8A80]/20 resize-none text-lg"
                    />
                    
                    {/* AI Feedback Section */}
                    <AnimatePresence>
                      {aiFeedback.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-2 pt-4 border-t border-[#FF6F61]/10"
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="w-4 h-4 text-[#FF8A80]" />
                            <span className="text-sm text-[#FF8A80]">AI Insights</span>
                          </div>
                          {aiFeedback.map((feedback, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="flex items-start gap-2 text-sm text-[#B8ADA8] bg-[#1A1816]/50 p-3 rounded-lg border border-[#FF6F61]/10"
                            >
                              <CheckCircle2 className="w-4 h-4 text-[#FF8A80] mt-0.5 flex-shrink-0" />
                              <span>{feedback}</span>
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Collapsible Creative Parameters */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Collapsible open={parametersOpen} onOpenChange={setParametersOpen}>
                  <Card className={`bg-[#242220]/80 backdrop-blur-xl border-[#FF6F61]/20 shadow-2xl transition-all duration-500 ${
                    applyingSetup ? 'ring-2 ring-[#FF8A80] shadow-[0_0_30px_rgba(255,138,128,0.3)]' : ''
                  }`}>
                    <CollapsibleTrigger className="w-full">
                      <CardHeader className="cursor-pointer hover:bg-[#FF6F61]/5 transition-colors">
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2 text-[#FAF9F7]">
                            <Settings2 className="w-5 h-5 text-[#FF8A80]" />
                            Creative Parameters
                          </CardTitle>
                          {parametersOpen ? (
                            <ChevronUp className="w-5 h-5 text-[#B8ADA8]" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-[#B8ADA8]" />
                          )}
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="space-y-8 pt-0">
                        {/* Energy Slider */}
                        <motion.div 
                          className="space-y-3"
                          animate={applyingSetup ? { scale: [1, 1.02, 1] } : {}}
                          transition={{ duration: 0.5 }}
                        >
                          <div className="flex items-center justify-between">
                            <Label className="text-[#FAF9F7] flex items-center gap-2">
                              <Zap className="w-4 h-4 text-[#FF8A80]" />
                              Energy Level
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Info className="w-4 h-4 text-[#6B5B5B]" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Energy defines how lively or calm your playlist feels</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </Label>
                            <span className="text-[#FF8A80] font-semibold">{energy[0]}/10</span>
                          </div>
                          <Slider
                            value={energy}
                            onValueChange={setEnergy}
                            min={1}
                            max={10}
                            step={1}
                            className="[&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-[#FF6F61] [&_[role=slider]]:to-[#FF8A80]"
                          />
                          <div className="flex justify-between text-xs text-[#6B5B5B]">
                            <span>Calm</span>
                            <span>Balanced</span>
                            <span>Energetic</span>
                          </div>
                        </motion.div>

                        {/* Mood Selection */}
                        <motion.div 
                          className="space-y-3"
                          animate={applyingSetup ? { scale: [1, 1.02, 1] } : {}}
                          transition={{ duration: 0.5, delay: 0.1 }}
                        >
                          <Label className="text-[#FAF9F7] flex items-center gap-2">
                            <Music className="w-4 h-4 text-[#FF8A80]" />
                            Mood
                          </Label>
                          <div className="flex flex-wrap gap-2">
                            {MOOD_OPTIONS.map(mood => (
                              <Badge
                                key={mood}
                                variant={selectedMoods.includes(mood) ? 'default' : 'outline'}
                                className={`cursor-pointer transition-all ${
                                  selectedMoods.includes(mood)
                                    ? 'bg-gradient-to-r from-[#FF6F61] to-[#FF8A80] text-white border-0 hover:shadow-lg hover:shadow-[#FF6F61]/50'
                                    : 'border-[#FF6F61]/30 text-[#B8ADA8] hover:border-[#FF8A80] hover:text-[#FAF9F7]'
                                }`}
                                onClick={() => toggleMood(mood)}
                              >
                                {mood}
                              </Badge>
                            ))}
                          </div>
                        </motion.div>

                        {/* Genre Selection */}
                        <motion.div 
                          className="space-y-3"
                          animate={applyingSetup ? { scale: [1, 1.02, 1] } : {}}
                          transition={{ duration: 0.5, delay: 0.2 }}
                        >
                          <Label className="text-[#FAF9F7]">Genres</Label>
                          <div className="flex flex-wrap gap-2">
                            {GENRE_OPTIONS.map(genre => (
                              <Badge
                                key={genre}
                                variant={selectedGenres.includes(genre) ? 'default' : 'outline'}
                                className={`cursor-pointer transition-all ${
                                  selectedGenres.includes(genre)
                                    ? 'bg-gradient-to-r from-[#E6B8C2] to-[#F5CBA7] text-[#2B2B2B] border-0 hover:shadow-lg'
                                    : 'border-[#E6B8C2]/30 text-[#B8ADA8] hover:border-[#E6B8C2] hover:text-[#FAF9F7]'
                                }`}
                                onClick={() => toggleGenre(genre)}
                              >
                                {genre}
                              </Badge>
                            ))}
                          </div>
                        </motion.div>

                        {/* BPM Range */}
                        <motion.div 
                          className="grid grid-cols-2 gap-4"
                          animate={applyingSetup ? { scale: [1, 1.02, 1] } : {}}
                          transition={{ duration: 0.5, delay: 0.3 }}
                        >
                          <div className="space-y-2">
                            <Label className="text-[#FAF9F7]">BPM Min</Label>
                            <Input
                              type="number"
                              value={bpmMin}
                              onChange={(e) => setBpmMin(Number(e.target.value))}
                              className="bg-[#1A1816] border-[#FF6F61]/20 text-[#FAF9F7]"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[#FAF9F7]">BPM Max</Label>
                            <Input
                              type="number"
                              value={bpmMax}
                              onChange={(e) => setBpmMax(Number(e.target.value))}
                              className="bg-[#1A1816] border-[#FF6F61]/20 text-[#FAF9F7]"
                            />
                          </div>
                        </motion.div>

                        {/* Number of Tracks & Family Friendly */}
                        <motion.div 
                          className="grid grid-cols-2 gap-4"
                          animate={applyingSetup ? { scale: [1, 1.02, 1] } : {}}
                          transition={{ duration: 0.5, delay: 0.4 }}
                        >
                          <div className="space-y-2">
                            <Label className="text-[#FAF9F7]">Number of Tracks</Label>
                            <Input
                              type="number"
                              value={numTracks}
                              onChange={(e) => setNumTracks(Number(e.target.value))}
                              min={1}
                              max={20}
                              className="bg-[#1A1816] border-[#FF6F61]/20 text-[#FAF9F7]"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[#FAF9F7]">Family-Friendly</Label>
                            <div className="flex items-center h-10">
                              <Switch
                                checked={familyFriendly}
                                onCheckedChange={setFamilyFriendly}
                                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#FF6F61] data-[state=checked]:to-[#FF8A80]"
                              />
                              <span className="ml-3 text-sm text-[#B8ADA8]">
                                {familyFriendly ? 'Enabled' : 'Disabled'}
                              </span>
                            </div>
                          </div>
                        </motion.div>

                        {/* Model Selector */}
                        <div className="space-y-2">
                          <Label className="text-[#FAF9F7]">AI Model</Label>
                          <Select value={selectedModel} onValueChange={setSelectedModel}>
                            <SelectTrigger className="bg-[#1A1816] border-[#FF6F61]/20 text-[#FAF9F7]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#242220] border-[#FF6F61]/20">
                              {AI_MODELS.map(model => (
                                <SelectItem key={model.value} value={model.value} className="text-[#FAF9F7]">
                                  {model.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Advanced Mode Toggle */}
                        <div className="pt-4 border-t border-[#FF6F61]/10">
                          <div className="flex items-center justify-between p-4 rounded-xl bg-[#1A1816] border border-[#FF6F61]/20 hover:border-[#FF8A80]/40 transition-all">
                            <div className="flex items-center gap-3">
                              <Wand2 className="w-5 h-5 text-[#FF8A80]" />
                              <div>
                                <p className="text-[#FAF9F7] font-semibold">Advanced Mode</p>
                                <p className="text-sm text-[#6B5B5B]">Fine-tune each track before generation</p>
                              </div>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Info className="w-4 h-4 text-[#6B5B5B]" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Advanced Mode lets you fine-tune Lyra's ideas before generating</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <Switch
                              checked={advancedMode}
                              onCheckedChange={setAdvancedMode}
                              className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#FF6F61] data-[state=checked]:to-[#FF8A80]"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              </motion.div>

              {/* Collapsible Advanced Mode - Track Blueprints */}
              <AnimatePresence>
                {advancedMode && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Collapsible defaultOpen>
                      <Card className="bg-[#242220]/80 backdrop-blur-xl border-[#FF6F61]/20 shadow-2xl">
                        <CollapsibleTrigger className="w-full">
                          <CardHeader className="cursor-pointer hover:bg-[#FF6F61]/5 transition-colors">
                            <div className="flex items-center justify-between">
                              <CardTitle className="flex items-center gap-2 text-[#FAF9F7]">
                                <Music className="w-5 h-5 text-[#FF8A80]" />
                                Track Blueprints
                              </CardTitle>
                              <ChevronDown className="w-5 h-5 text-[#B8ADA8]" />
                            </div>
                          </CardHeader>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <CardContent className="pt-0">
                            <ScrollArea className="h-[600px] pr-4">
                              <div className="space-y-4">
                                {tracks.map((track, index) => (
                                  <TrackBlueprintCard
                                    key={track.id}
                                    track={track}
                                    index={index}
                                    onUpdate={updateTrack}
                                    onRegenerate={regenerateTrackSuggestion}
                                  />
                                ))}
                              </div>
                            </ScrollArea>
                          </CardContent>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Generation Progress */}
              <AnimatePresence>
                {state === 'generating' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                  >
                    <Card className="bg-[#242220]/80 backdrop-blur-xl border-[#FF6F61]/20">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="p-3 rounded-full bg-gradient-to-r from-[#FF6F61] to-[#FF8A80] animate-pulse">
                            <Sparkles className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-[#FAF9F7]">Generating Your Playlist...</h3>
                            <p className="text-sm text-[#B8ADA8]">Lyra is composing {numTracks} unique tracks</p>
                          </div>
                        </div>
                        <Progress value={progress} className="h-2 bg-[#1A1816]" />
                        <p className="text-sm text-[#6B5B5B] mt-2">{progress}% complete</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Completion Message */}
              <AnimatePresence>
                {state === 'completed' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <Card className="bg-gradient-to-r from-[#FF6F61]/20 to-[#FF8A80]/20 backdrop-blur-xl border-[#FF8A80]">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <CheckCircle2 className="w-8 h-8 text-[#FF8A80]" />
                          <div>
                            <h3 className="text-[#FAF9F7] text-xl">Playlist Generated Successfully!</h3>
                            <p className="text-[#B8ADA8]">Redirecting to your new playlist...</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right Column - AI Composer (Always Visible) */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: 'spring', damping: 20 }}
              className="lg:col-span-4"
            >
              <AIComposerSidebar
                activeTab={activeTab}
                onTabChange={setActiveTab}
                suggestions={suggestions}
                messages={chatMessages}
                isTyping={isTyping}
                onApply={applyAISuggestion}
                onActionChip={handleActionChip}
                isEnriching={state === 'enriching'}
              />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

// AI Composer Sidebar Component with Tabs (Always Visible)
interface AIComposerSidebarProps {
  activeTab: 'suggestions' | 'feed';
  onTabChange: (tab: 'suggestions' | 'feed') => void;
  suggestions: AISuggestion[];
  messages: AIMessage[];
  isTyping: boolean;
  onApply: (suggestion: AISuggestion) => void;
  onActionChip: (chip: ActionChip) => void;
  isEnriching: boolean;
}

const AIComposerSidebar: React.FC<AIComposerSidebarProps> = ({ 
  activeTab,
  onTabChange,
  suggestions, 
  messages,
  isTyping,
  onApply, 
  onActionChip,
  isEnriching 
}) => {
  return (
    <Card className="bg-[#242220]/90 backdrop-blur-2xl border-[#FF6F61]/30 shadow-2xl sticky top-6 overflow-hidden">
      {/* Glass effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#FF6F61]/10 via-transparent to-[#E6B8C2]/10 pointer-events-none" />
      
      <CardHeader className="relative pb-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-[#FAF9F7]">
            <span className="text-2xl">🎵</span>
            AI Composer
          </CardTitle>
          <CardDescription className="text-[#B8ADA8] mt-2">
            Lyra's creative insights and suggestions
          </CardDescription>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v: string) => onTabChange(v as 'suggestions' | 'feed')} className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-2 bg-[#1A1816]/50">
            <TabsTrigger 
              value="suggestions" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FF6F61] data-[state=active]:to-[#FF8A80] data-[state=active]:text-white"
            >
              Suggestions
            </TabsTrigger>
            <TabsTrigger 
              value="feed"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FF6F61] data-[state=active]:to-[#FF8A80] data-[state=active]:text-white"
            >
              <MessageSquare className="w-4 h-4 mr-1" />
              Feed
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      
      <CardContent className="relative p-0">
        <Tabs value={activeTab} className="w-full">
          {/* Suggestions Tab */}
          <TabsContent value="suggestions" className="m-0 p-4">
            {isEnriching ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-48 bg-[#1A1816]/50 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : suggestions.length > 0 ? (
              <ScrollArea className="h-[calc(100vh-280px)]">
                <div className="space-y-4 pr-4">
                  {suggestions.map((suggestion, index) => (
                    <AISuggestionCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      index={index}
                      onApply={() => onApply(suggestion)}
                    />
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Wand2 className="w-12 h-12 text-[#6B5B5B] mb-3" />
                <p className="text-[#B8ADA8]">AI is analyzing your brief...</p>
              </div>
            )}
          </TabsContent>

          {/* Feed Tab */}
          <TabsContent value="feed" className="m-0 p-4">
            <ScrollArea className="h-[calc(100vh-280px)]">
              <div className="space-y-4 pr-4">
                {messages.map((message, index) => (
                  <AIMessageBubble
                    key={message.id}
                    message={message}
                    index={index}
                    onActionChip={onActionChip}
                  />
                ))}
                
                {/* Typing Indicator */}
                <AnimatePresence>
                  {isTyping && <AITypingIndicator />}
                </AnimatePresence>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

// AI Message Bubble Component
interface AIMessageBubbleProps {
  message: AIMessage;
  index: number;
  onActionChip: (chip: ActionChip) => void;
}

const AIMessageBubble: React.FC<AIMessageBubbleProps> = ({ message, index, onActionChip }) => {
  const isAI = message.role === 'ai';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      className={`flex gap-3 ${isAI ? 'flex-row' : 'flex-row-reverse'}`}
    >
      {/* Avatar */}
      {isAI && (
        <div className="flex-shrink-0 mt-1">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF6F61] to-[#FF8A80] flex items-center justify-center shadow-lg ring-2 ring-[#FF6F61]/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        </div>
      )}

      <div className={`flex-1 ${isAI ? 'max-w-[85%]' : 'max-w-[75%]'}`}>
        {/* Message Bubble */}
        <div
          className={`rounded-2xl p-4 ${
            isAI
              ? 'bg-gradient-to-br from-[#FF6F61]/10 to-[#E6B8C2]/10 border border-[#FF6F61]/20'
              : 'bg-[#1A1816]/80 border border-[#6B5B5B]/20'
          }`}
        >
          <p className="text-sm text-[#FAF9F7] leading-relaxed">{message.content}</p>
          
          {/* Action Chips */}
          {message.actionChips && message.actionChips.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[#FF6F61]/10">
              {message.actionChips.map((chip) => (
                <FeedActionChip
                  key={chip.id}
                  chip={chip}
                  onClick={() => onActionChip(chip)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Timestamp */}
        <p className="text-xs text-[#6B5B5B] mt-1.5 px-2">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </motion.div>
  );
};

// Feed Action Chip Component
interface FeedActionChipProps {
  chip: ActionChip;
  onClick: () => void;
}

const FeedActionChip: React.FC<FeedActionChipProps> = ({ chip, onClick }) => {
  return (
    <Button
      onClick={onClick}
      size="sm"
      className="h-8 bg-gradient-to-r from-[#FF6F61]/20 to-[#FF8A80]/20 hover:from-[#FF6F61] hover:to-[#FF8A80] border border-[#FF6F61]/40 hover:border-[#FF8A80] text-[#FAF9F7] hover:text-white transition-all duration-300 text-xs"
    >
      {chip.action === 'apply' && <CheckCircle2 className="w-3 h-3 mr-1.5" />}
      {chip.action === 'regenerate' && <RotateCcw className="w-3 h-3 mr-1.5" />}
      {chip.action === 'explain' && <Info className="w-3 h-3 mr-1.5" />}
      {chip.label}
    </Button>
  );
};

// AI Typing Indicator Component
const AITypingIndicator: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="flex gap-3"
    >
      <div className="flex-shrink-0 mt-1">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF6F61] to-[#FF8A80] flex items-center justify-center shadow-lg ring-2 ring-[#FF6F61]/20 animate-pulse">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
      </div>
      <div className="flex-1 max-w-[85%]">
        <div className="rounded-2xl p-4 bg-gradient-to-br from-[#FF6F61]/10 to-[#E6B8C2]/10 border border-[#FF6F61]/20">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#B8ADA8] italic">Lyra is composing ideas</span>
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-[#FF8A80]"
                  animate={{
                    opacity: [0.3, 1, 0.3],
                    scale: [0.8, 1, 0.8]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// AI Suggestion Card Component
interface AISuggestionCardProps {
  suggestion: AISuggestion;
  index: number;
  onApply: () => void;
}

const AISuggestionCard: React.FC<AISuggestionCardProps> = ({ 
  suggestion, 
  index,
  onApply 
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Card className="group bg-[#1A1816]/70 backdrop-blur-sm border-[#FF6F61]/20 hover:border-[#FF8A80]/60 transition-all hover:shadow-xl hover:shadow-[#FF6F61]/20 overflow-hidden">
        {/* Gradient overlay on hover */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-br from-[#FF6F61]/5 to-[#E6B8C2]/5 pointer-events-none"
          animate={{ opacity: isHovered ? 1 : 0 }}
        />
        
        <CardContent className="p-4 relative">
          {/* Thumbnail */}
          <div className="flex items-start gap-4 mb-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#FF6F61] to-[#FF8A80] flex items-center justify-center text-3xl shadow-lg">
              {suggestion.thumbnail}
            </div>
            <div className="flex-1">
              <h3 className="text-[#FAF9F7] font-semibold mb-1">{suggestion.title}</h3>
              <p className="text-xs text-[#B8ADA8]">{suggestion.description}</p>
            </div>
          </div>

          {/* Parameters */}
          <div className="space-y-3 mb-4">
            {/* Genres */}
            <div>
              <Label className="text-xs text-[#6B5B5B] mb-1.5 block">Genres</Label>
              <div className="flex flex-wrap gap-1.5">
                {suggestion.genres.map(genre => (
                  <Badge 
                    key={genre} 
                    variant="outline"
                    className="text-xs border-[#E6B8C2]/40 text-[#E6B8C2] bg-[#E6B8C2]/5"
                  >
                    {genre}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Moods */}
            <div>
              <Label className="text-xs text-[#6B5B5B] mb-1.5 block">Moods</Label>
              <div className="flex flex-wrap gap-1.5">
                {suggestion.moods.map(mood => (
                  <Badge 
                    key={mood}
                    variant="outline"
                    className="text-xs border-[#FF8A80]/40 text-[#FF8A80] bg-[#FF8A80]/5"
                  >
                    {mood}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              <div className="bg-[#242220]/60 rounded-lg p-2">
                <p className="text-xs text-[#6B5B5B]">Energy</p>
                <p className="text-sm text-[#FF8A80] font-semibold">{suggestion.energy}/10</p>
              </div>
              <div className="bg-[#242220]/60 rounded-lg p-2">
                <p className="text-xs text-[#6B5B5B]">BPM</p>
                <p className="text-sm text-[#E6B8C2] font-semibold">{suggestion.bpmMin}-{suggestion.bpmMax}</p>
              </div>
              <div className="bg-[#242220]/60 rounded-lg p-2">
                <p className="text-xs text-[#6B5B5B]">Tracks</p>
                <p className="text-sm text-[#F5CBA7] font-semibold">{suggestion.numTracks}</p>
              </div>
            </div>
          </div>

          {/* Waveform Visualization */}
          <div className="h-8 flex items-end gap-0.5 mb-4 opacity-40 group-hover:opacity-70 transition-opacity">
            {Array.from({ length: 30 }).map((_, i) => (
              <motion.div
                key={i}
                className="flex-1 bg-gradient-to-t from-[#FF6F61] to-[#FF8A80] rounded-t-sm"
                style={{
                  height: `${20 + Math.sin(i * 0.5) * 30 + Math.random() * 20}%`
                }}
                animate={isHovered ? {
                  height: [`${20 + Math.sin(i * 0.5) * 30}%`, `${40 + Math.sin(i * 0.5) * 40}%`, `${20 + Math.sin(i * 0.5) * 30}%`]
                } : {}}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.02
                }}
              />
            ))}
          </div>

          {/* Apply Button */}
          <Button
            onClick={onApply}
            className="w-full bg-gradient-to-r from-[#FF6F61] to-[#FF8A80] hover:shadow-lg hover:shadow-[#FF6F61]/40 transition-all text-white border-0"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Use this setup
            <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Track Blueprint Card Component
interface TrackBlueprintCardProps {
  track: TrackBlueprint;
  index: number;
  onUpdate: (id: string, updates: Partial<TrackBlueprint>) => void;
  onRegenerate: (id: string) => void;
}

const TrackBlueprintCard: React.FC<TrackBlueprintCardProps> = ({ 
  track, 
  index, 
  onUpdate, 
  onRegenerate 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="bg-[#242220]/60 backdrop-blur-sm border-[#FF6F61]/20 hover:border-[#FF8A80]/40 transition-all group">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#FF6F61] to-[#FF8A80] flex items-center justify-center text-white font-semibold">
                {track.trackNumber}
              </div>
              <div>
                <Input
                  value={track.title}
                  onChange={(e) => onUpdate(track.id, { title: e.target.value })}
                  className="bg-transparent border-0 p-0 h-auto text-lg text-[#FAF9F7] font-semibold focus-visible:ring-0"
                />
                <p className="text-xs text-[#6B5B5B] mt-1">AI-generated title</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRegenerate(track.id)}
              className="text-[#FF8A80] hover:text-[#FF6F61] hover:bg-[#FF6F61]/10"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Prompt */}
          <div className="space-y-2">
            <Label className="text-xs text-[#B8ADA8]">Track Prompt</Label>
            <Textarea
              value={track.prompt}
              onChange={(e) => onUpdate(track.id, { prompt: e.target.value })}
              className="min-h-20 bg-[#1A1816] border-[#FF6F61]/20 text-[#FAF9F7] text-sm resize-none"
            />
          </div>

          {/* Genre & BPM */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-[#B8ADA8]">Genre</Label>
              <Select value={track.genre} onValueChange={(value: string) => onUpdate(track.id, { genre: value })}>
                <SelectTrigger className="bg-[#1A1816] border-[#FF6F61]/20 text-[#FAF9F7]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#242220] border-[#FF6F61]/20">
                  {GENRE_OPTIONS.map(genre => (
                    <SelectItem key={genre} value={genre} className="text-[#FAF9F7]">
                      {genre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-[#B8ADA8]">BPM</Label>
              <Input
                type="number"
                value={track.bpm}
                onChange={(e) => onUpdate(track.id, { bpm: Number(e.target.value) })}
                className="bg-[#1A1816] border-[#FF6F61]/20 text-[#FAF9F7]"
              />
            </div>
          </div>

          {/* Energy Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-[#B8ADA8]">Energy</Label>
              <span className="text-xs text-[#FF8A80]">{track.energy}/10</span>
            </div>
            <Slider
              value={[track.energy]}
              onValueChange={([value]: number[]) => onUpdate(track.id, { energy: value })}
              min={1}
              max={10}
              step={1}
              className="[&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-[#FF6F61] [&_[role=slider]]:to-[#FF8A80]"
            />
          </div>

          {/* Waveform Visualization */}
          <div className="h-12 flex items-end gap-0.5 opacity-50 group-hover:opacity-100 transition-opacity">
            {Array.from({ length: 40 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 bg-gradient-to-t from-[#FF6F61] to-[#FF8A80] rounded-t"
                style={{
                  height: `${Math.random() * 100}%`,
                  animationDelay: `${i * 0.05}s`
                }}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
