import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { ActivityFeed } from "@/components/uptime/ActivityFeed";
import { ConnectDialog } from "@/components/uptime/ConnectDialog";
import { EmptyState } from "@/components/uptime/EmptyState";
import { EditableHeading } from "@/components/uptime/EditableHeading";
import { FilterBar, type StatusFilter } from "@/components/uptime/FilterBar";
import { Header } from "@/components/uptime/Header";
import { ProjectCard } from "@/components/uptime/ProjectCard";
import { ProjectPanel } from "@/components/uptime/ProjectPanel";
import { SkeletonGrid } from "@/components/uptime/SkeletonGrid";
import { StatsBar } from "@/components/uptime/StatsBar";
import { useUptimeData } from "@/hooks/useUptimeData";
import { STATUS_LABEL } from "@/lib/status";
import {
  deleteMonitoredProject,
  getDashboardSettings,
  resumeProject,
  runStatusCheck,
  updateDashboardSetting,
  updateProjectDisplayName,
  updateProjectNotes,
} from "@/lib/uptime-api";

export function Dashboard() {
  const { data, isLoading, refetch } = useUptimeData();
  const queryClient = useQueryClient();

  const [filter, setFilter] = useState<StatusFilter>("all");
  const [organization, setOrganization] = useState("all");
  const [search, setSearch] = useState("");
  const [openProjectId, setOpenProjectId] = useState<string | null>(null);
  const [flashing, setFlashing] = useState<Record<string, boolean>>({});
  const [connectOpen, setConnectOpen] = useState(false);

  const settings = useQuery({
    queryKey: ["dashboard-settings"],
    queryFn: () => getDashboardSettings(),
  });

  const updateSetting = useMutation({
    mutationFn: async (input: { key: "title" | "subtitle"; value: string }) =>
      updateDashboardSetting(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["dashboard-settings"] });
      toast.success("Dashboard text updated");
    },
    onError: () => toast.error("Could not update dashboard text"),
  });

  const previousStatuses = useRef<Record<string, string>>({});

  const check = useMutation({
    mutationFn: async () => runStatusCheck(),
    onSuccess: async (result) => {
      if (result.errors.length > 0 && result.projects.length === 0) {
        toast.error("Could not reach Supabase", { description: result.errors[0] });
      }
      await queryClient.invalidateQueries({ queryKey: ["uptime-data"] });
    },
    onError: () => toast.error("Status check failed", { description: "Please try again in a moment." }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => deleteMonitoredProject({ id }),
    onSuccess: async () => {
      toast.success("Project removed", { description: "It will stay hidden during future checks." });
      await queryClient.invalidateQueries({ queryKey: ["uptime-data"] });
    },
    onError: () => toast.error("Could not remove that project"),
  });

  const resume = useMutation({
    mutationFn: async (id: string) => resumeProject({ id }),
    onSuccess: async (result) => {
      toast.success("Resume requested", { description: result.message });
      await queryClient.invalidateQueries({ queryKey: ["uptime-data"] });
    },
    onError: (error) =>
      toast.error("Could not resume project", {
        description: error instanceof Error ? error.message : "Please try again.",
      }),
  });

  const saveNotes = useMutation({
    mutationFn: async (input: { id: string; notes: string }) => updateProjectNotes(input),
    onSuccess: async () => {
      toast.success("Note saved");
      await queryClient.invalidateQueries({ queryKey: ["uptime-data"] });
    },
    onError: () => toast.error("Could not save that note"),
  });

  const saveName = useMutation({
    mutationFn: async (input: { id: string; displayName: string }) =>
      updateProjectDisplayName(input),
    onSuccess: async () => {
      toast.success("Display name updated");
      await queryClient.invalidateQueries({ queryKey: ["uptime-data"] });
    },
    onError: () => toast.error("Could not save that name"),
  });

  // Detect status flips between refreshes → flash card + toast.
  useEffect(() => {
    if (!data) return;
    const next: Record<string, string> = {};
    const flips: string[] = [];
    for (const project of data.projects) {
      next[project.id] = project.status;
      const before = previousStatuses.current[project.id];
      if (before && before !== project.status) {
        flips.push(project.id);
        toast(`${project.project_name} is now ${STATUS_LABEL[project.status]}`, {
          description: `Changed from ${STATUS_LABEL[before as keyof typeof STATUS_LABEL]}`,
        });
      }
    }
    previousStatuses.current = next;
    if (flips.length === 0) return;
    setFlashing(Object.fromEntries(flips.map((id) => [id, true])));
    const timeout = window.setTimeout(() => setFlashing({}), 2000);
    return () => window.clearTimeout(timeout);
  }, [data]);

  const projects = data?.projects ?? [];

  const organizations = useMemo(
    () =>
      Array.from(new Set(projects.map((p) => p.organization_name).filter((v): v is string => Boolean(v)))).sort(),
    [projects],
  );

  const visible = useMemo(
    () =>
      projects.filter((project) => {
        if (filter === "active" && project.status !== "active") return false;
        if (filter === "paused" && project.status !== "paused") return false;
        if (organization !== "all" && project.organization_name !== organization) return false;
        if (
          search &&
          !project.project_name.toLowerCase().includes(search.toLowerCase()) &&
          !(project.display_name ?? "").toLowerCase().includes(search.toLowerCase())
        )
          return false;
        return true;
      }),
    [projects, filter, organization, search],
  );

  const stats = useMemo(() => {
    const active = projects.filter((p) => p.status === "active").length;
    const paused = projects.filter((p) => p.status === "paused").length;
    const average =
      projects.length > 0 ? projects.reduce((sum, p) => sum + p.uptime24h, 0) / projects.length : 0;
    return { total: projects.length, active, paused, average };
  }, [projects]);

  const lastChecked = useMemo(() => {
    const stamps = projects.map((p) => p.last_checked_at).filter((v): v is string => Boolean(v));
    if (stamps.length === 0) return null;
    return stamps.sort().at(-1) ?? null;
  }, [projects]);

  const openProject = projects.find((p) => p.id === openProjectId) ?? null;

  return (
    <div className="min-h-screen hero-glow">
      <Header
        lastCheckedAt={lastChecked}
        refreshing={check.isPending}
        onRefresh={() => {
          check.mutate();
          refetch();
        }}
        onConnect={() => setConnectOpen(true)}
      />

      <main className="mx-auto w-full max-w-[1400px] px-3 pt-6 pb-12 sm:px-6 sm:pt-10 sm:pb-16 lg:pt-14">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-7 sm:mb-10"
        >
          <EditableHeading
            kind="title"
            value={settings.data?.title ?? "Status overview"}
            saving={updateSetting.isPending && updateSetting.variables?.key === "title"}
            onSave={(value) => updateSetting.mutate({ key: "title", value })}
          />
          <div className="mt-3">
            <EditableHeading
              kind="subtitle"
              value={settings.data?.subtitle ?? "Live monitoring across every connected Supabase organization."}
              saving={updateSetting.isPending && updateSetting.variables?.key === "subtitle"}
              onSave={(value) => updateSetting.mutate({ key: "subtitle", value })}
            />
          </div>
          <p className="mt-5 text-sm font-semibold text-primary">
            {stats.total} {stats.total === 1 ? "project" : "projects"} · {organizations.length || 0}{" "}
            {organizations.length === 1 ? "organization" : "organizations"}
          </p>
        </motion.div>

        <StatsBar
          total={stats.total}
          active={stats.active}
          paused={stats.paused}
          averageUptime={stats.average}
        />

        <div className="mt-6 grid gap-5 sm:mt-8 sm:gap-6 xl:grid-cols-[1fr_340px]">
          <section>
            <div className="mb-5">
              <FilterBar
                filter={filter}
                onFilter={setFilter}
                organizations={organizations}
                organization={organization}
                onOrganization={setOrganization}
                search={search}
                onSearch={setSearch}
              />
            </div>

            {isLoading ? (
              <SkeletonGrid />
            ) : projects.length === 0 ? (
              <EmptyState onCheck={() => setConnectOpen(true)} checking={false} />
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
                <AnimatePresence mode="popLayout">
                  {visible.map((project, index) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      index={index}
                      flashing={Boolean(flashing[project.id])}
                      resuming={resume.isPending && resume.variables === project.id}
                      onOpen={() => setOpenProjectId(project.id)}
                      onDelete={() => remove.mutate(project.id)}
                      onResume={() => resume.mutate(project.id)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}

            {!isLoading && projects.length > 0 && visible.length === 0 && (
              <p className="py-12 text-center text-sm text-muted-foreground">
                No projects match these filters.
              </p>
            )}
          </section>

          <aside className="xl:sticky xl:top-24 xl:self-start">
            <ActivityFeed changes={data?.changes ?? []} />
          </aside>
        </div>
      </main>

      <ProjectPanel
        project={openProject}
        onClose={() => setOpenProjectId(null)}
        savingNotes={saveNotes.isPending}
        savingName={saveName.isPending}
        resuming={resume.isPending && resume.variables === openProject?.id}
        onResume={() => {
          if (openProject) resume.mutate(openProject.id);
        }}
        onSaveNotes={(notes) => {
          if (openProject) saveNotes.mutate({ id: openProject.id, notes });
        }}
        onSaveDisplayName={(displayName) => {
          if (openProject) saveName.mutate({ id: openProject.id, displayName });
        }}
        onDelete={() => {
          if (!openProject) return;
          remove.mutate(openProject.id);
          setOpenProjectId(null);
        }}
      />
      <ConnectDialog open={connectOpen} onOpenChange={setConnectOpen} />
    </div>
  );
}
