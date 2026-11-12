// Web Push for the installed PWA. VAPID keys and browser subscriptions live in
// Netlify Blobs, which only these functions can read, so nothing secret goes
// into the repo, the database or Netlify's environment variables.
import { getStore } from "@netlify/blobs";
import { generateVAPIDKeys, sendNotification } from "web-push";

const SUBJECT = "https://refaatuptime.netlify.app";

const store = () => getStore({ name: "web-push", consistency: "strong" });

export async function vapidKeys() {
  const s = store();
  let keys = await s.get("vapid", { type: "json" });
  if (!keys) {
    await s.setJSON("vapid", generateVAPIDKeys());
    keys = await s.get("vapid", { type: "json" });
  }
  return keys;
}

async function subKey(endpoint) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(endpoint));
  return `subs/${Buffer.from(hash).toString("hex")}`;
}

export async function saveSubscription(subscription) {
  await store().setJSON(await subKey(subscription.endpoint), subscription);
}

async function sendOne(subscription, payload, keys) {
  try {
    await sendNotification(subscription, JSON.stringify(payload), {
      vapidDetails: { subject: SUBJECT, publicKey: keys.publicKey, privateKey: keys.privateKey },
      TTL: 60 * 60 * 12,
      urgency: "high",
    });
    return true;
  } catch (error) {
    // Gone or invalid: the browser unsubscribed, so forget it.
    if (error?.statusCode === 404 || error?.statusCode === 410) {
      await store().delete(await subKey(subscription.endpoint));
    }
    console.log("web push failed", error?.statusCode, error?.body ?? error?.message);
    return false;
  }
}

/** Sends to one subscription, or to every saved one. Returns how many succeeded. */
export async function webPush({ title, message, url = SUBJECT }, only) {
  const keys = await vapidKeys();
  const payload = { title, message, url };
  if (only) return (await sendOne(only, payload, keys)) ? 1 : 0;

  const s = store();
  const { blobs } = await s.list({ prefix: "subs/" });
  const subs = await Promise.all(blobs.map((b) => s.get(b.key, { type: "json" })));
  const results = await Promise.all(subs.filter(Boolean).map((sub) => sendOne(sub, payload, keys)));
  return results.filter(Boolean).length;
}

export async function webPushCount() {
  const { blobs } = await store().list({ prefix: "subs/" });
  return blobs.length;
}
