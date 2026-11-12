import { motion } from "motion/react";
import { Moon, Plug, RefreshCw, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { useTheme } from "@/hooks/useTheme";
import { relativeTime } from "@/lib/status";
import { Button } from "@/components/ui/button";
import logoAsset from "@/assets/refaat-uptime-logo.json";

export function Header({
  lastCheckedAt,
  refreshing,
  onRefresh,
  onConnect,
}: {
  lastCheckedAt: string | null;
  refreshing: boolean;
  onRefresh: () => void;
  onConnect: () => void;
}) {
  const { theme, toggle } = useTheme();
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <header className="glass-panel sticky top-0 z-30 rounded-none border-x-0 border-t-0">
      <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center justify-between px-4 sm:h-20 sm:px-6">
        <div className="flex items-center gap-3">
          <img src={logoAsset.url} alt="Refaat Uptime" className="h-10 w-auto object-contain sm:h-14" />
          <div className="hidden items-end gap-1 sm:flex" aria-label="Live monitoring active">
            {[7, 11, 15, 19].map((height, index) => (
              <motion.span
                key={height}
                className="w-1 rounded-sm brand-gradient"
                animate={refreshing ? { height: [height, height + 5, height] } : { height }}
                transition={{ duration: 0.65, delay: index * 0.08, repeat: refreshing ? Infinity : 0 }}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden text-xs text-muted-foreground sm:inline">
            Last checked: {relativeTime(lastCheckedAt)}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={toggle}
            aria-label="Toggle theme"
            className="rounded-full text-muted-foreground hover:text-foreground"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            onClick={onConnect}
            className="rounded-full text-muted-foreground hover:text-foreground"
          >
            <Plug className="h-4 w-4" />
            <span className="hidden sm:inline">Connect</span>
          </Button>
          <Button
            onClick={onRefresh}
            disabled={refreshing}
            className="brand-gradient rounded-full px-4 shadow-md shadow-primary/20 hover:opacity-90"
          >
            <motion.span
              animate={refreshing ? { rotate: 360 } : { rotate: 0 }}
              transition={refreshing ? { repeat: Infinity, duration: 0.9, ease: "linear" } : { duration: 0.2 }}
              className="flex"
            >
              <RefreshCw className="h-4 w-4" />
            </motion.span>
            <span className="hidden sm:inline">{refreshing ? "Checking…" : "Check now"}</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
