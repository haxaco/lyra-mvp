"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Asset = { key: string; url: string };
type Item = {
  index: number;
  id: string | null;
  durationMs: number | null;
  sourceUrlMp3: string | null;
  sourceUrlFlac: string | null;
  r2Mp3: Asset | null;
  r2Flac: Asset | null;
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
  const [model, setModel] = useState<string>(DEFAULTS.model);
  const [n, setN] = useState<number>(DEFAULTS.n);
  const [prompt, setPrompt] = useState<string>(DEFAULTS.prompt);
  const [lyrics, setLyrics] = useState<string>(DEFAULTS.lyrics);
  const [referenceId, setReferenceId] = useState<string>(DEFAULTS.reference_id);
  const [vocalId, setVocalId] = useState<string>(DEFAULTS.vocal_id);
  const [melodyId, setMelodyId] = useState<string>(DEFAULTS.melody_id);
  const [stream, setStream] = useState<boolean>(DEFAULTS.stream);

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState<string>("");
  const [elapsed, setElapsed] = useState<number>(0);
  const [error, setError] = useState<string>("");

  const timerRef = useRef<NodeJS.Timer | null>(null);

  // Persist common fields locally
  useEffect(() => {
    const ls = (k: string, def: any) => { const v = localStorage.getItem(k); return v ?? def; };
    setModel(ls("mureka_model", DEFAULTS.model));
    setN(Number(ls("mureka_n", String(DEFAULTS.n))));
    setPrompt(ls("mureka_prompt", DEFAULTS.prompt));
    setLyrics(ls("mureka_lyrics", DEFAULTS.lyrics));
    setReferenceId(ls("mureka_reference_id", DEFAULTS.reference_id));
    setVocalId(ls("mureka_vocal_id", DEFAULTS.vocal_id));
    setMelodyId(ls("mureka_melody_id", DEFAULTS.melody_id));
    setStream(ls("mureka_stream", String(DEFAULTS.stream)) === "true");
  }, []);
  useEffect(() => { localStorage.setItem("mureka_model", model); }, [model]);
  useEffect(() => { localStorage.setItem("mureka_n", String(n)); }, [n]);
  useEffect(() => { localStorage.setItem("mureka_prompt", prompt); }, [prompt]);
  useEffect(() => { localStorage.setItem("mureka_lyrics", lyrics); }, [lyrics]);
  useEffect(() => { localStorage.setItem("mureka_reference_id", referenceId); }, [referenceId]);
  useEffect(() => { localStorage.setItem("mureka_vocal_id", vocalId); }, [vocalId]);
  useEffect(() => { localStorage.setItem("mureka_melody_id", melodyId); }, [melodyId]);
  useEffect(() => { localStorage.setItem("mureka_stream", String(stream)); }, [stream]);

  // Mutual exclusivity (prompt) vs (reference_id|vocal_id|melody_id)
  const anyRefControl = useMemo(() => !!(referenceId || vocalId || melodyId), [referenceId, vocalId, melodyId]);
  const promptDisabled = anyRefControl;
  const refsDisabled = !!prompt;

  // Stream not supported on mureka-o1
  const streamDisabled = model === "mureka-o1";

  // Live counters / limits
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

  async function run(e?: React.FormEvent) {
    e?.preventDefault();
    setError("");
    // client-side validation mirrors server rules
    if (!lyrics || lyrics.trim().length === 0) {
      setError("Lyrics is required. Try \"[Instrumental only]\" for instrumental tracks.");
      return;
    }
    if (lyrics.length > 3000) { setError("Lyrics exceeds 3000 characters."); return; }
    if (prompt && prompt.length > 1024) { setError("Prompt exceeds 1024 characters."); return; }
    const selected = [prompt && "prompt", referenceId && "reference_id", vocalId && "vocal_id", melodyId && "melody_id"].filter(Boolean);
    if (selected.length > 1) { setError(`Only one of {prompt, reference_id, vocal_id, melody_id} can be provided. You set: ${selected.join(", ")}`); return; }
    if (stream && model === "mureka-o1") { setError("Stream mode is not supported with model 'mureka-o1'."); return; }

    setLoading(true);
    setItems([]);
    setLog("");
    setElapsed(0);

    const res = await fetch("/api/mureka-test", {
      method: "POST",
      body: JSON.stringify({
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
    if (json.ok) setItems(json.items || []);
    setLoading(false);
  }

  return (
    <div className="min-h-[90vh] flex flex-col items-center gap-6 p-6">
      <h1 className="text-2xl font-semibold">Mureka → R2 Test (Full Request)</h1>

      <form onSubmit={run} className="w-full max-w-3xl grid gap-4 rounded-lg border border-white/15 p-4 bg-black/30">
        {/* Model + n + stream */}
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
              <input
                type="checkbox"
                checked={stream}
                onChange={(e) => setStream(e.target.checked)}
                disabled={streamDisabled}
              />
              <span className={`text-sm ${streamDisabled ? "opacity-50" : "opacity-80"}`}>Enable streaming phase</span>
            </div>
          </label>
        </div>

        {/* Prompt vs Reference/Vocal/Melody */}
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1">
            <span className="text-sm opacity-80">Prompt (max 1024)</span>
            <textarea
              className="px-3 py-2 rounded bg-black/40 border border-white/15 outline-none focus:border-white/30 min-h-[72px]"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., warm lofi jazz, 90 BPM, cozy coffeehouse, instrumental"
              disabled={promptDisabled}
              maxLength={1024}
            />
            <div className="text-xs opacity-60">{promptCount}/1024 {promptDisabled && " • disabled (control selected on right)"}</div>
          </label>

          <div className="grid gap-3">
            <label className="grid gap-1">
              <span className="text-sm opacity-80">reference_id</span>
              <input
                className="px-3 py-2 rounded bg-black/40 border border-white/15 outline-none focus:border-white/30"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
                placeholder="file id (reference)"
                disabled={refsDisabled}
              />
            </label>

            <label className="grid gap-1">
              <span className="text-sm opacity-80">vocal_id</span>
              <input
                className="px-3 py-2 rounded bg-black/40 border border-white/15 outline-none focus:border-white/30"
                value={vocalId}
                onChange={(e) => setVocalId(e.target.value)}
                placeholder="file id (vocal)"
                disabled={refsDisabled}
              />
            </label>

            <label className="grid gap-1">
              <span className="text-sm opacity-80">melody_id</span>
              <input
                className="px-3 py-2 rounded bg-black/40 border border-white/15 outline-none focus:border-white/30"
                value={melodyId}
                onChange={(e) => setMelodyId(e.target.value)}
                placeholder="file id (melody)"
                disabled={refsDisabled}
              />
            </label>

            {refsDisabled && <div className="text-xs opacity-60">Disabled because a prompt is provided.</div>}
          </div>
        </div>

        {/* Lyrics (required) */}
        <label className="grid gap-1">
          <span className="text-sm opacity-80">Lyrics (required, max 3000)</span>
          <textarea
            className="px-3 py-2 rounded bg-black/40 border border-white/15 outline-none focus:border-white/30 min-h-[72px]"
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value)}
            placeholder='[Instrumental only]'
            maxLength={3000}
          />
          <div className="text-xs opacity-60">{lyricsCount}/3000</div>
        </label>

        {/* Actions + status */}
        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20"
          >
            {loading ? "Working…" : "Generate & Upload"}
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

      {/* Results */}
      <div className="w-full max-w-3xl grid gap-6">
        {items.map((it) => (
          <div key={`${it.index}-${it.id ?? "x"}`} className="rounded-lg border border-white/15 p-4 bg-black/30">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm opacity-80">
                Choice #{it.index + 1} {it.id ? `(id: ${it.id})` : ""}
              </div>
              {typeof it.durationMs === "number" && (
                <div className="text-xs opacity-60">{Math.round(it.durationMs / 1000)}s</div>
              )}
            </div>

            {/* MP3 Player */}
            {it.r2Mp3?.url ? (
              <audio controls className="w-full" src={it.r2Mp3.url} />
            ) : (
              <div className="text-xs opacity-70">No MP3 available</div>
            )}

            {/* Links */}
            <div className="mt-2 text-xs opacity-80 space-y-1 break-all">
              {it.r2Mp3 && (
                <div>
                  <b>MP3:</b> {it.r2Mp3.key} — <a className="underline" href={it.r2Mp3.url} target="_blank">open</a>
                </div>
              )}
              {it.r2Flac && (
                <div>
                  <b>FLAC:</b> {it.r2Flac.key} — <a className="underline" href={it.r2Flac.url} target="_blank" rel="noreferrer">download</a>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Raw log */}
      <pre className="w-full max-w-3xl text-xs bg-black/40 p-4 rounded-lg overflow-auto">
        {log}
      </pre>
    </div>
  );
}
