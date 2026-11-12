import { AnimatePresence, motion } from "motion/react";
import { Check, Copy, Eye, EyeOff, Loader2, Pencil, Play, ShieldAlert, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";

import { StatusBadge } from "./StatusBadge";
import { Sparkline } from "./Sparkline";
import { relativeTime, STATUS_LABEL } from "@/lib/status";
import type { ProjectView } from "@/hooks/useUptimeData";
import { Button } from "@/components/ui/button";

function CopyValue({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-4 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-muted-foreground">{label}</p>
        <p className={mono ? "mt-1 break-all font-mono text-base font-bold" : "mt-1 break-words text-lg font-bold"}>{value}</p>
      </div>
      <Button variant="ghost" size="icon" onClick={copy} aria-label={`Copy ${label}`} className="shrink-0">
        {copied ? <Check className="text-success" /> : <Copy />}
      </Button>
    </div>
  );
}

export function ProjectPanel({
  project,
  onClose,
  onSaveNotes,
  onSaveDisplayName,
  onDelete,
  onResume,
  savingNotes,
  savingName,
  resuming,
}: {
  project: ProjectView | null;
  onClose: () => void;
  onSaveNotes: (notes: string) => void;
  onSaveDisplayName: (displayName: string) => void;
  onDelete: () => void;
  onResume: () => void;
  savingNotes: boolean;
  savingName: boolean;
  resuming: boolean;
}) {
  const [notes, setNotes] = useState("");
  const [notesVisible, setNotesVisible] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [name, setName] = useState("");
  const [editingName, setEditingName] = useState(false);

  useEffect(() => {
    setNotes(project?.notes ?? "");
    setNotesVisible(false);
    setEditingNotes(false);
    setName(project?.display_name ?? "");
    setEditingName(false);
  }, [project?.id, project?.notes, project?.display_name]);

  const dirty = notes.trim() !== (project?.notes ?? "").trim();

  return (
    <AnimatePresence>
      {project && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 280, damping: 30 }}
            className="glass-panel fixed top-0 right-0 z-50 flex h-full w-full max-w-2xl flex-col overflow-y-auto rounded-none border-l border-primary/25 p-5 sm:p-8"
          >
            <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="border-b border-border pb-7">
            <div className="flex items-start justify-between gap-5">
              <div className="min-w-0">
                {editingName ? (
                  <div className="flex flex-col gap-3">
                    <input
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      maxLength={140}
                      autoFocus
                      placeholder={project.project_name}
                      aria-label="Custom display name"
                      className="w-full rounded-md border border-border bg-secondary/40 px-4 py-2 text-2xl font-extrabold outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={savingName}
                        onClick={() => {
                          onSaveDisplayName(name);
                          setEditingName(false);
                        }}
                      >
                        {savingName ? "Saving…" : "Save name"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setName(project.display_name ?? "");
                          setEditingName(false);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="break-words text-3xl font-extrabold leading-tight sm:text-4xl">
                      {project.display_name ?? project.project_name}
                    </h2>
                    <StatusBadge status={project.status} />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingName(true)}
                      aria-label="Edit display name"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                {project.display_name && (
                  <p className="mt-1 break-words text-sm font-normal text-muted-foreground/70">
                    {project.project_name}
                  </p>
                )}
                <p className="mt-3 text-sm font-medium text-muted-foreground">
                  Last checked {relativeTime(project.last_checked_at)}
                </p>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={onClose}
                aria-label="Close panel"
                className="shrink-0 rounded-full text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {project.status === "paused" && (
              <Button
                type="button"
                disabled={resuming}
                onClick={onResume}
                variant="outline"
                className="mt-5 w-full border-success/40 bg-success/10 text-success hover:bg-success/20 hover:text-success"
              >
                {resuming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                {resuming ? "Resuming…" : "Resume project"}
              </Button>
            )}
            </motion.section>

            <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="border-b border-border py-7">
              <h3 className="text-sm font-extrabold uppercase text-primary">Project information</h3>
              <div className="mt-3">
                <CopyValue label="Organization" value={project.organization_name ?? "Unknown organization"} />
                <CopyValue label="Account / email" value={project.organization_label ?? "Not available"} mono />
                <CopyValue label="Project reference" value={project.project_ref} mono />
              </div>
            </motion.section>

            <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }} className="border-b border-border py-7">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-warning" />
                  <h3 className="text-sm font-extrabold uppercase text-primary">Sensitive note</h3>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setEditingNotes((value) => !value)}>
                  <Pencil /> {editingNotes ? "Done" : "Edit"}
                </Button>
              </div>
              {editingNotes ? (
                <div className="mt-4">
                  <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} maxLength={2000} placeholder="Add a private note…" className="w-full resize-y rounded-md border border-border bg-secondary/40 px-4 py-3 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                  <div className="mt-3 flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => { setNotes(project.notes ?? ""); setEditingNotes(false); }}>Cancel</Button>
                    <Button size="sm" disabled={!dirty || savingNotes} onClick={() => { onSaveNotes(notes); setEditingNotes(false); }}>{savingNotes ? "Saving…" : "Save note"}</Button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 flex min-h-16 items-center justify-between gap-3 rounded-md border border-warning/25 bg-warning/5 px-4 py-3">
                  <p className="min-w-0 break-all font-mono text-base font-bold">{project.notes ? (notesVisible ? project.notes : "••••••••••••••••") : "No note saved"}</p>
                  {project.notes && <div className="flex shrink-0 gap-1"><Button variant="ghost" size="icon" onClick={() => setNotesVisible((value) => !value)} aria-label={notesVisible ? "Hide note" : "Reveal note"}>{notesVisible ? <EyeOff /> : <Eye />}</Button><Button variant="ghost" size="icon" onClick={() => navigator.clipboard.writeText(project.notes ?? "")} aria-label="Copy note"><Copy /></Button></div>}
                </div>
              )}
            </motion.section>

            <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.34 }} className="border-b border-border py-7">
              <div className="flex items-end justify-between gap-4">
                <div><p className="text-sm font-extrabold uppercase text-primary">7-day history</p><p className="mt-1 text-sm text-muted-foreground">Availability across recent checks</p></div>
                <p className="text-4xl font-extrabold">{project.uptime24h.toFixed(1)}%</p>
              </div>
              <div className="mt-5 rounded-md border border-border bg-secondary/20 p-3">
                <Sparkline
                  logs={project.logs}
                  height={180}
                  tone={
                    project.status === "active"
                      ? "success"
                      : project.status === "paused"
                        ? "destructive"
                        : project.status === "restarting"
                          ? "warning"
                          : "muted-foreground"
                  }
                />
              </div>
            </motion.section>

            <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }} className="py-7">
              <p className="text-sm font-extrabold uppercase text-primary">Check log</p>
              <div className="mt-4 overflow-x-auto rounded-md border border-border">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead className="bg-secondary/60 text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-bold">When</th>
                      <th className="px-4 py-3 font-bold">Status</th>
                      <th className="px-4 py-3 text-right font-bold">Response</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...project.logs]
                      .reverse()
                      .slice(0, 50)
                      .map((log, index) => (
                        <tr key={`${log.checked_at}-${index}`} className="border-t border-border even:bg-secondary/30">
                          <td className="px-4 py-3 font-semibold">
                            {new Date(log.checked_at).toLocaleString()}
                          </td>
                          <td className="px-4 py-3"><StatusBadge status={log.status} /></td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-muted-foreground">
                            {log.response_time_ms ? `${log.response_time_ms} ms` : "—"}
                          </td>
                        </tr>
                      ))}
                    {project.logs.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-3 py-4 text-center text-muted-foreground">
                          No checks logged yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.section>

            <Button
              type="button"
              variant="outline"
              onClick={onDelete}
              className="mb-4 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" /> Delete this project
            </Button>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
