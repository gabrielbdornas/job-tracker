"use client";

import { Columns3, Table2 } from "lucide-react";
import { useOptimistic, useTransition } from "react";
import { setApplicationsView } from "@/app/(tracker)/applications/actions";
import type { ApplicationsView } from "@/lib/types";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "table", label: "Table", icon: Table2 },
  { value: "kanban", label: "Kanban", icon: Columns3 },
] as const;

// Saves the choice in a cookie, so the Applications page keeps it when you
// navigate away and come back.
export function ViewToggle({ current }: { current: ApplicationsView }) {
  const [view, setOptimisticView] = useOptimistic(current);
  const [pending, startTransition] = useTransition();

  return (
    <div
      role="group"
      aria-label="View"
      aria-busy={pending}
      className="inline-flex rounded-md border bg-card p-0.5 shadow-sm"
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          aria-pressed={view === value}
          onClick={() =>
            startTransition(async () => {
              setOptimisticView(value);
              await setApplicationsView(value);
            })
          }
          className={cn(
            "inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs transition-colors",
            view === value
              ? "bg-accent text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden />
          {label}
        </button>
      ))}
    </div>
  );
}
