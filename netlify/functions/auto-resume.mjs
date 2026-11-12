// Scheduled Netlify Function: every 5 minutes, find paused Supabase projects
// across all connected accounts, ask Supabase to resume them, and send a push
// notification through ntfy (set NTFY_TOPIC in Netlify's environment variables).
import { runAutoResume } from "../lib/auto-resume-job.mjs";

export default async () => {
  const summary = await runAutoResume();
  console.log(JSON.stringify(summary));
};

export const config = { schedule: "*/5 * * * *" };
