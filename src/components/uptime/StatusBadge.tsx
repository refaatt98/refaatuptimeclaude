import { AnimatePresence, motion } from "motion/react";

import { cn } from "@/lib/utils";
import { STATUS_LABEL, type SimpleStatus } from "@/lib/status";

const tone: Record<SimpleStatus, string> = {
  active: "bg-success/12 text-success border-success/30",
  paused: "bg-destructive/12 text-destructive border-destructive/30",
  restarting: "bg-warning/12 text-warning border-warning/30",
  unknown: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({ status, className }: { status: SimpleStatus; className?: string }) {
  return (
    <span className={cn("relative inline-flex h-6 min-w-20 items-center justify-center", className)}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={status}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.25 }}
          className={cn(
            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase",
            tone[status],
          )}
        >
          {STATUS_LABEL[status]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
