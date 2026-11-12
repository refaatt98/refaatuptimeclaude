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

  if (!res.ok && res.headers.get("content-type")?.includes("application/json") !== true) {
    return { status: res.status, ok: false, body: await res.text() };
  }

  return (await res.json()) as { status: number; ok: boolean; body: string };
}
