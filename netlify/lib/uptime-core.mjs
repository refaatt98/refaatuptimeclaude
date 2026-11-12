// Shared server-side helpers for the Netlify functions: database access through
// the public REST API, token decryption (same format as src/lib/token-crypto.ts),
// the Supabase Management API and ntfy push notifications.

// Public values (same as the app's .env); Netlify env vars override them.
const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ?? "https://qnmjlhhqzvguwuntdjha.supabase.co";
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFubWpsaGhxenZndXd1bnRkamhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5NzI5MjksImV4cCI6MjEwNTU0ODkyOX0.uFbXooOua1luBRgBMDH7TtlK2GMZiaepOO3FNRKodVM";

const MGMT_API = "https://api.supabase.com/v1";
const KEY_NAME = "account_token_key_v1";
export const SITE_URL = process.env.URL ?? "https://refaatuptime.netlify.app";

/* ------------------------------------------------------------- database */

export async function db(path, init = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Database ${path.split("?")[0]} failed (${res.status}): ${text}`);
  return text ? JSON.parse(text) : null;
}

/* ---------------------------------------------------------------- tokens */

const fromB64 = (v) => Uint8Array.from(Buffer.from(v, "base64"));

async function decryptToken(stored, key) {
  const buf = fromB64(stored);
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const ct = buf.subarray(28);
  const sealed = new Uint8Array(ct.length + tag.length);
  sealed.set(ct, 0);
  sealed.set(tag, ct.length);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, sealed);
  return new TextDecoder().decode(plain);
}

export async function loadTokens() {
  const keys = await db(`app_keys?select=value&name=eq.${KEY_NAME}`);
  if (!keys?.[0]?.value) return { tokens: [], unreadable: [] };
  const key = await crypto.subtle.importKey("raw", fromB64(keys[0].value), "AES-GCM", false, [
    "decrypt",
  ]);

  const rows = (await db("supabase_accounts?select=label,token_ciphertext&order=created_at")) ?? [];
  const tokens = [];
  const unreadable = [];
  for (const row of rows) {
    try {
      tokens.push({ label: row.label, token: await decryptToken(row.token_ciphertext, key) });
    } catch {
      unreadable.push(row.label);
    }
  }
  return { tokens, unreadable };
}

/* -------------------------------------------------------- management API */

export async function mgmt(path, token, method = "GET") {
  const res = await fetch(`${MGMT_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "User-Agent": "refaat-uptime/1.0 (+netlify-function)",
      ...(method === "POST" ? { "Content-Type": "application/json" } : {}),
    },
    ...(method === "POST" ? { body: "{}" } : {}),
  });
  const text = await res.text();
  let message = text;
  try {
    const parsed = JSON.parse(text);
    message = parsed.message ?? parsed.error ?? text;
  } catch {
    // keep raw text
  }
  return { ok: res.ok, status: res.status, text, message: String(message).slice(0, 300) };
}

/* ------------------------------------------------------------------ ntfy */

// The ntfy topic lives in the app's own database (app_keys, name "ntfy_topic"),
// so it is not in the public repo. A NTFY_TOPIC env var still overrides it.
let topicCache = null;
async function ntfyTopic() {
  if (process.env.NTFY_TOPIC) return process.env.NTFY_TOPIC;
  if (topicCache) return topicCache;
  const rows = await db("app_keys?select=value&name=eq.ntfy_topic").catch(() => null);
  topicCache = rows?.[0]?.value?.trim() || null; // null is not cached: retried next time
  return topicCache;
}

export async function ntfyConfigured() {
  return Boolean(await ntfyTopic());
}

export async function notify({ title, message, tags = [], priority = 3 }) {
  const topic = await ntfyTopic();
  if (!topic) return false;
  const server = (process.env.NTFY_SERVER ?? "https://ntfy.sh").replace(/\/$/, "");
  // JSON publishing goes to the server root; it allows non-ASCII titles.
  const res = await fetch(`${server}/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic, title, message, tags, priority, click: SITE_URL }),
  });
  return res.ok;
}
