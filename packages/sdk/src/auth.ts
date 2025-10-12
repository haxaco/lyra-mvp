type LoginResponse = {
  ok: boolean;
  access_token?: string;
  refresh_token?: string;
  user?: { id: string; email?: string | null };
  error?: string;
};

export async function loginWithPassword(email: string, password: string) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  const json = (await res.json()) as LoginResponse;
  if (!res.ok || json.ok === false || !json.access_token) throw new Error(json.error || "Login failed");
  localStorage.setItem("lyra.access_token", json.access_token);
  if (json.refresh_token) localStorage.setItem("lyra.refresh_token", json.refresh_token);
  return json;
}

export function logoutLocal() {
  localStorage.removeItem("lyra.access_token");
  localStorage.removeItem("lyra.refresh_token");
}

