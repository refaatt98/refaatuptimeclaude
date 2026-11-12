import { db, loadTokens, mgmt, notify, ntfyConfigured } from "./uptime-core.mjs";

// Only fully paused projects can be restored; PAUSING/GOING_DOWN must finish first.
const RESTORABLE = new Set(["INACTIVE", "PAUSED"]);

export async function runAutoResume() {
  const summary = { ok: true, checked: 0, paused: [], resumed: [], failed: [], errors: [] };

  const { tokens, unreadable } = await loadTokens();
  if (unreadable.length > 0) summary.errors.push(`Could not unlock: ${unreadable.join(", ")}`);
  if (tokens.length === 0) {
    summary.ok = false;
    summary.errors.push("No connected Supabase accounts.");
    return summary;
  }

  // Every project visible to any token, remembering which token can reach it.
  const found = new Map();
  await Promise.all(
    tokens.map(async ({ label, token }) => {
      const res = await mgmt("/projects", token);
      if (!res.ok) {
        summary.errors.push(`${label}: ${res.message} (${res.status})`);
        return;
      }
      for (const p of JSON.parse(res.text)) {
        if (!found.has(p.id)) found.set(p.id, { ...p, label, token });
      }
    }),
  );
  summary.checked = found.size;

  const paused = [...found.values()].filter((p) => RESTORABLE.has(String(p.status).toUpperCase()));
  if (paused.length === 0) return summary;

  const refs = paused.map((p) => `"${p.id}"`).join(",");
  const rows =
    (await db(
      `monitored_projects?select=id,project_ref,project_name,display_name,is_ignored&project_ref=in.(${refs})`,
    )) ?? [];
  const byRef = new Map(rows.map((r) => [r.project_ref, r]));

  for (const p of paused) {
    let row = byRef.get(p.id);
    if (row?.is_ignored) continue; // removed from the dashboard: leave it alone
    if (!row) {
      const inserted = await db("monitored_projects", {
        method: "POST",
        body: JSON.stringify({ project_ref: p.id, project_name: p.name, organization_label: p.label }),
      }).catch(() => null);
      row = inserted?.[0];
    }
    const name = row?.display_name || p.name;
    summary.paused.push(name);

    // Last recorded status tells us whether we already reported this pause.
    const last = row
      ? ((await db(
          `status_logs?select=status&project_id=eq.${row.id}&order=checked_at.desc&limit=1`,
        )) ?? [])[0]?.status ?? null
      : null;

    const res = await mgmt(`/projects/${p.id}/restore`, p.token, "POST");

    if (res.ok) {
      summary.resumed.push(name);
      if (row) {
        await db("status_logs", {
          method: "POST",
          body: JSON.stringify({ project_id: row.id, status: "restarting", response_time_ms: null }),
        }).catch(() => {});
        await db("status_changes", {
          method: "POST",
          body: JSON.stringify({ project_id: row.id, old_status: "paused", new_status: "restarting" }),
        }).catch(() => {});
      }
      await notify({
        title: `Resumed: ${name}`,
        message: `"${name}" (${p.label}) was paused. Auto-resume started it back up.`,
        tags: ["arrows_counterclockwise"],
        priority: 4,
      });
    } else {
      summary.failed.push(`${name}: ${res.message} (${res.status})`);
      if (row) {
        await db("status_logs", {
          method: "POST",
          body: JSON.stringify({ project_id: row.id, status: "paused", response_time_ms: null }),
        }).catch(() => {});
      }
      // Notify once per pause, not every 5 minutes while it keeps failing.
      if (last !== "paused") {
        await notify({
          title: `Could not resume: ${name}`,
          message: `Supabase error (${res.status}): ${res.message}`,
          tags: ["warning"],
          priority: 5,
        });
      }
    }
  }

  summary.ok = summary.failed.length === 0 && summary.errors.length === 0;
  summary.notifications = ntfyConfigured();
  return summary;
}
