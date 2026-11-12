import { motion } from "motion/react";
import { PlugZap } from "lucide-react";

export function EmptyState({ onCheck, checking }: { onCheck: () => void; checking: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 24 }}
      className="glass-panel flex flex-col items-center rounded-3xl px-6 py-16 text-center"
    >
      <motion.span
        animate={{ y: [0, -6, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/12 text-primary glow-accent"
      >
        <PlugZap className="h-7 w-7" />
      </motion.span>
      <h2 className="mt-6 text-lg font-semibold">No projects monitored yet</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Add a Supabase access token for each account you want to watch, then run a check to discover every
        project automatically.
      </p>
      <button
        onClick={onCheck}
        disabled={checking}
        className="mt-6 inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {checking ? "Connecting…" : "Connect your first Supabase account"}
      </button>
    </motion.div>
  );
}
