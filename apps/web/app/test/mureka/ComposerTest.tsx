"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
// TODO: These functions will be implemented in the AI Composer SDK
// import { startComposeSession, streamComposeSession } from "@lyra/sdk";

type StreamEvent =
  | { type: "message"; data: { text: string } }
  | { type: "suggestions"; data: { suggestions: any[] } }
  | { type: "config_draft"; data: { config: any } }
  | { type: "blueprints"; data: { blueprints: any[] } }
  | { type: "done"; data?: Record<string, never> }
  | { type: "error"; error: string };

const BASE = process.env.NEXT_PUBLIC_APP_URL || "";

// TODO: Placeholder implementations - these will be replaced with real AI Composer SDK functions
async function startComposeSession(baseUrl: string, params: { orgId: string; userId: string; brief: { brief: string } }): Promise<string> {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function streamComposeSession(baseUrl: string, params: { sessionId: string; orgId: string; userId: string; brief: string; onEvent: (evt: StreamEvent) => void; onError: (err: any) => void }): () => void {
  // Simulate streaming events
  const events: StreamEvent[] = [
    { type: "message", data: { text: "Analyzing your brief..." } },
    { type: "message", data: { text: "Generating playlist suggestions..." } },
    { type: "suggestions", data: { suggestions: [
      { title: "Indie Pop Energy", genres: ["indie pop", "alternative"], bpmRange: [120, 140], energy: 8, moods: ["energetic", "uplifting"] },
      { title: "Chill Vibes", genres: ["indie", "ambient"], bpmRange: [80, 100], energy: 4, moods: ["relaxed", "dreamy"] }
    ]}},
    { type: "message", data: { text: "Creating config draft..." } },
    { type: "config_draft", data: { config: {
      playlistTitle: "Retail Brand Launch Mix",
      genres: ["indie pop", "alternative"],
      bpmRange: [120, 140],
      energy: 8,
      moods: ["energetic", "uplifting"],
      durationSec: 180,
      tracks: 6,
      familyFriendly: true,
      model: "auto",
      allowExplicit: false
    }}},
    { type: "message", data: { text: "Generating track blueprints..." } },
    { type: "blueprints", data: { blueprints: [
      { index: 0, title: "Opening Anthem", prompt: "Upbeat indie pop with driving rhythm", lyrics: "[Instrumental only]", bpm: 130, genre: "indie pop", energy: 8, durationSec: 180, model: "auto" },
      { index: 1, title: "Brand Moment", prompt: "Energetic alternative rock with memorable hook", lyrics: "[Instrumental only]", bpm: 125, genre: "alternative", energy: 7, durationSec: 180, model: "auto" },
      { index: 2, title: "Peak Energy", prompt: "High-energy indie pop with soaring melodies", lyrics: "[Instrumental only]", bpm: 140, genre: "indie pop", energy: 9, durationSec: 180, model: "auto" }
    ]}},
    { type: "done", data: {} }
  ];

  let eventIndex = 0;
  const interval = setInterval(() => {
    if (eventIndex < events.length) {
      params.onEvent(events[eventIndex]);
      eventIndex++;
    } else {
      clearInterval(interval);
    }
  }, 1500);

  return () => clearInterval(interval);
}

function JsonCard({ title, data }: { title: string; data: any }) {
  return (
    <div className="border rounded-md p-3 bg-white/50">
      <div className="text-sm font-medium mb-2">{title}</div>
      <pre className="text-xs overflow-auto max-h-64 bg-black/5 p-2 rounded">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

export default function ComposerTest() {
  const [orgId, setOrgId] = useState("");
  const [userId, setUserId] = useState("");
  const [brief, setBrief] = useState("Energetic indie pop for a retail brand launch");

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const [suggestions, setSuggestions] = useState<any[] | null>(null);
  const [config, setConfig] = useState<any | null>(null);
  const [blueprints, setBlueprints] = useState<any[] | null>(null);

  const [genBusy, setGenBusy] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [playlistId, setPlaylistId] = useState<string | null>(null);
  const [playlistTracks, setPlaylistTracks] = useState<any[] | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  const [logs, setLogs] = useState<string[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const stopRef = useRef<null | (() => void)>(null);

  const baseUrl = useMemo(() => BASE.replace(/\/$/, ""), []);

  // auto-scroll logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const appendLog = useCallback((line: string) => {
    setLogs((l) => [...l, line]);
  }, []);

  const clearAll = useCallback(() => {
    setSessionId(null);
    setIsStreaming(false);
    setSuggestions(null);
    setConfig(null);
    setBlueprints(null);
    setPlaylistId(null);
    setPlaylistTracks(null);
    setGenError(null);
    setGenBusy(false);
    setJobId(null);
    setLogs([]);
    if (stopRef.current) {
      stopRef.current();
      stopRef.current = null;
    }
  }, []);

  const createSession = useCallback(async () => {
    if (!orgId || !userId || !brief) {
      alert("Please enter orgId, userId, and brief.");
      return;
    }
    clearAll();
    appendLog("→ Creating session…");
    try {
      const sid = await startComposeSession(baseUrl, {
        orgId,
        userId,
        brief: { brief },
      });
      setSessionId(sid);
      appendLog(`✓ Session created: ${sid}`);
    } catch (e: any) {
      appendLog(`✗ Create session failed: ${e?.message || e}`);
    }
  }, [orgId, userId, brief, baseUrl, appendLog, clearAll]);

  const startStream = useCallback(async () => {
    if (!sessionId || !orgId || !userId) {
      alert("Missing sessionId/orgId/userId.");
      return;
    }
    if (isStreaming) return;
    setIsStreaming(true);
    appendLog("→ Opening SSE stream…");

    stopRef.current = streamComposeSession(baseUrl, {
      sessionId,
      orgId,
      userId,
      brief,
      onEvent: (evt: StreamEvent) => {
        if (!evt || typeof evt !== "object") return;

        if (evt.type === "message") appendLog(`🧠 ${evt.data?.text ?? ""}`);
        if (evt.type === "suggestions") {
          appendLog("✨ suggestions received");
          setSuggestions(evt.data?.suggestions ?? null);
        }
        if (evt.type === "config_draft") {
          appendLog("🧩 config draft received");
          setConfig(evt.data?.config ?? null);
        }
        if (evt.type === "blueprints") {
          appendLog(`🎵 blueprints received (${(evt.data?.blueprints ?? []).length})`);
          setBlueprints(evt.data?.blueprints ?? null);
        }
        if (evt.type === "done") {
          appendLog("✅ composition complete");
          setIsStreaming(false);
          stopRef.current?.();
          stopRef.current = null;
        }
      },
      onError: (err) => {
        appendLog(`⚠️ stream error: ${String((err as any)?.message || err)}`);
        setIsStreaming(false);
        stopRef.current?.();
        stopRef.current = null;
      },
    });
  }, [sessionId, orgId, userId, brief, baseUrl, isStreaming, appendLog]);

  const generateFromBlueprints = useCallback(async () => {
    if (!orgId || !userId || !config || !blueprints?.length) {
      alert("Need orgId, userId, config, and blueprints.");
      return;
    }
    setGenBusy(true);
    setGenError(null);
    setPlaylistId(null);
    setPlaylistTracks(null);
    setJobId(null);
    appendLog("→ Enqueuing playlist.generate job…");

    try {
      // 1) Enqueue
      const res = await fetch(`${baseUrl}/api/compose/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config,
          blueprints,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setGenError(json?.error || `HTTP ${res.status}`);
        appendLog(`✗ enqueue failed: ${json?.error || res.statusText}`);
        setGenBusy(false);
        return;
      }
      setJobId(json.jobId);
      appendLog(`✓ job enqueued: ${json.jobId}`);

      // 2) Subscribe to job SSE
      const streamUrl = `${baseUrl}/api/jobs/${encodeURIComponent(json.jobId)}/events`;
      const es = new EventSource(streamUrl);

      es.onmessage = async (e) => {
        try {
          const evt = JSON.parse(e.data);
          if (evt.type === "log") appendLog(`🔧 ${evt.data?.message || ""}`);
          if (evt.type === "progress") appendLog(`⏩ progress: ${evt.data?.message || ""}`);
          if (evt.type === "succeeded") {
            appendLog("✅ job done; processing result…");
            es.close();

            // Get result from event payload
            if (evt.data?.result?.playlistId) {
              setPlaylistId(evt.data.result.playlistId);
              setPlaylistTracks(evt.data.result.tracks || []);
              appendLog(`✓ playlist created: ${evt.data.result.playlistId}`);
            } else {
              appendLog("⚠️ job finished but no result payload found");
            }
            setGenBusy(false);
          }
          if (evt.type === "failed") {
            appendLog(`✗ job error: ${evt.data?.error || ""}`);
            es.close();
            setGenBusy(false);
          }
        } catch (err) {
          appendLog(`✗ stream parse error: ${String(err)}`);
          es.close();
          setGenBusy(false);
        }
      };

      es.onerror = (e) => {
        appendLog(`✗ job SSE error`);
        es.close();
        setGenBusy(false);
      };
    } catch (e: any) {
      setGenError(e?.message || String(e));
      appendLog(`✗ enqueue error: ${e?.message || String(e)}`);
      setGenBusy(false);
    }
  }, [orgId, userId, config, blueprints, baseUrl, appendLog]);

  return (
    <div className="border rounded-lg p-4 bg-white/70 mt-10 shadow-sm">
      <h2 className="text-lg font-semibold mb-2">🎧 AI Composer Test</h2>
      <p className="text-sm text-gray-600 mb-4">
        Create a compose session → stream staged events → then generate a real playlist (Mureka → R2 → DB).
      </p>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm">
          Org ID
          <input
            className="mt-1 w-full border rounded px-2 py-1"
            value={orgId}
            onChange={(e) => setOrgId(e.target.value)}
            placeholder="00000000-0000-0000-0000-000000000000"
          />
        </label>
        <label className="text-sm">
          User ID
          <input
            className="mt-1 w-full border rounded px-2 py-1"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="00000000-0000-0000-0000-000000000000"
          />
        </label>
      </div>

      <label className="text-sm block mt-3">
        Brief
        <textarea
          className="mt-1 w-full border rounded px-2 py-1 min-h-[70px]"
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
        />
      </label>

      <div className="flex flex-wrap gap-2 mt-3">
        <button className="px-3 py-1.5 rounded bg-black text-white text-sm" onClick={createSession}>
          Create Session
        </button>
        <button
          className="px-3 py-1.5 rounded bg-indigo-600 text-white text-sm disabled:opacity-50"
          onClick={startStream}
          disabled={!sessionId || isStreaming}
        >
          Start Stream
        </button>
        <button
          className="px-3 py-1.5 rounded bg-emerald-600 text-white text-sm disabled:opacity-50"
          onClick={generateFromBlueprints}
          disabled={!config || !blueprints?.length || genBusy}
          title={!config || !blueprints?.length ? "Need config + blueprints first" : ""}
        >
          {genBusy ? "Generating…" : "Generate Playlist From Blueprints"}
        </button>
        <button className="px-3 py-1.5 rounded bg-gray-100 text-sm" onClick={clearAll}>
          Clear
        </button>
      </div>

      <div className="mt-3 text-xs text-gray-500">
        Session ID: <span className="font-mono">{sessionId ?? "—"}</span>
        {jobId && (
          <>
            <br />
            Job ID: <span className="font-mono">{jobId}</span>
          </>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4 mt-5">
        <JsonCard title="Suggestions" data={suggestions ?? {}} />
        <JsonCard title="Config Draft" data={config ?? {}} />
        <div className="md:col-span-2">
          <JsonCard title="Blueprints" data={blueprints ?? []} />
        </div>
      </div>

      {/* Playlist result */}
      {playlistId && (
        <div className="mt-6 border rounded-md p-3">
          <div className="text-sm font-semibold mb-2">✅ Playlist Created</div>
          <div className="text-xs text-gray-600 mb-2">Playlist ID: {playlistId}</div>
          <div className="space-y-3">
            {playlistTracks?.map((t, idx) => (
              <div key={t.id} className="border rounded p-2">
                <div className="text-sm font-medium">{t.title || `Track ${idx + 1}`}</div>
                <div className="text-xs text-gray-500 mb-1">
                  {Math.round(t.duration_seconds)}s • {t.r2_key}
                </div>
                {t.mp3_url && (
                  <audio controls src={t.mp3_url} className="w-full">
                    Your browser does not support audio.
                  </audio>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {genError && (
        <div className="mt-4 text-sm text-red-600">Error: {genError}</div>
      )}

      <div
        ref={logContainerRef}
        className="mt-6 border-t pt-3 text-xs text-gray-700 max-h-56 overflow-auto font-mono bg-gray-50 rounded-md p-2"
      >
        {logs.length === 0 && <div className="text-gray-400">No logs yet…</div>}
        {logs.map((l, i) => (
          <div key={i} className="transition-all duration-300 ease-in">
            {l}
          </div>
        ))}
      </div>
    </div>
  );
}
