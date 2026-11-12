// Netlify Function: server-side proxy for the Supabase Management API.
// api.supabase.com sends no CORS headers, so the browser cannot call it directly.
// Plain JavaScript on purpose: it can be uploaded as-is with a manual deploy.
const API = "https://api.supabase.com/v1";
const PATH_RE = /^\/[A-Za-z0-9\-_/.]*$/;

export default async (request) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ status: 400, ok: false, body: "Invalid JSON body" }, { status: 400 });
  }

  const path = payload.path ?? "";
  const method = payload.method === "POST" ? "POST" : "GET";
  const token = payload.token ?? "";

  if (!PATH_RE.test(path) || token.length < 10) {
    return Response.json({ status: 400, ok: false, body: "Invalid request" }, { status: 400 });
  }

  try {
    const res = await fetch(`${API}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        ...(method === "POST" ? { "Content-Type": "application/json" } : {}),
      },
      ...(method === "POST" ? { body: payload.body ?? "{}" } : {}),
    });

    const text = await res.text();
    return Response.json({ status: res.status, ok: res.ok, body: text });
  } catch (error) {
    return Response.json(
      {
        status: 502,
        ok: false,
        body: error instanceof Error ? error.message : "Supabase request failed",
      },
      { status: 502 },
    );
  }
};

export const config = { path: "/api/supabase-mgmt" };
