import { motion } from "motion/react";
import { Search } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export type StatusFilter = "all" | "active" | "paused";

const OPTIONS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "paused", label: "Paused" },
];

export function FilterBar({
  filter,
  onFilter,
  organizations,
  organization,
  onOrganization,
  search,
  onSearch,
}: {
  filter: StatusFilter;
  onFilter: (value: StatusFilter) => void;
  organizations: string[];
  organization: string;
  onOrganization: (value: string) => void;
  search: string;
  onSearch: (value: string) => void;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-[auto_minmax(0,1fr)] sm:flex sm:items-center">
        <div className="glass-panel relative grid grid-cols-3 rounded-md p-1">
          {OPTIONS.map((option) => (
            <Button
              key={option.key}
              variant="ghost"
              size="sm"
              onClick={() => onFilter(option.key)}
              className={cn(
                 "relative z-10 rounded-sm px-3 text-sm font-bold sm:px-4",
                filter === option.key ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {filter === option.key && (
                <motion.span
                  layoutId="filter-pill"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  className="absolute inset-0 -z-10 rounded-sm brand-gradient"
                />
              )}
              {option.label}
            </Button>
          ))}
        </div>

        <Select value={organization} onValueChange={onOrganization}>
          <SelectTrigger className="glass-panel h-10 w-full rounded-md border-border text-sm font-semibold sm:w-[190px]">
            <SelectValue placeholder="By organization" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All organizations</SelectItem>
            {organizations.map((org) => (
              <SelectItem key={org} value={org}>
                {org}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <motion.div
        layout
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className={cn(
          "glass-panel flex h-10 w-full items-center gap-2 rounded-md px-4 transition-[width] sm:w-[220px]",
          focused && "sm:w-[300px]",
        )}
      >
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Search projects…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </motion.div>
    </div>
  );
}
