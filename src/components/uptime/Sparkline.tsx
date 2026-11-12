import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { LogPoint } from "@/hooks/useUptimeData";

export function Sparkline({
  logs,
  tone,
  height = 44,
}: {
  logs: LogPoint[];
  tone: "success" | "destructive" | "warning" | "muted-foreground";
  height?: number;
}) {
  const detailed = height > 100;
  const data = (logs.length > 0 ? logs : [{ status: "unknown" as const, checked_at: "", response_time_ms: null }])
    .slice(-60)
    .map((log, index) => ({
      index,
      time: log.checked_at ? new Date(log.checked_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "",
      value: log.status === "active" ? 100 : log.status === "restarting" ? 50 : 8,
    }));

  const color = tone === "muted-foreground" ? "var(--muted-foreground)" : `var(--${tone})`;
  const gradientId = `spark-${tone}-${height}`;

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: detailed ? 8 : 0, bottom: detailed ? 4 : 0, left: detailed ? -18 : 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.5} />
              <stop offset="55%" stopColor="var(--primary)" stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0.04} />
            </linearGradient>
          </defs>
          {detailed && <CartesianGrid stroke="var(--border)" strokeDasharray="3 5" vertical={false} />}
          <YAxis hide={!detailed} domain={[0, 105]} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickFormatter={(value) => `${value}%`} />
          {detailed && <XAxis dataKey="time" minTickGap={38} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />}
          {detailed && <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }} formatter={(value) => [`${Number(value)}%`, "Availability"]} labelStyle={{ color: "var(--muted-foreground)" }} />}
          <Area
            type="stepAfter"
            dataKey="value"
            stroke="var(--primary)"
            strokeWidth={2.25}
            fill={`url(#${gradientId})`}
            isAnimationActive
            animationDuration={600}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
