import { AnimatePresence, motion } from "motion/react";
import { ArrowDownRight, ArrowUpRight, History, RotateCw } from "lucide-react";

import { cn } from "@/lib/utils";
import { STATUS_LABEL, relativeTime } from "@/lib/status";
import type { ChangeView } from "@/hooks/useUptimeData";

export function ActivityFeed({ changes }: { changes: ChangeView[] }) {
  return (
    <div className="glass-panel warm-card rounded-lg p-5">
      <div className="flex items-center gap-2">
        <History className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-base font-bold">Activity</h2>
      </div>

      {changes.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          No status changes recorded yet. Changes will appear here as soon as a project flips.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          <AnimatePresence initial={false}>
            {changes.map((change) => {
              const restored = change.new_status === "active";
              const restarting = change.new_status === "restarting";
              const Icon = restored ? ArrowUpRight : restarting ? RotateCw : ArrowDownRight;
              return (
                <motion.li
                  key={change.id}
                  layout
                  initial={{ opacity: 0, y: -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 28 }}
                  className="flex items-start gap-3"
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                      restored
                        ? "bg-success/12 text-success"
                        : restarting
                          ? "bg-warning/12 text-warning"
                          : "bg-destructive/12 text-destructive",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm leading-snug">
                      <span className="font-bold">{change.project_name}</span>{" "}
                      <span className="text-muted-foreground">
                        went from {change.old_status ? STATUS_LABEL[change.old_status] : "Unknown"} →{" "}
                        {STATUS_LABEL[change.new_status]}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">{relativeTime(change.changed_at)}</p>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
