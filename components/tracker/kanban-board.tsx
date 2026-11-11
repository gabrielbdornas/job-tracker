"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { setApplicationStatus } from "@/app/(tracker)/applications/actions";
import { FormMessage } from "@/components/tracker/form-message";
import { StatusBadge } from "@/components/tracker/status-badge";
import { STATUSES, type ActionState, type Application, type Status } from "@/lib/types";
import { cn } from "@/lib/utils";

// One column per status. Dragging a card to another column saves the new
// status; the card moves immediately and snaps back if saving fails.
export function KanbanBoard({ applications }: { applications: Application[] }) {
  const [optimistic, moveOptimistic] = useOptimistic(
    applications,
    (current, { id, status }: { id: string; status: Status }) =>
      current.map((a) => (a.id === id ? { ...a, status } : a)),
  );
  const [, startTransition] = useTransition();
  const [dragOver, setDragOver] = useState<Status | null>(null);
  const [message, setMessage] = useState<ActionState>(null);

  function move(id: string, status: Status) {
    const app = optimistic.find((a) => a.id === id);
    if (!app || app.status === status) return;
    setMessage(null);
    startTransition(async () => {
      moveOptimistic({ id, status });
      const result = await setApplicationStatus(id, status);
      setMessage(
        result?.ok
          ? { ok: true, message: `Moved ${app.company} to ${status}.` }
          : result,
      );
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATUSES.map((status) => {
          const cards = optimistic.filter((a) => a.status === status);
          return (
            <section
              key={status}
              aria-label={status}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                setDragOver(status);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setDragOver(null);
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(null);
                move(e.dataTransfer.getData("text/plain"), status);
              }}
              className={cn(
                "flex min-h-40 flex-col gap-2 rounded-md border bg-muted/40 p-2 transition-colors",
                dragOver === status && "border-brand/60 bg-brand/5",
              )}
            >
              <header className="flex items-center justify-between px-1 py-1">
                <StatusBadge status={status} />
                <span className="font-mono text-xs text-muted-foreground">
                  {cards.length}
                </span>
              </header>
              {cards.map((a) => (
                <article
                  key={a.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", a.id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  className="cursor-grab rounded-md border bg-card p-3 shadow-sm transition-colors hover:border-brand/40 active:cursor-grabbing"
                >
                  <Link
                    href={`/applications/${a.id}`}
                    draggable={false}
                    className="text-sm font-medium hover:text-brand"
                  >
                    {a.company}
                  </Link>
                  <p className="text-xs text-muted-foreground">{a.position}</p>
                  <p className="mt-2 font-mono text-xs text-muted-foreground">
                    {a.applied_on ?? "No date"}
                  </p>
                </article>
              ))}
              {!cards.length && (
                <p className="px-1 py-4 text-center text-xs text-muted-foreground">
                  Drop here
                </p>
              )}
            </section>
          );
        })}
      </div>
      <FormMessage state={message} />
    </div>
  );
}
