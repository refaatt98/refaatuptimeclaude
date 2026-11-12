import { motion } from "motion/react";
import { Activity, CircleCheck, PauseCircle, Server } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { CountUp } from "./CountUp";
import { cn } from "@/lib/utils";

type Stat = {
  label: string;
  value: number;
  decimals?: number;
  suffix?: string;
  icon: LucideIcon;
  tone: string;
};

export function StatsBar({
  total,
  active,
  paused,
  averageUptime,
}: {
  total: number;
  active: number;
  paused: number;
  averageUptime: number;
}) {
  const stats: Stat[] = [
    { label: "Total projects", value: total, icon: Server, tone: "text-primary bg-primary/12" },
    { label: "Active", value: active, icon: CircleCheck, tone: "text-success bg-success/12" },
    { label: "Paused", value: paused, icon: PauseCircle, tone: "text-destructive bg-destructive/12" },
    {
      label: "Average uptime",
      value: averageUptime,
      decimals: 1,
      suffix: "%",
      icon: Activity,
      tone: "text-primary bg-primary/12",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07, type: "spring", stiffness: 220, damping: 22 }}
          className="glass-panel warm-card rounded-lg p-4 sm:p-5"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-muted-foreground">{stat.label}</p>
            <motion.span
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15 + i * 0.07, type: "spring", stiffness: 420, damping: 14 }}
              className={cn("flex h-9 w-9 items-center justify-center rounded-md", stat.tone)}
            >
              <stat.icon className="h-4 w-4" />
            </motion.span>
          </div>
          <p className="mt-3 text-2xl font-extrabold sm:mt-4 sm:text-3xl">
            <CountUp value={stat.value} decimals={stat.decimals ?? 0} suffix={stat.suffix ?? ""} />
          </p>
        </motion.div>
      ))}
    </div>
  );
}
