// packages/sdk/src/react/useLiveCompose.ts
import { useState, useCallback, useRef, useEffect } from 'react';
import { startLiveComposeSession, updateLiveComposeSession } from '../client/aiComposer';

export interface ComposeSuggestion {
  title: string;
  genres: string[];
  bpmRange: [number, number];
  energy: number;
  moods: string[];
  notes?: string[];
}

export interface ComposeConfig {
  playlistTitle?: string;
  genres: string[];
  bpmRange: [number, number];
  energy: number;
  moods: string[];
  durationSec: number;
  tracks: number;
  familyFriendly: boolean;
  model: string;
  allowExplicit: boolean;
}

export interface LiveComposeState {
  sessionId: string | null;
  isStreaming: boolean;
  suggestions: ComposeSuggestion[] | null;
  config: ComposeConfig | null;
  blueprints: any[] | null;
  isUpdating: boolean;
  error: string | null;
}

export interface UseLiveComposeOptions {
  baseUrl: string;
  orgId: string;
  userId: string;
  debounceMs?: number;
  onComplete?: (blueprints: any[]) => void;
}

export function useLiveCompose({
  baseUrl,
  orgId,
  userId,
  debounceMs = 1000,
  onComplete,
}: UseLiveComposeOptions) {
  const [state, setState] = useState<LiveComposeState>({
    sessionId: null,
    isStreaming: false,
    suggestions: null,
    config: null,
    blueprints: null,
    isUpdating: false,
    error: null,
  });

  const stopRef = useRef<(() => void) | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const currentBriefRef = useRef<string>('');

  const clearAll = useCallback(() => {
    setState(prev => ({
      ...prev,
      sessionId: null,
      isStreaming: false,
      suggestions: null,
      config: null,
      blueprints: null,
      isUpdating: false,
      error: null,
    }));
    
    if (stopRef.current) {
      stopRef.current();
      stopRef.current = null;
    }
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  }, []);

  const startCompose = useCallback(async (brief: string, model?: string, temperature?: number) => {
    if (!brief.trim()) return;
    
    clearAll();
    currentBriefRef.current = brief;
    
    setState(prev => ({ ...prev, isStreaming: true, error: null }));

    try {
      stopRef.current = startLiveComposeSession(baseUrl, {
        orgId,
        userId,
        brief: { brief, model, temperature },
        onEvent: (event) => {
          if (!event || typeof event !== 'object') return;

          if (event.type === 'session_created') {
            setState(prev => ({ ...prev, sessionId: event.data.sessionId }));
          } else if (event.type === 'message') {
            // Handle status messages
            console.log('Compose message:', event.data?.text);
          } else if (event.type === 'suggestions') {
            setState(prev => ({ ...prev, suggestions: event.data?.suggestions || null }));
          } else if (event.type === 'config_draft') {
            setState(prev => ({ ...prev, config: event.data?.config || null }));
          } else if (event.type === 'blueprints') {
            setState(prev => ({ ...prev, blueprints: event.data?.blueprints || null }));
            onComplete?.(event.data?.blueprints || []);
          } else if (event.type === 'done') {
            setState(prev => ({ ...prev, isStreaming: false }));
            if (stopRef.current) {
              stopRef.current();
              stopRef.current = null;
            }
          }
        },
        onError: (error) => {
          console.error('Live compose error:', error);
        setState(prev => ({ 
          ...prev, 
          isStreaming: false, 
          error: String((error as any)?.message || error) 
        }));
          if (stopRef.current) {
            stopRef.current();
            stopRef.current = null;
          }
        },
      });
    } catch (error) {
        setState(prev => ({ 
          ...prev, 
          isStreaming: false, 
          error: String((error as any)?.message || error) 
        }));
    }
  }, [baseUrl, orgId, userId, clearAll, onComplete]);

  const updateBrief = useCallback((brief: string) => {
    if (!brief.trim() || !state.sessionId) return;
    
    currentBriefRef.current = brief;
    
    // Clear existing debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce the update
    debounceRef.current = setTimeout(async () => {
      if (!state.sessionId || currentBriefRef.current !== brief) return;
      
      setState(prev => ({ ...prev, isUpdating: true, error: null }));

      try {
        // Update suggestions first
        if (state.suggestions) {
          const suggestionsResponse = await updateLiveComposeSession(baseUrl, {
            orgId,
            userId,
            sessionId: state.sessionId,
            brief,
            updateType: 'suggestions',
          });
          
          if (suggestionsResponse.ok && suggestionsResponse.type === 'suggestions') {
            setState(prev => ({ 
              ...prev, 
              suggestions: suggestionsResponse.data?.suggestions || null 
            }));
          }
        }

        // Then update config if we have suggestions
        if (state.suggestions) {
          const configResponse = await updateLiveComposeSession(baseUrl, {
            orgId,
            userId,
            sessionId: state.sessionId,
            brief,
            updateType: 'config',
            previousSuggestions: state.suggestions || undefined,
          });
          
          if (configResponse.ok && configResponse.type === 'config_draft') {
            setState(prev => ({ 
              ...prev, 
              config: configResponse.data?.config || null 
            }));
          }
        }

        // Finally, update blueprints if we have config
        if (state.config) {
          const blueprintsResponse = await updateLiveComposeSession(baseUrl, {
            orgId,
            userId,
            sessionId: state.sessionId,
            brief,
            updateType: 'blueprints',
            previousSuggestions: state.suggestions || undefined,
          });
          
          if (blueprintsResponse.ok && blueprintsResponse.type === 'blueprints') {
            setState(prev => ({ 
              ...prev, 
              blueprints: blueprintsResponse.data?.blueprints || null 
            }));
          }
        }
      } catch (error) {
        console.error('Update error:', error);
        setState(prev => ({ 
          ...prev, 
          error: String((error as any)?.message || error) 
        }));
      } finally {
        setState(prev => ({ ...prev, isUpdating: false }));
      }
    }, debounceMs);
  }, [baseUrl, orgId, userId, state.sessionId, state.suggestions, debounceMs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAll();
    };
  }, [clearAll]);

  return {
    ...state,
    startCompose,
    updateBrief,
    clearAll,
  };
}
