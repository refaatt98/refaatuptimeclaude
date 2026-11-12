// All dashboard actions run in the browser against Supabase and the Supabase
// Management API, so the app can be deployed as plain static files.
import { supabase } from "@/integrations/supabase/client";
import { canDecryptToken, decryptToken, encryptToken } from "@/lib/token-crypto";
import { normalizeStatus, type SimpleStatus } from "@/lib/status";
import { supabaseMgmt } from "@/lib/supabase-mgmt";

type ApiProject = { id: string; name: string; organization_id?: string; status?: string };
type ApiOrg = { id: string; name: string };
type TokenEntry = { label: string; token: string };

export type ConnectedAccount = {
  id: string;
  label: string;
  organization_names: string | null;
  created_at: string;
  last_verified_at: string | null;
  token_readable: boolean;
};

export type CheckResultItem = {
  project_ref: string;
  project_name: string;
  organization_name: string | null;
  organization_label: string | null;
  status: SimpleStatus;
  response_time_ms: number | null;
  changed: boolean;
};

export type CheckResult = {
  ok: boolean;
  tokensUsed: number;
  projects: CheckResultItem[];
  errors: string[];
};

async function apiGet<T>(path: string, token: string): Promise<{ data: T | null; ms: number }> {
  const started = Date.now();
  const res = await supabaseMgmt({ data: { path, method: "GET", token } });
  const ms = Date.now() - started;
  if (!res.ok) throw new Error(`Supabase API ${path} failed: ${describeMgmtError(res)}`);
  return { data: JSON.parse(res.body) as T, ms };
}

let lastUnreadableLabels: string[] = [];

async function collectTokens(): Promise<TokenEntry[]> {
  const tokens: TokenEntry[] = [];
  const unreadable: string[] = [];

  const { data } = await supabase
    .from("supabase_accounts")
    .select("label, token_ciphertext")
    .order("created_at");

  for (const row of data ?? []) {
    try {
      tokens.push({ label: row.label, token: await decryptToken(row.token_ciphertext) });
    } catch {
      unreadable.push(row.label);
    }
  }

  lastUnreadableLabels = unreadable;
  return tokens;
}

/* ---------------------------------------------------------------- accounts */

export async function listConnectedAccounts(): Promise<ConnectedAccount[]> {
  const { data } = await supabase
    .from("supabase_accounts")
    .select("id, label, organization_names, created_at, last_verified_at, token_ciphertext")
    .order("created_at");

  const rows = data ?? [];
  const readable = await Promise.all(rows.map((r) => canDecryptToken(r.token_ciphertext)));
  return rows.map(({ token_ciphertext: _ct, ...rest }, i) => ({
    ...rest,
    token_readable: readable[i] ?? false,
  }));
}

function supabaseMessage(body: string) {
  try {
    const parsed = JSON.parse(body) as { message?: string; error?: string };
    return parsed.message ?? parsed.error ?? "";
  } catch {
    return body.trim().startsWith("<") ? "" : body.trim().slice(0, 200);
  }
}

function describeMgmtError(res: { status: number; body: string; proxied?: boolean }) {
  if (res.proxied === false) {
    return `The app's Supabase proxy is not reachable (HTTP ${res.status}). Deploy the site from Git on Netlify so the "supabase-mgmt" function is included.`;
  }
  // Show Supabase's own error text exactly as it sent it.
  const detail = supabaseMessage(res.body);
  return detail ? `Supabase error (${res.status}): ${detail}` : `Supabase error (${res.status}).`;
}

async function verifyToken(token: string) {
  const res = await supabaseMgmt({
    data: { path: "/organizations", method: "GET", token },
  });
  if (!res.ok) return { ok: false as const, message: describeMgmtError(res) };
  return { ok: true as const, orgs: JSON.parse(res.body) as ApiOrg[] };
}

export async function connectSupabaseAccount(input: { token: string; label?: string }) {
  const token = input.token.trim();
  const verified = await verifyToken(token);
  if (!verified.ok) return verified;

  const orgNames = verified.orgs.map((o) => o.name).join(", ");
  const { error } = await supabase.from("supabase_accounts").insert({
    label: input.label?.trim() || verified.orgs[0]?.name || "Supabase account",
    organization_names: orgNames,
    token_ciphertext: await encryptToken(token),
    last_verified_at: new Date().toISOString(),
  });
  if (error) return { ok: false as const, message: "Could not save this account." };

  const result = await runStatusCheck();
  return { ok: true as const, organizations: orgNames, discovered: result.projects.length };
}

export async function updateAccountToken(input: { id: string; token: string }) {
  const token = input.token.trim();
  const verified = await verifyToken(token);
  if (!verified.ok) return verified;

  const { error } = await supabase
    .from("supabase_accounts")
    .update({
      organization_names: verified.orgs.map((o) => o.name).join(", "),
      token_ciphertext: await encryptToken(token),
      last_verified_at: new Date().toISOString(),
    })
    .eq("id", input.id);
  if (error) return { ok: false as const, message: "Could not save the new token." };

  return { ok: true as const, message: "Token updated." };
}

export async function disconnectSupabaseAccount(input: { id: string }) {
  await supabase.from("supabase_accounts").delete().eq("id", input.id);
  return { ok: true as const };
}

/* -------------------------------------------------------------- dashboard */

export async function getDashboardSettings() {
  const { data, error } = await supabase
    .from("dashboard_settings")
    .select("key, value")
    .in("key", ["title", "subtitle"]);
  if (error) throw new Error(error.message);
  const values = Object.fromEntries((data ?? []).map((row) => [row.key, row.value]));
  return {
    title: values["title"] ?? "Status overview",
    subtitle:
      values["subtitle"] ?? "Live monitoring across every connected Supabase organization.",
  };
}

export async function updateDashboardSetting(input: { key: "title" | "subtitle"; value: string }) {
  const value = input.value.trim().slice(0, 140);
  if (value.length === 0) throw new Error("Value cannot be empty");
  const { error } = await supabase
    .from("dashboard_settings")
    .upsert({ key: input.key, value }, { onConflict: "key" });
  if (error) throw new Error(error.message);
  return { key: input.key, value };
}

export async function updateProjectNotes(input: { id: string; notes: string }) {
  const notes = input.notes.trim().slice(0, 2000);
  const { error } = await supabase
    .from("monitored_projects")
    .update({ notes: notes.length > 0 ? notes : null })
    .eq("id", input.id);
  if (error) throw new Error(error.message);
  return { ok: true as const };
}

export async function updateProjectDisplayName(input: { id: string; displayName: string }) {
  const displayName = input.displayName.trim().slice(0, 140);
  const { error } = await supabase
    .from("monitored_projects")
    .update({ display_name: displayName.length > 0 ? displayName : null })
    .eq("id", input.id);
  if (error) throw new Error(error.message);
  return { ok: true as const };
}

export async function deleteMonitoredProject(input: { id: string }) {
  const { error } = await supabase
    .from("monitored_projects")
    .update({ is_ignored: true })
    .eq("id", input.id);
  if (error) throw new Error(error.message);
  return { ok: true as const };
}

/* ------------------------------------------------------------ resume/check */

async function findTokenForProject(
  projectRef: string,
  label: string | null,
): Promise<TokenEntry | null> {
  const tokens = await collectTokens();
  if (tokens.length === 0) return null;

  const target = label?.trim().toLowerCase() ?? null;
  const ordered = target
    ? [...tokens].sort((a, b) => {
        const am = a.label.trim().toLowerCase() === target ? 0 : 1;
        const bm = b.label.trim().toLowerCase() === target ? 0 : 1;
        return am - bm;
      })
    : tokens;

  for (const entry of ordered) {
    try {
      const { data } = await apiGet<ApiProject[]>("/projects", entry.token);
      if ((data ?? []).some((p) => p.id === projectRef)) return entry;
    } catch {
      // Try the next token.
    }
  }
  return null;
}

export async function resumeProject(input: { id: string }) {
  const { data: project, error } = await supabase
    .from("monitored_projects")
    .select("project_ref, organization_label")
    .eq("id", input.id)
    .single();
  if (error || !project) throw new Error("Project not found");

  const entry = await findTokenForProject(project.project_ref, project.organization_label);
  if (!entry) {
    throw new Error(
      `None of the connected accounts can access this project${
        project.organization_label ? ` (saved as "${project.organization_label}")` : ""
      } — reconnect the account first.`,
    );
  }

  const res = await supabaseMgmt({
    data: {
      path: `/projects/${project.project_ref}/restore`,
      method: "POST",
      token: entry.token,
      body: "{}",
    },
  });
  if (!res.ok) {
    throw new Error(
      `Supabase refused the resume (${res.status})${res.body ? `: ${res.body.slice(0, 200)}` : ""}`,
    );
  }
  return { ok: true as const, message: "Resume requested — the project is starting back up." };
}

export async function runStatusCheck(): Promise<CheckResult> {
  const tokens = await collectTokens();
  const errors: string[] = [];
  const results: CheckResultItem[] = [];

  if (tokens.length === 0) {
    return {
      ok: false,
      tokensUsed: 0,
      projects: [],
      errors:
        lastUnreadableLabels.length > 0
          ? [
              `${lastUnreadableLabels.length} saved account(s) could not be unlocked: ${lastUnreadableLabels.join(", ")}. Reconnect them to restore monitoring.`,
            ]
          : ["No Supabase access tokens configured yet"],
    };
  }

  if (lastUnreadableLabels.length > 0) {
    errors.push(
      `Could not unlock saved token(s) for: ${lastUnreadableLabels.join(", ")} — reconnect those accounts.`,
    );
  }

  const { data: existingRows } = await supabase.from("monitored_projects").select("*");
  const existing = new Map((existingRows ?? []).map((r) => [r.project_ref, r]));

  type Discovered = {
    ref: string;
    name: string;
    orgName: string | null;
    label: string;
    status: SimpleStatus;
    ms: number;
  };
  const discovered: Discovered[] = [];

  for (const { label, token } of tokens) {
    try {
      const orgs = await apiGet<ApiOrg[]>("/organizations", token).catch(() => ({
        data: [] as ApiOrg[],
        ms: 0,
      }));
      const orgMap = new Map((orgs.data ?? []).map((o) => [o.id, o.name]));
      const primaryOrg = (orgs.data ?? [])[0]?.name ?? null;

      const { data: projects, ms } = await apiGet<ApiProject[]>("/projects", token);
      for (const p of projects ?? []) {
        discovered.push({
          ref: p.id,
          name: p.name,
          orgName: (p.organization_id ? orgMap.get(p.organization_id) : null) ?? primaryOrg,
          label,
          status: normalizeStatus(p.status),
          ms,
        });
      }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : `${label} failed`);
    }
  }

  for (const d of discovered) {
    const row = existing.get(d.ref);
    if (!row) {
      const { data: inserted } = await supabase
        .from("monitored_projects")
        .insert({
          project_ref: d.ref,
          project_name: d.name,
          organization_name: d.orgName,
          organization_label: d.label,
        })
        .select()
        .single();
      if (inserted) existing.set(d.ref, inserted);
    } else if (
      !row.is_ignored &&
      (row.project_name !== d.name || row.organization_name !== d.orgName)
    ) {
      await supabase
        .from("monitored_projects")
        .update({ project_name: d.name, organization_name: d.orgName })
        .eq("id", row.id);
    }
  }

  const monitored = discovered.filter((d) => !existing.get(d.ref)?.is_ignored);
  const ids = monitored.map((d) => existing.get(d.ref)?.id).filter((v): v is string => Boolean(v));

  const lastStatus = new Map<string, string>();
  if (ids.length > 0) {
    const { data: recentLogs } = await supabase
      .from("status_logs")
      .select("project_id, status, checked_at")
      .in("project_id", ids)
      .order("checked_at", { ascending: false })
      .limit(1000);
    for (const log of recentLogs ?? []) {
      if (!lastStatus.has(log.project_id)) lastStatus.set(log.project_id, log.status);
    }
  }

  const logRows: { project_id: string; status: string; response_time_ms: number | null }[] = [];
  const changeRows: { project_id: string; old_status: string | null; new_status: string }[] = [];

  for (const d of monitored) {
    const row = existing.get(d.ref);
    if (!row) continue;
    const previous = lastStatus.get(row.id) ?? null;
    const changed = previous !== null && previous !== d.status;
    logRows.push({ project_id: row.id, status: d.status, response_time_ms: d.ms });
    if (changed) changeRows.push({ project_id: row.id, old_status: previous, new_status: d.status });
    results.push({
      project_ref: d.ref,
      project_name: d.name,
      organization_name: d.orgName,
      organization_label: row.organization_label,
      status: d.status,
      response_time_ms: d.ms,
      changed,
    });
  }

  if (logRows.length > 0) await supabase.from("status_logs").insert(logRows);
  if (changeRows.length > 0) await supabase.from("status_changes").insert(changeRows);

  return { ok: errors.length === 0, tokensUsed: tokens.length, projects: results, errors };
}
