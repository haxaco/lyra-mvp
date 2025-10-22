import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../primitives/card';
import { Button } from '../primitives/button';
import { Input } from '../primitives/input';
import { Label } from '../primitives/label';
import { Slider } from '../primitives/slider';
import { Badge } from '../primitives/badge';
import { Textarea } from '../primitives/textarea';
import { Switch } from '../primitives/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../primitives/select';
import { Progress } from '../primitives/progress';
import { Wand2, Music, AlertCircle, CheckCircle, XCircle, Clock, Play } from 'lucide-react';
import { LyraJobs, useJob } from '@lyra/sdk';

interface SongBuilderProps {
  onGenerationComplete?: (tracks: any[]) => void;
}

const MODELS = [
  { value: "auto", label: "Auto (Recommended)" },
  { value: "mureka-6", label: "Mureka 6" },
  { value: "mureka-7.5", label: "Mureka 7.5" },
  { value: "mureka-o1", label: "Mureka O1" }
] as const;

export const SongBuilder: React.FC<SongBuilderProps> = ({ onGenerationComplete }) => {
  // Basic settings
  const [model, setModel] = useState<string>("auto");
  const [trackCount, setTrackCount] = useState<number>(2);
  const [concurrency, setConcurrency] = useState<number>(1); // Default to sequential execution
  const [stream, setStream] = useState<boolean>(false);

  // Content inputs
  const [prompt, setPrompt] = useState<string>("");
  const [lyrics, setLyrics] = useState<string>("[Instrumental only]");
  
  // Reference inputs
  const [referenceId, setReferenceId] = useState<string>("");
  const [vocalId, setVocalId] = useState<string>("");
  const [melodyId, setMelodyId] = useState<string>("");

  // Job state
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  
  // SDK
  const jobsClient = React.useRef(new LyraJobs());
  
  // Use job hook for real-time updates
  const { 
    job, 
    status, 
    progress, 
    children, 
    events, 
    isTerminal, 
    error: jobError, 
    isLoading 
  } = useJob(currentJobId || '', { enableSSE: true });

  // Handle job completion
  React.useEffect(() => {
    if (isTerminal && job && onGenerationComplete) {
      console.log('[SongBuilder] Job completed, calling onGenerationComplete:', {
        jobId: job.id,
        status: job.status,
        isTerminal,
        hasCallback: !!onGenerationComplete
      });
      // Job completed, notify parent component
      onGenerationComplete([job]);
    }
  }, [isTerminal, job, onGenerationComplete]);

  // Handle job errors
  React.useEffect(() => {
    if (jobError) {
      setError(jobError);
    }
  }, [jobError]);

  const generateSongs = async () => {
    if (currentJobId) return; // Already generating
    
    setError("");
    setCurrentJobId(null);

    try {
      const params = {
        lyrics,
        model: model as any,
        prompt: prompt.trim() || undefined,
        reference_id: referenceId.trim() || undefined,
        vocal_id: vocalId.trim() || undefined,
        melody_id: melodyId.trim() || undefined,
        stream: model !== "mureka-o1" ? stream : false,
      };

      let result;
      if (trackCount === 1) {
        // Single track
        result = await jobsClient.current.createTrackJob(params);
      } else {
        // Playlist (multiple tracks)
        result = await jobsClient.current.createPlaylistJob({
          ...params,
          n: trackCount,
          concurrency: concurrency,
        });
      }

      setCurrentJobId(result.job_id);
      console.log(`[SongBuilder] Job created: ${result.job_id}`, {
        trackCount,
        concurrency: trackCount > 1 ? concurrency : 'N/A (single track)',
        model,
        type: trackCount > 1 ? 'playlist' : 'single track'
      });

    } catch (err: any) {
      setError(err.message || 'An error occurred during generation');
      console.error('Generation error:', err);
    }
  };

  // Validation
  const isGenerating = currentJobId && !isTerminal;
  const canGenerate = !isGenerating && (
    prompt.trim() || referenceId.trim() || vocalId.trim() || melodyId.trim()
  );

  const isPromptMode = prompt.trim().length > 0;
  const hasReferences = referenceId.trim() || vocalId.trim() || melodyId.trim();

  // Get status display
  const getStatusIcon = () => {
    switch (status) {
      case 'queued':
        return <Clock className="w-4 h-4" />;
      case 'running':
        return <Play className="w-4 h-4" />;
      case 'succeeded':
        return <CheckCircle className="w-4 h-4" />;
      case 'failed':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Music className="w-4 h-4" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'queued':
        return 'text-yellow-600';
      case 'running':
        return 'text-blue-600';
      case 'succeeded':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-gradient-lyra p-8 mx-6 rounded-2xl">
        <div>
          <h2 className="text-3xl font-bold mb-2">Song Builder</h2>
          <p className="text-muted-foreground text-lg">
            Generate AI-powered music tracks with Mureka using prompts or reference files.
          </p>
        </div>
      </div>

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuration Panel */}
          <div className="space-y-6">
            {/* Basic Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Generation Settings</CardTitle>
                <CardDescription>Configure how your music will be generated</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MODELS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Number of Tracks</Label>
                    <span className="text-sm text-muted-foreground">{trackCount}</span>
                  </div>
                  <Slider
                    value={[trackCount]}
                    onValueChange={(value) => setTrackCount(value[0])}
                    min={1}
                    max={3}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1</span>
                    <span>3</span>
                  </div>
                </div>

                {/* Concurrency Control - only show for playlists */}
                {trackCount > 1 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Concurrency (Tracks at Once)</Label>
                      <span className="text-sm text-muted-foreground">
                        {concurrency === 1 ? 'Sequential' : `${concurrency} parallel`}
                      </span>
                    </div>
                    <Slider
                      value={[concurrency]}
                      onValueChange={(value) => setConcurrency(value[0])}
                      min={1}
                      max={3}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>1 (Sequential)</span>
                      <span>3 (Parallel)</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {concurrency === 1 
                        ? 'Generate one track at a time (recommended for stability)'
                        : `Generate up to ${concurrency} tracks simultaneously`
                      }
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="stream">Enable Streaming</Label>
                    <p className="text-xs text-muted-foreground">
                      {model === "mureka-o1" ? "Not available for O1 model" : "Stream audio during generation"}
                    </p>
                  </div>
                  <Switch
                    id="stream"
                    checked={stream}
                    onCheckedChange={setStream}
                    disabled={model === "mureka-o1"}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Content Input */}
            <Card>
              <CardHeader>
                <CardTitle>Content Input</CardTitle>
                <CardDescription>Choose between prompt or reference files</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="prompt">Prompt</Label>
                  <Textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., warm lofi jazz, 90 BPM, cozy coffeehouse, instrumental"
                    disabled={!!hasReferences}
                    maxLength={1024}
                    rows={3}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{prompt.length}/1024</span>
                    {hasReferences && <span>• Disabled (reference files selected)</span>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lyrics">Lyrics</Label>
                  <Textarea
                    id="lyrics"
                    value={lyrics}
                    onChange={(e) => setLyrics(e.target.value)}
                    placeholder="[Instrumental only]"
                    maxLength={3000}
                    rows={3}
                  />
                  <div className="text-xs text-muted-foreground">
                    {lyrics.length}/3000 characters
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reference Files */}
            <Card>
              <CardHeader>
                <CardTitle>Reference Files</CardTitle>
                <CardDescription>Optional reference audio files</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reference-id">Reference ID</Label>
                  <Input
                    id="reference-id"
                    value={referenceId}
                    onChange={(e) => setReferenceId(e.target.value)}
                    placeholder="File ID for reference audio"
                    disabled={!!isPromptMode}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vocal-id">Vocal ID</Label>
                  <Input
                    id="vocal-id"
                    value={vocalId}
                    onChange={(e) => setVocalId(e.target.value)}
                    placeholder="File ID for vocal reference"
                    disabled={!!isPromptMode}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="melody-id">Melody ID</Label>
                  <Input
                    id="melody-id"
                    value={melodyId}
                    onChange={(e) => setMelodyId(e.target.value)}
                    placeholder="File ID for melody reference"
                    disabled={!!isPromptMode}
                  />
                </div>

                {isPromptMode && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <AlertCircle className="w-3 h-3" />
                    <span>Disabled because prompt is provided</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Generate Button */}
            <Button 
              onClick={generateSongs} 
              className="w-full" 
              disabled={!canGenerate}
              size="lg"
            >
              <Wand2 className="w-4 h-4 mr-2" />
              {isGenerating ? 'Generating...' : 'Generate Songs'}
            </Button>

            {/* Progress Status */}
            {(isGenerating || error || currentJobId) && (
              <Card>
                <CardContent className="pt-6 space-y-4">
                  {/* Job Status */}
                  {currentJobId && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className={`${getStatusColor()}`}>
                          {getStatusIcon()}
                        </span>
                        <span className="text-sm font-medium">
                          {jobsClient.current.getStatusMessage(status)}
                        </span>
                        {progress > 0 && (
                          <Badge variant="outline" className="ml-auto">
                            {progress}%
                          </Badge>
                        )}
                      </div>
                      
                      {/* Progress Bar */}
                      {progress > 0 && (
                        <Progress value={progress} className="w-full" />
                      )}
                      
                      {/* Job Details */}
                      {job && (
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div>Job ID: {job.id}</div>
                          {job.item_count > 1 && (
                            <div>
                              Progress: {job.completed_count}/{job.item_count} tracks
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Children Progress (for playlists) */}
                  {children && children.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Track Progress:</div>
                      <div className="space-y-1">
                        {children.map((child: any, index: number) => (
                          <div key={child.id} className="flex items-center gap-2 text-xs">
                            <span className="w-6 text-muted-foreground">#{index + 1}</span>
                            <span className={`${getStatusColor()}`}>
                              {getStatusIcon()}
                            </span>
                            <span className="flex-1">
                              {jobsClient.current.getStatusMessage(child.status)}
                            </span>
                            {child.progress_pct > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {child.progress_pct}%
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Error Display */}
                  {error && (
                    <div className="flex items-center gap-2 text-sm text-destructive">
                      <AlertCircle className="w-4 h-4" />
                      <span>{error}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Info Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Generation Info</CardTitle>
                <CardDescription>Current configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Model:</span>
                  <Badge variant="outline">{MODELS.find(m => m.value === model)?.label}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Track Count:</span>
                  <Badge variant="outline">{trackCount}</Badge>
                </div>
                {trackCount > 1 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Concurrency:</span>
                    <Badge variant="outline">
                      {concurrency === 1 ? 'Sequential' : `${concurrency} parallel`}
                    </Badge>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Streaming:</span>
                  <Badge variant="outline">{stream ? 'Enabled' : 'Disabled'}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Input Type:</span>
                  <Badge variant="outline">
                    {isPromptMode ? 'Prompt' : hasReferences ? 'References' : 'None'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span>Use descriptive prompts with genre, tempo, and mood</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span>Reference files can guide style and structure</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span>Auto model chooses the best option for your input</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span>Generation typically takes 30-60 seconds per track</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
