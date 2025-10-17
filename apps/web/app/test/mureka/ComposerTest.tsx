"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
// Import from the built SDK
import { startComposeSession, streamComposeSession } from "@lyra/sdk";

type StreamEvent =
  | { type: "message"; data: { text: string } }
  | { type: "suggestions"; data: { suggestions: any[] } }
  | { type: "config_draft"; data: { config: any } }
  | { type: "blueprints"; data: { blueprints: any[] } }
  | { type: "done"; data?: Record<string, never> }
  | { type: "error"; error: string };

const BASE = process.env.NEXT_PUBLIC_APP_URL || "";


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
  const supabase = createClientComponentClient();
  const [orgId, setOrgId] = useState("");
  const [userId, setUserId] = useState("");
  const [brief, setBrief] = useState("Energetic indie pop for a retail brand launch");
  const [model, setModel] = useState("gpt-4o-mini");
  const [temperature, setTemperature] = useState(0.4);

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

  // Load user and organization data
  useEffect(() => {
    async function getUserAndOrg() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setUserId(user.id);
        
        const { data: memberships } = await supabase
          .from('user_memberships')
          .select('organization_id')
          .eq('user_id', user.id)
          .limit(1);
        
        if (memberships && memberships.length > 0) {
          const userOrgId = memberships[0].organization_id;
          setOrgId(userOrgId);
        }
      }
    }
    
    getUserAndOrg();
  }, [supabase]);

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
        brief: { 
          brief,
          model,
          temperature
        },
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
      onError: (err: any) => {
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
          if (evt.type === "complete") {
            appendLog(`✓ job completed: ${evt.data?.message || ""}`);
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
          Org ID <span className="text-xs text-gray-500">(auto-populated)</span>
          <input
            className="mt-1 w-full border rounded px-2 py-1 bg-gray-50"
            value={orgId}
            onChange={(e) => setOrgId(e.target.value)}
            placeholder="Loading..."
            disabled={!orgId}
          />
        </label>
        <label className="text-sm">
          User ID <span className="text-xs text-gray-500">(auto-populated)</span>
          <input
            className="mt-1 w-full border rounded px-2 py-1 bg-gray-50"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Loading..."
            disabled={!userId}
          />
        </label>
      </div>
      {(!orgId || !userId) && (
        <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
          ⏳ Loading user data... You can manually enter IDs if needed for testing different scenarios.
        </div>
      )}

      <label className="text-sm block mt-3">
        Brief
        <textarea
          className="mt-1 w-full border rounded px-2 py-1 min-h-[70px]"
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
        />
      </label>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
        <label className="text-sm block">
          Model
          <select
            className="mt-1 w-full border rounded px-2 py-1"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          >
            <option value="gpt-4o-mini">GPT-4o Mini (Fast)</option>
            <option value="gpt-4o">GPT-4o (Higher Quality)</option>
            <option value="auto">Auto (Default)</option>
          </select>
        </label>

        <label className="text-sm block">
          Temperature: {temperature}
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            className="mt-1 w-full"
            value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
          />
          <div className="text-xs text-gray-500 mt-1">
            0.0 (Focused) — 2.0 (Creative)
          </div>
        </label>
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
        <button 
          className="px-3 py-1.5 rounded bg-primary text-primary-foreground text-sm disabled:opacity-50 hover:bg-primary/90 transition-colors" 
          onClick={createSession}
          disabled={!orgId || !userId}
          title={!orgId || !userId ? "Waiting for user data to load" : ""}
        >
          Create Session
        </button>
        <button
          className="px-3 py-1.5 rounded bg-primary text-primary-foreground text-sm disabled:opacity-50 hover:bg-primary/90 transition-colors"
          onClick={startStream}
          disabled={!sessionId || isStreaming}
        >
          Start Stream
        </button>
        <button
          className="px-3 py-1.5 rounded bg-primary text-primary-foreground text-sm disabled:opacity-50 hover:bg-primary/90 transition-colors"
          onClick={generateFromBlueprints}
          disabled={!config || !blueprints?.length || genBusy || !orgId || !userId}
          title={!config || !blueprints?.length ? "Need config + blueprints first" : !orgId || !userId ? "Waiting for user data" : ""}
        >
          {genBusy ? "Generating…" : "Generate Playlist From Blueprints"}
        </button>
        <button className="px-3 py-1.5 rounded bg-gray-100 text-gray-700 text-sm hover:bg-gray-200 transition-colors" onClick={clearAll}>
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
