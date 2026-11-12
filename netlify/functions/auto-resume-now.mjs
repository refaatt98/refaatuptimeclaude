// On-demand version of the scheduled job, used by the dashboard's
// "Check now" / "Send test notification" actions.
//   POST /api/auto-resume       → runs the auto-resume job now
//   POST /api/auto-resume?test  → only sends a test push notification
import { runAutoResume } from "../lib/auto-resume-job.mjs";
import { notify, ntfyConfigured } from "../lib/uptime-core.mjs";

export default async (request) => {
  if (request.method !== "POST") {
    return Response.json({ ok: true, notifications: await ntfyConfigured() });
  }

  if (new URL(request.url).searchParams.has("test")) {
    if (!await ntfyConfigured()) {
      return Response.json({
        ok: false,
        message: "No ntfy topic saved yet — tap the bell on the dashboard to add it.",
      });
    }
    const sent = await notify({
      title: "Refaat Uptime",
      message: "Test notification — auto-resume alerts will arrive here.",
      tags: ["bell"],
    });
    return Response.json({
      ok: sent,
      message: sent ? "Test notification sent." : "ntfy did not accept the notification.",
    });
  }

  return Response.json(await runAutoResume());
};
