// packages/sdk/src/client/aiComposer.ts
export async function startComposeSession(baseUrl: string, params: {
  orgId: string; userId: string; brief: { brief: string };
}) {
  const res = await fetch(
    `${baseUrl}/api/ai/compose?orgId=${encodeURIComponent(params.orgId)}&userId=${encodeURIComponent(params.userId)}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(params.brief) }
  );
  const json = await res.json();
  if (!res.ok || !json.ok) throw new Error(json.error || `HTTP ${res.status}`);
  return json.sessionId as string;
}

export function streamComposeSession(baseUrl: string, args: {
  sessionId: string; orgId: string; userId: string; brief: string;
  onEvent: (evt: any) => void; onError?: (err: any) => void;
}) {
  const url = `${baseUrl}/api/ai/compose/${encodeURIComponent(args.sessionId)}/stream?orgId=${encodeURIComponent(args.orgId)}&userId=${encodeURIComponent(args.userId)}&brief=${encodeURIComponent(args.brief)}`;
  const es = new EventSource(url);
  es.onmessage = (e) => { try { args.onEvent(JSON.parse(e.data)); } catch (err) { args.onError?.(err); } };
  es.onerror = (e) => { args.onError?.(e); es.close(); };
  return () => es.close();
}
