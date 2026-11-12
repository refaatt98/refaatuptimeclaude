import { AnimatePresence, motion } from "motion/react";
import { Check, Pencil } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

export function EditableHeading({
  value,
  kind,
  saving,
  onSave,
}: {
  value: string;
  kind: "title" | "subtitle";
  saving: boolean;
  onSave: (value: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setDraft(value), [value]);
  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = () => {
    const next = draft.trim();
    setEditing(false);
    if (next && next !== value) onSave(next);
    else setDraft(value);
  };

  const title = kind === "title";

  return (
    <div className="group/edit relative max-w-5xl">
      <AnimatePresence mode="wait" initial={false}>
        {editing ? (
          <motion.div
            key="edit"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              value={draft}
              maxLength={140}
              aria-label={`Edit dashboard ${kind}`}
              onChange={(event) => setDraft(event.target.value)}
              onBlur={commit}
              onKeyDown={(event) => {
                if (event.key === "Enter") commit();
                if (event.key === "Escape") {
                  setDraft(value);
                  setEditing(false);
                }
              }}
              className={title
                ? "w-full border-0 border-b border-primary bg-transparent pb-1 text-4xl font-extrabold leading-tight outline-none sm:text-5xl lg:text-6xl"
                : "w-full border-0 border-b border-primary/60 bg-transparent pb-1 text-base font-medium text-muted-foreground outline-none sm:text-lg"}
            />
            <Check className="h-5 w-5 shrink-0 text-success" />
          </motion.div>
        ) : (
          <motion.div key="display" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setEditing(true)}
              className="h-auto max-w-full justify-start whitespace-normal p-0 text-left hover:bg-transparent"
            >
              {title ? (
                <h1 className="break-words text-4xl font-extrabold leading-tight text-foreground sm:text-5xl lg:text-6xl">
                  {value}
                </h1>
              ) : (
                <p className="text-base font-medium leading-relaxed text-muted-foreground sm:text-lg">{value}</p>
              )}
              <Pencil className="ml-2 h-4 w-4 shrink-0 text-primary opacity-0 transition-opacity group-hover/edit:opacity-100" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
      {saving && <span className="absolute -bottom-5 left-0 text-xs font-medium text-primary">Saving…</span>}
    </div>
  );
}