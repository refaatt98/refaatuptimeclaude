// Standalone (Netlify / plain Vite) replacement for the server-function proxy.
// Same call signature as src/lib/supabase-mgmt.functions.ts, so the app code
// does not change: the SPA build aliases that module to this one.
type MgmtInput = {
  data: {
    path: string;
    method?: "GET" | "POST";
    token: string;
    body?: string;
  };
};

export async function supabaseMgmt({ data }: MgmtInput) {
  const res = await fetch("/api/supabase-mgmt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      path: data.path,
      method: data.method ?? "GET",
      token: data.token,
      body: data.body,
    }),
  });

  // Anything that is not the function's JSON envelope means the request never
  // reached Supabase: the Netlify function is missing or the host blocked it.
  if (res.headers.get("content-type")?.includes("application/json") !== true) {
    return {
      status: res.status,
      ok: false,
      body: await res.text(),
      proxied: false,
    };
  }

  const json = (await res.json()) as {
    status: number;
    ok: boolean;
    body: string;
    proxied?: boolean;
  };
  return { ...json, proxied: json.proxied ?? true };
}
