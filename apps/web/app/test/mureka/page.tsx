"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Asset = { key: string; url: string };
type GeneratedItem = {
  index: number;
  id: string | null;
  durationMs: number | null;
  r2Mp3: Asset | null;
  r2Flac: Asset | null;
  db?: { id: string };
};

type DbItem = {
  id: string;
  duration_seconds: number | null;
  created_at: string;
  title: string | null;
  meta: any;
  mp3: Asset | null;
  flac: Asset | null;
};

const MODELS = ["auto", "mureka-6", "mureka-7.5", "mureka-o1"] as const;
const DEFAULTS = {
  model: "auto",
  n: 2,
  prompt: "",
  lyrics: "[Instrumental only]",
  reference_id: "",
  vocal_id: "",
  melody_id: "",
  stream: false,
};

export default function MurekaTestPage() {
  const [organizationId, setOrganizationId] = useState<string>("");
  const [model, setModel] = useState<string>(DEFAULTS.model);
  const [n, setN] = useState<number>(DEFAULTS.n);
  const [prompt, setPrompt] = useState<string>(DEFAULTS.prompt);
  const [lyrics, setLyrics] = useState<string>(DEFAULTS.lyrics);
  const [referenceId, setReferenceId] = useState<string>(DEFAULTS.reference_id);
  const [vocalId, setVocalId] = useState<string>(DEFAULTS.vocal_id);
  const [melodyId, setMelodyId] = useState<string>(DEFAULTS.melody_id);
  const [stream, setStream] = useState<boolean>(DEFAULTS.stream);

  const [genItems, setGenItems] = useState<GeneratedItem[]>([]);
  const [dbItems, setDbItems] = useState<DbItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState<string>("");
  const [elapsed, setElapsed] = useState<number>(0);
  const [error, setError] = useState<string>("");

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const ls = (k: string, def: any) => { const v = localStorage.getItem(k); return v ?? def; };
    setOrganizationId(ls("mureka_org", ""));
    setModel(ls("mureka_model", DEFAULTS.model));
    setN(Number(ls("mureka_n", String(DEFAULTS.n))));
    setPrompt(ls("mureka_prompt", DEFAULTS.prompt));
    setLyrics(ls("mureka_lyrics", DEFAULTS.lyrics));
    setReferenceId(ls("mureka_reference_id", DEFAULTS.reference_id));
    setVocalId(ls("mureka_vocal_id", DEFAULTS.vocal_id));
    setMelodyId(ls("mureka_melody_id", DEFAULTS.melody_id));
    setStream(ls("mureka_stream", String(DEFAULTS.stream)) === "true");
    refreshFromDb();
  }, []);
  useEffect(() => { localStorage.setItem("mureka_org", organizationId); }, [organizationId]);
  useEffect(() => { localStorage.setItem("mureka_model", model); }, [model]);
  useEffect(() => { localStorage.setItem("mureka_n", String(n)); }, [n]);
  useEffect(() => { localStorage.setItem("mureka_prompt", prompt); }, [prompt]);
  useEffect(() => { localStorage.setItem("mureka_lyrics", lyrics); }, [lyrics]);
  useEffect(() => { localStorage.setItem("mureka_reference_id", referenceId); }, [referenceId]);
  useEffect(() => { localStorage.setItem("mureka_vocal_id", vocalId); }, [vocalId]);
  useEffect(() => { localStorage.setItem("mureka_melody_id", melodyId); }, [melodyId]);
  useEffect(() => { localStorage.setItem("mureka_stream", String(stream)); }, [stream]);

  const anyRefControl = useMemo(() => !!(referenceId || vocalId || melodyId), [referenceId, vocalId, melodyId]);
  const promptDisabled = anyRefControl;
  const refsDisabled = !!prompt;
  const streamDisabled = model === "mureka-o1";
  const promptCount = prompt.length;
  const lyricsCount = lyrics.length;

  useEffect(() => {
    if (loading) {
      const started = Date.now();
      timerRef.current = setInterval(() => setElapsed(Math.round((Date.now() - started) / 1000)), 250);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [loading]);

  async function refreshFromDb() {
    const res = await fetch("/api/tracks/list");
    const json = await res.json();
    if (json.ok) setDbItems(json.items || []);
  }

  async function run(e?: React.FormEvent) {
    e?.preventDefault();
    setError("");

    if (!organizationId && !process.env.NEXT_PUBLIC_TEST_ORG_ID) {
      // purely client-side warning; server also checks
    }
    if (!lyrics || lyrics.trim().length === 0) { setError("Lyrics is required."); return; }
    if (lyrics.length > 3000) { setError("Lyrics exceeds 3000 characters."); return; }
    if (prompt && prompt.length > 1024) { setError("Prompt exceeds 1024 characters."); return; }
    const selected = [prompt && "prompt", referenceId && "reference_id", vocalId && "vocal_id", melodyId && "melody_id"].filter(Boolean);
    if (selected.length > 1) { setError(`Only one of {prompt, reference_id, vocal_id, melody_id} can be provided. You set: ${selected.join(", ")}`); return; }
    if (stream && model === "mureka-o1") { setError("Stream mode is not supported with model 'mureka-o1'."); return; }

    setLoading(true);
    setGenItems([]);
    setLog("");
    setElapsed(0);

    const res = await fetch("/api/mureka-test", {
      method: "POST",
      body: JSON.stringify({
        organizationId: organizationId || undefined,
        model,
        n,
        prompt: prompt || undefined,
        lyrics,
        reference_id: referenceId || undefined,
        vocal_id: vocalId || undefined,
        melody_id: melodyId || undefined,
        stream: Boolean(stream),
      }),
      headers: { "Content-Type": "application/json" },
    });
    const json = await res.json();
    setLog(JSON.stringify(json, null, 2));
    if (!json.ok && json.error) setError(json.error);
    if (json.ok) {
      setGenItems(json.items || []);
      await refreshFromDb(); // auto-refresh from DB after insert
    }
    setLoading(false);
  }

  return (
    <div className="min-h-[90vh] flex flex-col items-center gap-6 p-6">
      <h1 className="text-2xl font-semibold">Mureka → R2 → DB Test</h1>

      <form onSubmit={run} className="w-full max-w-3xl grid gap-4 rounded-lg border border-white/15 p-4 bg-black/30">
        <label className="grid gap-1">
          <span className="text-sm opacity-80">organizationId (optional if TEST_ORG_ID env is set)</span>
          <input
            className="px-3 py-2 rounded bg-black/40 border border-white/15 outline-none focus:border-white/30"
            value={organizationId}
            onChange={(e) => setOrganizationId(e.target.value)}
            placeholder="00000000-0000-0000-0000-000000000000"
          />
        </label>

        {/* Model / n / stream */}
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="grid gap-1">
            <span className="text-sm opacity-80">Model</span>
            <select
              className="px-3 py-2 rounded bg-black/40 border border-white/15 outline-none focus:border-white/30"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            >
              {MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-sm opacity-80">n (1–3)</span>
            <select
              className="px-3 py-2 rounded bg-black/40 border border-white/15 outline-none focus:border-white/30"
              value={n}
              onChange={(e) => setN(Number(e.target.value))}
            >
              {[1,2,3].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-sm opacity-80">Stream (no for mureka-o1)</span>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={stream} onChange={(e) => setStream(e.target.checked)} disabled={model === "mureka-o1"} />
              <span className={`text-sm ${model === "mureka-o1" ? "opacity-50" : "opacity-80"}`}>Enable streaming phase</span>
            </div>
          </label>
        </div>

        {/* Prompt vs refs */}
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1">
            <span className="text-sm opacity-80">Prompt (max 1024)</span>
            <textarea
              className="px-3 py-2 rounded bg-black/40 border border-white/15 outline-none focus:border-white/30 min-h-[72px]"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., warm lofi jazz, 90 BPM, cozy coffeehouse, instrumental"
              disabled={!!(referenceId || vocalId || melodyId)}
              maxLength={1024}
            />
            <div className="text-xs opacity-60">{prompt.length}/1024 { (referenceId||vocalId||melodyId) && " • disabled (control selected on right)"}</div>
          </label>

          <div className="grid gap-3">
            <label className="grid gap-1">
              <span className="text-sm opacity-80">reference_id</span>
              <input className="px-3 py-2 rounded bg-black/40 border border-white/15 outline-none focus:border-white/30" value={referenceId} onChange={(e) => setReferenceId(e.target.value)} placeholder="file id (reference)" disabled={!!prompt} />
            </label>
            <label className="grid gap-1">
              <span className="text-sm opacity-80">vocal_id</span>
              <input className="px-3 py-2 rounded bg-black/40 border border-white/15 outline-none focus:border-white/30" value={vocalId} onChange={(e) => setVocalId(e.target.value)} placeholder="file id (vocal)" disabled={!!prompt} />
            </label>
            <label className="grid gap-1">
              <span className="text-sm opacity-80">melody_id</span>
              <input className="px-3 py-2 rounded bg-black/40 border border-white/15 outline-none focus:border-white/30" value={melodyId} onChange={(e) => setMelodyId(e.target.value)} placeholder="file id (melody)" disabled={!!prompt} />
            </label>
            {!!prompt && <div className="text-xs opacity-60">Disabled because a prompt is provided.</div>}
          </div>
        </div>

        {/* Lyrics */}
        <label className="grid gap-1">
          <span className="text-sm opacity-80">Lyrics (required, max 3000)</span>
          <textarea className="px-3 py-2 rounded bg-black/40 border border-white/15 outline-none focus:border-white/30 min-h-[72px]" value={lyrics} onChange={(e) => setLyrics(e.target.value)} placeholder='[Instrumental only]' maxLength={3000} />
          <div className="text-xs opacity-60">{lyrics.length}/3000</div>
        </label>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-1">
          <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20">
            {loading ? "Working…" : "Generate → Upload → Save"}
          </button>
          <button type="button" onClick={refreshFromDb} className="px-3 py-2 rounded-lg border border-white/20 hover:bg-white/10">
            Refresh from DB
          </button>
          {loading && (
            <div className="flex items-center gap-3 text-sm opacity-80">
              <div className="h-4 w-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
              <span>Generating & uploading… {elapsed}s</span>
            </div>
          )}
          {!!error && <div className="text-sm text-red-400">{error}</div>}
        </div>
      </form>

      {/* Generated (this run) */}
      <div className="w-full max-w-3xl">
        <h2 className="text-lg opacity-80 mb-2">This run (not from DB)</h2>
        <div className="grid gap-6">
          {genItems.map((it, i) => (
            <div key={`${i}-${it.db?.id ?? "x"}`} className="rounded-lg border border-white/15 p-4 bg-black/30">
              <div className="text-sm opacity-80 mb-2">
                Choice #{i + 1} {it.db?.id ? <span className="opacity-60"> • saved id: {it.db.id}</span> : null}
              </div>
              {it.r2Mp3?.url ? <audio controls className="w-full" src={it.r2Mp3.url} /> : <div className="text-xs opacity-70">No MP3 available</div>}
            </div>
          ))}
        </div>
      </div>

      {/* From DB */}
      <div className="w-full max-w-3xl mt-6">
        <h2 className="text-lg opacity-80 mb-2">Recent from DB</h2>
        <div className="grid gap-6">
          {dbItems.map((it) => (
            <div key={it.id} className="rounded-lg border border-white/15 p-4 bg-black/30">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm opacity-80">
                  {it.title || `Track ${it.id.slice(0,8)}…`}
                </div>
                <div className="text-xs opacity-60">{new Date(it.created_at).toLocaleString()}</div>
              </div>
              {it.mp3?.url ? <audio controls className="w-full" src={it.mp3.url} /> : <div className="text-xs opacity-70">No MP3</div>}
              <div className="mt-2 text-xs opacity-80 break-all">
                {it.mp3 && <div><b>MP3:</b> {it.mp3.key}</div>}
                {it.flac && <div><b>FLAC:</b> <a className="underline" href={it.flac.url} target="_blank" rel="noreferrer">{it.flac.key}</a></div>}
                {it.meta?.request?.prompt && <div className="opacity-70"><b>Prompt:</b> {it.meta.request.prompt}</div>}
                {it.meta?.request?.lyrics && <div className="opacity-70"><b>Lyrics:</b> {it.meta.request.lyrics}</div>}
                {it.meta?.mureka_model && <div className="opacity-70"><b>Model:</b> {it.meta.mureka_model}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Raw log */}
      <pre className="w-full max-w-3xl text-xs bg-black/40 p-4 rounded-lg overflow-auto">
        {log}
      </pre>
    </div>
  );
}
