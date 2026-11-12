import { motion } from "motion/react";

import { cn } from "@/lib/utils";
import type { SimpleStatus } from "@/lib/status";

const tone: Record<SimpleStatus, string> = {
  active: "bg-success",
  paused: "bg-destructive",
  restarting: "bg-warning",
  unknown: "bg-muted-foreground",
};

export function StatusDot({ status, size = 10 }: { status: SimpleStatus; size?: number }) {
  return (
    <span className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      {status === "active" && (
        <span className={cn("absolute inset-0 rounded-full opacity-60 pulse-ring", tone[status])} />
      )}
      <motion.span
        key={status}
        initial={status === "paused" ? { x: 0 } : { scale: 0.6, opacity: 0 }}
        animate={
          status === "paused"
            ? { x: [0, -3, 3, -2, 2, 0] }
            : { scale: 1, opacity: 1 }
        }
        transition={{ duration: 0.45, type: status === "paused" ? "tween" : "spring", bounce: 0.5 }}
        className={cn("relative inline-block h-full w-full rounded-full", tone[status])}
        style={{
          boxShadow:
            status === "active"
              ? "0 0 12px 2px color-mix(in oklab, var(--success) 55%, transparent)"
              : status === "paused"
                ? "0 0 12px 2px color-mix(in oklab, var(--destructive) 55%, transparent)"
                : undefined,
        }}
      />
    </span>
  );
}
