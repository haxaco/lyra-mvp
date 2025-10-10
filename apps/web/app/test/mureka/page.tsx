"use client";

import { useState } from "react";

export default function MurekaTestPage() {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState<string>("");

  async function run() {
    setLoading(true);
    setUrl(null);
    setLog("");

    const res = await fetch("/api/mureka-test", {
      method: "POST",
      body: JSON.stringify({ prompt: "chill lofi for coffee shop, instrumental, 90 BPM" }),
      headers: { "Content-Type": "application/json" },
    });
    const json = await res.json();
    setLog(JSON.stringify(json, null, 2));
    if (json.ok) setUrl(json.r2.url);
    setLoading(false);
  }

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-2xl font-semibold">Mureka → R2 Test</h1>
      <button
        onClick={run}
        disabled={loading}
        className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20"
      >
        {loading ? "Generating…" : "Generate & Upload"}
      </button>

      {url && (
        <div className="w-full max-w-xl">
          <audio controls className="w-full" src={url} />
          <p className="text-sm opacity-70 break-all mt-2">{url}</p>
        </div>
      )}

      <pre className="w-full max-w-2xl text-xs bg-black/40 p-4 rounded-lg overflow-auto">
        {log}
      </pre>
    </div>
  );
}

