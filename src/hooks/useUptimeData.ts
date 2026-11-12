import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { SimpleStatus } from "@/lib/status";

export type LogPoint = { status: SimpleStatus; checked_at: string; response_time_ms: number | null };

export type ProjectView = {
  id: string;
  project_ref: string;
  project_name: string;
  display_name: string | null;
  organization_name: string | null;
  organization_label: string | null;
  notes: string | null;
  status: SimpleStatus;
  last_checked_at: string | null;
  uptime24h: number;
  logs: LogPoint[];
};

export type ChangeView = {
  id: string;
  project_id: string;
  project_name: string;
  old_status: SimpleStatus | null;
  new_status: SimpleStatus;
  changed_at: string;
};

export type UptimeData = {
  projects: ProjectView[];
  changes: ChangeView[];
  fetchedAt: string;
};

async function fetchUptimeData(): Promise<UptimeData> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [projectsRes, logsRes, changesRes] = await Promise.all([
    supabase.from("monitored_projects").select("*").eq("is_ignored", false).order("project_name"),
    supabase
      .from("status_logs")
      .select("project_id, status, checked_at, response_time_ms")
      .gte("checked_at", since)
      .order("checked_at", { ascending: true })
      .limit(1000),
    supabase
      .from("status_changes")
      .select("id, project_id, old_status, new_status, changed_at")
      .order("changed_at", { ascending: false })
      .limit(40),
  ]);

  if (projectsRes.error) throw projectsRes.error;

  const logsByProject = new Map<string, LogPoint[]>();
  for (const log of logsRes.data ?? []) {
    const list = logsByProject.get(log.project_id) ?? [];
    list.push({
      status: log.status as SimpleStatus,
      checked_at: log.checked_at,
      response_time_ms: log.response_time_ms,
    });
    logsByProject.set(log.project_id, list);
  }

  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;

  const projects: ProjectView[] = (projectsRes.data ?? []).map((row) => {
    const logs = logsByProject.get(row.id) ?? [];
    const last = logs[logs.length - 1];
    const recent = logs.filter((l) => new Date(l.checked_at).getTime() >= dayAgo);
    const base = recent.length > 0 ? recent : logs;
    const up = base.filter((l) => l.status === "active").length;
    return {
      id: row.id,
      project_ref: row.project_ref,
      project_name: row.project_name,
      display_name: row.display_name ?? null,
      organization_name: row.organization_name,
      organization_label: row.organization_label,
      notes: row.notes ?? null,
      status: (last?.status ?? "unknown") as SimpleStatus,
      last_checked_at: last?.checked_at ?? null,
      uptime24h: base.length > 0 ? (up / base.length) * 100 : 0,
      logs,
    };
  });

  const nameById = new Map(projects.map((p) => [p.id, p.project_name]));

  const changes: ChangeView[] = (changesRes.data ?? []).map((c) => ({
    id: c.id,
    project_id: c.project_id,
    project_name: nameById.get(c.project_id) ?? "Unknown project",
    old_status: (c.old_status as SimpleStatus | null) ?? null,
    new_status: c.new_status as SimpleStatus,
    changed_at: c.changed_at,
  }));

  return { projects, changes, fetchedAt: new Date().toISOString() };
}

export function useUptimeData() {
  return useQuery({
    queryKey: ["uptime-data"],
    queryFn: fetchUptimeData,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
}
