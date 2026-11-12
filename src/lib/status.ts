export type SimpleStatus = "active" | "paused" | "restarting" | "unknown";

export function normalizeStatus(raw: string | null | undefined): SimpleStatus {
  const value = (raw ?? "").toUpperCase();
  if (value === "ACTIVE_HEALTHY" || value === "ACTIVE") return "active";
  if (value === "INACTIVE" || value === "PAUSED" || value === "PAUSING" || value === "GOING_DOWN")
    return "paused";
  if (
    value === "COMING_UP" ||
    value === "RESTARTING" ||
    value === "RESTORING" ||
    value === "UPGRADING" ||
    value === "INIT_READ_REPLICA" ||
    value === "RESIZING"
  )
    return "restarting";
  return "unknown";
}

export const STATUS_LABEL: Record<SimpleStatus, string> = {
  active: "Active",
  paused: "Paused",
  restarting: "Restarting",
  unknown: "Unknown",
};

export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "never";
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
