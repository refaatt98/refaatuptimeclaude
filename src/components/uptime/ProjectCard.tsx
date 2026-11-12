import { motion } from "motion/react";
import { ArrowUpRight, Loader2, Play, Trash2 } from "lucide-react";

import { StatusBadge } from "./StatusBadge";
import { StatusDot } from "./StatusDot";
import { Sparkline } from "./Sparkline";
import { cn } from "@/lib/utils";
import { relativeTime } from "@/lib/status";
import type { ProjectView } from "@/hooks/useUptimeData";
import { Button } from "@/components/ui/button";

const toneFor = (status: ProjectView["status"]) =>
  status === "active"
    ? ("success" as const)
    : status === "paused"
      ? ("destructive" as const)
      : status === "restarting"
        ? ("warning" as const)
        : ("muted-foreground" as const);

export function ProjectCard({
  project,
  index,
  flashing,
  resuming,
  onOpen,
  onDelete,
  onResume,
}: {
  project: ProjectView;
  index: number;
  flashing: boolean;
  resuming: boolean;
  onOpen: () => void;
  onDelete: () => void;
  onResume: () => void;
}) {
  const tone = toneFor(project.status);

  return (
    <motion.div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={flashing ? { opacity: 1, y: 0, scale: 1.015 } : { opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{
        delay: flashing ? 0 : index * 0.05,
        type: "spring",
        stiffness: 240,
        damping: 24,
      }}
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        "glass-panel warm-card group relative cursor-pointer overflow-hidden rounded-lg p-4 text-left transition-shadow duration-300 sm:p-5",
        "hover:lift-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:origin-left before:scale-x-0 before:bg-[image:var(--gradient-brand)] before:transition-transform before:duration-300 hover:before:scale-x-100",
        tone === "success" && "hover:border-success/40",
        tone === "destructive" && "hover:border-destructive/40",
      )}
    >
      {flashing && (
        <motion.span
          initial={{ opacity: 0.55 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 2 }}
          className={cn(
            "pointer-events-none absolute inset-0",
            tone === "success" ? "bg-success/25" : "bg-destructive/25",
          )}
        />
      )}

      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 sm:gap-4">
        <div className="flex min-w-0 items-start gap-2.5 sm:gap-3">
          <span className="mt-1.5">
            <StatusDot status={project.status} />
          </span>
          <div className="min-w-0">
            <p className="line-clamp-2 text-base font-bold leading-tight sm:text-lg">{project.display_name ?? project.project_name}</p>
            {project.display_name && (
              <p className="truncate text-xs font-normal text-muted-foreground/70">{project.project_name}</p>
            )}
            <p className="mt-1 truncate text-xs font-medium text-muted-foreground sm:text-sm">
              {project.organization_name ?? "Unknown org"}
              {project.organization_label ? ` · ${project.organization_label}` : ""}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <StatusBadge status={project.status} />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Remove ${project.project_name}`}
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
            className="h-9 w-9 text-muted-foreground hover:bg-destructive/15 hover:text-destructive sm:h-8 sm:w-8"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {project.status === "paused" && (
        <Button
          type="button"
          disabled={resuming}
          onClick={(event) => {
            event.stopPropagation();
            onResume();
          }}
          variant="outline"
          className="mt-4 w-full border-success/40 bg-success/10 text-success hover:bg-success/20 hover:text-success"
        >
          {resuming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
          {resuming ? "Resuming…" : "Resume project"}
        </Button>
      )}

      {project.notes && (
        <p className="mt-3 line-clamp-2 rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm leading-relaxed text-muted-foreground sm:mt-4">
          {project.notes}
        </p>
      )}

      <div className="mt-3 sm:mt-4">
        <Sparkline logs={project.logs} tone={tone} height={36} />
      </div>

      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
        <div>
          <p className="text-2xl font-extrabold leading-none">
            {project.uptime24h.toFixed(project.uptime24h === 100 ? 0 : 1)}%
          </p>
          <p className="text-xs font-medium text-muted-foreground">uptime · last 24h</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Checked {relativeTime(project.last_checked_at)}</p>
          <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
            Details <ArrowUpRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </motion.div>
  );
}
