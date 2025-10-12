export type SDKConfig = {
  baseUrl?: string;
  getToken?: () => string | null;
};

let _config: SDKConfig = {
  baseUrl: "",
  getToken: () => {
    if (typeof window === "undefined") return null;
    try { return localStorage.getItem("lyra.access_token"); } catch { return null; }
  }
};

export function configureSDK(cfg: Partial<SDKConfig>) {
  _config = { ..._config, ...cfg };
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = _config.getToken?.() || null;
  const headers = new Headers(init?.headers || {});
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (!headers.has("Content-Type") && init?.body && typeof init.body !== "undefined" && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(`${_config.baseUrl}${path}`, { ...init, headers, credentials: "include" });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.ok === false) {
    const msg = json?.error || json?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return json as T;
}

