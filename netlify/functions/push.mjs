// Web Push endpoint for the dashboard's bell button.
//   GET  /api/push               → { publicKey } for pushManager.subscribe
//   POST /api/push {subscription} → saves it and sends a test notification
import { saveSubscription, vapidKeys, webPush } from "../lib/web-push.mjs";

export default async (request) => {
  try {
    if (request.method === "GET") {
      const { publicKey } = await vapidKeys();
      return Response.json({ publicKey });
    }
    if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });

    const { subscription } = await request.json();
    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return Response.json({ ok: false, message: "Invalid subscription." }, { status: 400 });
    }
    await saveSubscription(subscription);
    const sent = await webPush(
      { title: "Refaat Uptime", message: "Notifications are on. Auto-resume alerts will arrive here." },
      subscription,
    );
    return Response.json({
      ok: sent === 1,
      message: sent === 1 ? "Test notification sent." : "Saved, but the test notification failed.",
    });
  } catch (error) {
    return Response.json(
      { ok: false, message: error instanceof Error ? error.message : "Push setup failed." },
      { status: 500 },
    );
  }
};
