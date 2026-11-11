// Small, dependency-free charts for the dashboard (server components).
// Marks follow one spec: bars <= 24px thick with 4px rounded data-ends,
// hairline baselines, values in text colors (never the bar color), and a
// hover tooltip on every mark. Colors are the status hues one step darker
// than the status pills, validated for both themes.

import Link from "next/link";
import type { Stats, TaskBuckets } from "@/lib/stats";
import { STATUSES, type Status } from "@/lib/types";
import { cn } from "@/lib/utils";

export const STATUS_BAR: Record<Status, string> = {
  applied: "bg-sky-600",
  interviewing: "bg-amber-600",
  offer: "bg-emerald-600",
  rejected: "bg-red-600",
};

const pct = (n: number, max: number) => (max ? (n / max) * 100 : 0);

export function StatTile({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  detail?: React.ReactNode;
  tone?: "danger";
}) {
  return (
    <div className="rounded-md border bg-card p-4 shadow-sm">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      {detail && (
        <p
          className={cn(
            "mt-1 text-xs text-muted-foreground",
            tone === "danger" && "text-red-600 dark:text-red-400",
          )}
        >
          {detail}
        </p>
      )}
    </div>
  );
}

// Tooltip that appears on hover/focus of the parent `group`.
function Tip({ children }: { children: React.ReactNode }) {
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md border bg-popover px-2 py-1 text-xs text-popover-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
    >
      {children}
    </span>
  );
}

export function StatusBars({ byStatus }: { byStatus: Stats["byStatus"] }) {
  const max = Math.max(...STATUSES.map((s) => byStatus[s]));
  return (
    <ul className="flex flex-col gap-3">
      {STATUSES.map((s) => (
        <li key={s} className="grid grid-cols-[6.5rem_1fr] items-center gap-3">
          <span className="text-sm capitalize text-muted-foreground">{s}</span>
          <div className="flex items-center gap-2">
            <div
              tabIndex={0}
              className="group relative flex h-6 items-center outline-none"
              style={{ width: `max(${pct(byStatus[s], max)}%, 4px)` }}
              aria-label={`${s}: ${byStatus[s]}`}
            >
              <span
                className={cn(
                  "h-5 w-full rounded-r",
                  byStatus[s] ? STATUS_BAR[s] : "bg-border",
                )}
              />
              <Tip>
                <span className="capitalize">{s}</span>: {byStatus[s]}
              </Tip>
            </div>
            <span className="text-sm tabular-nums">{byStatus[s]}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

const weekLabel = (iso: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));

export function WeeklyColumns({ weeks }: { weeks: Stats["weeks"] }) {
  const max = Math.max(1, ...weeks.map((w) => w.count));
  const current = weeks[weeks.length - 1];

  return (
    <figure className="flex flex-col gap-2">
      <div className="flex gap-2">
        {/* y-axis: 0 and the max, the only ticks needed at this scale */}
        <div className="flex h-40 w-6 shrink-0 flex-col justify-between text-right text-xs tabular-nums text-muted-foreground">
          <span>{max}</span>
          <span>0</span>
        </div>
        <div className="relative flex h-40 flex-1 items-end border-b border-border">
          <div className="absolute inset-x-0 top-0 border-t border-border/60" aria-hidden />
          {weeks.map((w, i) => {
            const isCurrent = i === weeks.length - 1;
            return (
              <div
                key={w.start}
                tabIndex={0}
                aria-label={`Week of ${weekLabel(w.start)}: ${w.count}`}
                className="group relative flex h-full flex-1 items-end justify-center outline-none"
              >
                <span
                  className={cn(
                    "w-full max-w-6 rounded-t transition-opacity group-hover:opacity-80",
                    w.count ? "bg-emerald-600" : "",
                  )}
                  style={{ height: `${pct(w.count, max)}%` }}
                />
                {isCurrent && w.count > 0 && (
                  <span className="absolute text-xs tabular-nums" style={{ bottom: `calc(${pct(w.count, max)}% + 2px)` }}>
                    {w.count}
                  </span>
                )}
                <Tip>
                  Week of {weekLabel(w.start)}: {w.count} application
                  {w.count === 1 ? "" : "s"}
                </Tip>
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex pl-8 text-xs text-muted-foreground">
        {weeks.map((w, i) => (
          <span key={w.start} className="flex-1 text-center">
            {i % 3 === 0 || i === weeks.length - 1 ? weekLabel(w.start) : ""}
          </span>
        ))}
      </div>
      <figcaption className="sr-only">
        Applications per week; this week: {current.count}.
      </figcaption>
      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer hover:text-foreground">
          View as table
        </summary>
        <table className="mt-2 w-full max-w-xs">
          <thead>
            <tr className="text-left">
              <th className="py-1 font-normal">Week of</th>
              <th className="py-1 text-right font-normal">Applications</th>
            </tr>
          </thead>
          <tbody className="text-foreground">
            {weeks.map((w) => (
              <tr key={w.start} className="border-t">
                <td className="py-1">{weekLabel(w.start)}</td>
                <td className="py-1 text-right tabular-nums">{w.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

const TASK_SEGMENTS: { key: keyof Omit<TaskBuckets, "done">; label: string; color: string }[] = [
  { key: "overdue", label: "Overdue", color: "bg-red-600" },
  { key: "thisWeek", label: "Due this week", color: "bg-amber-600" },
  { key: "later", label: "Later", color: "bg-emerald-600" },
  { key: "noDate", label: "No due date", color: "bg-zinc-500" },
];

export function TaskStack({ tasks }: { tasks: Stats["tasks"] }) {
  const segments = TASK_SEGMENTS.filter((s) => tasks[s.key] > 0);

  return (
    <div className="flex flex-col gap-3">
      {tasks.open ? (
        // gap-[2px] shows the card surface between segments
        <div className="flex h-5 gap-[2px]">
          {segments.map((s, i) => (
            <div
              key={s.key}
              tabIndex={0}
              aria-label={`${s.label}: ${tasks[s.key]}`}
              className="group relative outline-none"
              style={{ flexGrow: tasks[s.key], flexBasis: 0 }}
            >
              <span
                className={cn(
                  "block h-full transition-opacity group-hover:opacity-80",
                  s.color,
                  i === 0 && "rounded-l",
                  i === segments.length - 1 && "rounded-r",
                )}
              />
              <Tip>
                {s.label}: {tasks[s.key]}
              </Tip>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No open tasks.</p>
      )}
      <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-4">
        {TASK_SEGMENTS.map((s) => (
          <li key={s.key} className="flex items-center gap-1.5">
            <span className={cn("h-2.5 w-2.5 rounded-sm", s.color)} aria-hidden />
            <span className="text-muted-foreground">{s.label}</span>
            <span className="ml-auto tabular-nums sm:ml-0">{tasks[s.key]}</span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">
        {tasks.done} task{tasks.done === 1 ? "" : "s"} done.
      </p>
    </div>
  );
}

export function UpcomingTasks({
  tasks,
  today,
}: {
  tasks: {
    id: string;
    title: string;
    due_date: string | null;
    application_id: string;
    applications: { company: string } | null;
  }[];
  today: string;
}) {
  if (!tasks.length) {
    return <p className="text-sm text-muted-foreground">Nothing to do. 🎉</p>;
  }
  return (
    <ul className="divide-y">
      {tasks.map((t) => {
        const overdue = !!t.due_date && t.due_date < today;
        return (
          <li key={t.id} className="flex items-center justify-between gap-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-sm">{t.title}</p>
              <Link
                href={`/applications/${t.application_id}`}
                className="text-xs text-muted-foreground hover:text-brand"
              >
                {t.applications?.company}
              </Link>
            </div>
            <span
              className={cn(
                "shrink-0 font-mono text-xs text-muted-foreground",
                overdue && "text-red-600 dark:text-red-400",
              )}
            >
              {t.due_date
                ? `${overdue ? "Overdue " : ""}${t.due_date}`
                : "No date"}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
