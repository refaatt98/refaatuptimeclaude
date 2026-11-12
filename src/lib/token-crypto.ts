// AES-256-GCM token storage, byte-compatible with the previous server format:
// base64( iv[12] | authTag[16] | ciphertext ).
import { supabase } from "@/integrations/supabase/client";

const KEY_NAME = "account_token_key_v1";

function b64ToBytes(value: string): Uint8Array {
  const bin = atob(value);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesToB64(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

let cachedKey: Uint8Array | null = null;

/** The master key lives in the project's own database, so it travels with it. */
async function masterKey(): Promise<Uint8Array> {
  if (cachedKey) return cachedKey;

  const { data } = await supabase
    .from("app_keys")
    .select("value")
    .eq("name", KEY_NAME)
    .maybeSingle();

  if (data?.value) {
    cachedKey = b64ToBytes(data.value);
    return cachedKey;
  }

  const fresh = crypto.getRandomValues(new Uint8Array(32));
  const { error } = await supabase
    .from("app_keys")
    .insert({ name: KEY_NAME, value: bytesToB64(fresh) });
  if (error) {
    const { data: again } = await supabase
      .from("app_keys")
      .select("value")
      .eq("name", KEY_NAME)
      .maybeSingle();
    if (!again?.value) throw new Error("No encryption key available");
    cachedKey = b64ToBytes(again.value);
    return cachedKey;
  }

  cachedKey = fresh;
  return cachedKey;
}

async function importKey(raw: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", raw as unknown as BufferSource, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function encryptToken(plaintext: string): Promise<string> {
  const key = await importKey(await masterKey());
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const sealed = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv as unknown as BufferSource },
      key,
      new TextEncoder().encode(plaintext),
    ),
  );
  const tag = sealed.subarray(sealed.length - 16);
  const ct = sealed.subarray(0, sealed.length - 16);
  const out = new Uint8Array(iv.length + tag.length + ct.length);
  out.set(iv, 0);
  out.set(tag, iv.length);
  out.set(ct, iv.length + tag.length);
  return bytesToB64(out);
}

export async function decryptToken(stored: string): Promise<string> {
  const buf = b64ToBytes(stored);
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const ct = buf.subarray(28);
  const sealed = new Uint8Array(ct.length + tag.length);
  sealed.set(ct, 0);
  sealed.set(tag, ct.length);

  const key = await importKey(await masterKey());
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv as unknown as BufferSource }, key, sealed as unknown as BufferSource);
  return new TextDecoder().decode(plain);
}

export async function canDecryptToken(stored: string): Promise<boolean> {
  try {
    await decryptToken(stored);
    return true;
  } catch {
    return false;
  }
}
