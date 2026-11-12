// Turns on Web Push for this device (installed PWA or desktop browser).
const SW_URL = "/sw.js";

function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const padded = (value + "=".repeat((4 - (value.length % 4)) % 4))
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const bin = atob(padded);
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Registers the service worker early so a later bell tap is quick. */
export function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || window.self !== window.top) return;
  if (!import.meta.env.PROD) return;
  navigator.serviceWorker.register(SW_URL).catch(() => {});
}

export async function enablePushNotifications(): Promise<{ ok: boolean; message: string }> {
  const isIos = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;

  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    return {
      ok: false,
      message:
        isIos && !standalone
          ? "On iPhone, open the app from its Home Screen icon (Share → Add to Home Screen), then tap the bell there."
          : "This browser does not support push notifications.",
    };
  }

  // Ask first, while still inside the tap: Safari requires a user gesture.
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return {
      ok: false,
      message:
        "Notifications are blocked. Allow them in Settings → Notifications → Refaat Uptime (or the browser's site settings).",
    };
  }

  const registration =
    (await navigator.serviceWorker.getRegistration(SW_URL)) ??
    (await navigator.serviceWorker.register(SW_URL));
  await navigator.serviceWorker.ready;

  const keyRes = await fetch("/api/push");
  if (!keyRes.ok) return { ok: false, message: `Push service unavailable (HTTP ${keyRes.status}).` };
  const { publicKey } = (await keyRes.json()) as { publicKey: string };

  let subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    // Re-subscribe if it was made with a different server key.
    const current = subscription.options.applicationServerKey;
    const expected = base64UrlToBytes(publicKey);
    const same =
      current &&
      new Uint8Array(current).length === expected.length &&
      new Uint8Array(current).every((b, i) => b === expected[i]);
    if (!same) {
      await subscription.unsubscribe();
      subscription = null;
    }
  }
  subscription ??= await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: base64UrlToBytes(publicKey),
  });

  const res = await fetch("/api/push", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subscription: subscription.toJSON() }),
  });
  return (await res.json()) as { ok: boolean; message: string };
}
