// On-demand version of the scheduled job, used by the dashboard's
// "Check now" / "Send test notification" actions.
//   POST /api/auto-resume       → runs the auto-resume job now
//   POST /api/auto-resume?test  → only sends a test push notification
import { runAutoResume } from "../lib/auto-resume-job.mjs";
import { notify, ntfyConfigured } from "../lib/uptime-core.mjs";

export default async (request) => {
  if (request.method !== "POST") {
    return Response.json({ ok: true, notifications: ntfyConfigured() });
  }

  if (new URL(request.url).searchParams.has("test")) {
    if (!ntfyConfigured()) {
      return Response.json({
        ok: false,
        message: "NTFY_TOPIC is not set in Netlify's environment variables yet.",
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
