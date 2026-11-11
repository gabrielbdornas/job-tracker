// Dashboard numbers, computed from the user's applications and tasks.
// Pure functions: dates are "YYYY-MM-DD" strings and `today` is passed in.

import { STATUSES, type Status } from "@/lib/types";

type AppRow = { status: Status; applied_on: string | null };
type TaskRow = {
  id: string;
  title: string;
  due_date: string | null;
  done: boolean;
  application_id: string;
};

export const WEEKS = 12;
export const UPCOMING_LIMIT = 5;

export type WeekBucket = { start: string; count: number };

export type TaskBuckets = {
  overdue: number;
  thisWeek: number;
  later: number;
  noDate: number;
  done: number;
};

export type Stats = {
  total: number;
  last30Days: number;
  active: number;
  interviewing: number;
  offers: number;
  offerRate: number; // 0..1
  byStatus: Record<Status, number>;
  weeks: WeekBucket[];
  undated: number;
  tasks: TaskBuckets & { open: number };
};

export function computeStats(
  apps: AppRow[],
  tasks: TaskRow[],
  today: string,
): Stats {
  const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<
    Status,
    number
  >;
  for (const a of apps) byStatus[a.status]++;

  // Weeks start on Monday; the last bucket is the current week.
  const currentWeek = startOfWeek(today);
  const firstWeek = addDays(currentWeek, -7 * (WEEKS - 1));
  const weeks: WeekBucket[] = Array.from({ length: WEEKS }, (_, i) => ({
    start: addDays(firstWeek, 7 * i),
    count: 0,
  }));
  const thirtyDaysAgo = addDays(today, -29);
  let undated = 0;
  let last30Days = 0;
  for (const a of apps) {
    if (!a.applied_on) {
      undated++;
      continue;
    }
    if (a.applied_on >= thirtyDaysAgo && a.applied_on <= today) last30Days++;
    const week = startOfWeek(a.applied_on);
    const i = daysBetween(firstWeek, week) / 7;
    if (i >= 0 && i < WEEKS) weeks[i].count++;
  }

  const endOfThisWeek = addDays(currentWeek, 6);
  const buckets: TaskBuckets = { overdue: 0, thisWeek: 0, later: 0, noDate: 0, done: 0 };
  for (const t of tasks) {
    if (t.done) buckets.done++;
    else if (!t.due_date) buckets.noDate++;
    else if (t.due_date < today) buckets.overdue++;
    else if (t.due_date <= endOfThisWeek) buckets.thisWeek++;
    else buckets.later++;
  }

  const total = apps.length;
  return {
    total,
    last30Days,
    active: byStatus.applied + byStatus.interviewing,
    interviewing: byStatus.interviewing,
    offers: byStatus.offer,
    offerRate: total ? byStatus.offer / total : 0,
    byStatus,
    weeks,
    undated,
    tasks: { ...buckets, open: tasks.length - buckets.done },
  };
}

// Open tasks ordered by due date (overdue first, undated last).
export function upcomingTasks<T extends TaskRow>(tasks: T[], limit = UPCOMING_LIMIT) {
  return tasks
    .filter((t) => !t.done)
    .sort((a, b) =>
      (a.due_date ?? "9999-12-31").localeCompare(b.due_date ?? "9999-12-31"),
    )
    .slice(0, limit);
}

// Today's date as YYYY-MM-DD in the given IANA time zone.
export function todayIn(timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date());
}

function toDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`);
}

function addDays(iso: string, days: number) {
  const d = toDate(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function daysBetween(from: string, to: string) {
  return Math.round((toDate(to).getTime() - toDate(from).getTime()) / 86_400_000);
}

function startOfWeek(iso: string) {
  const day = toDate(iso).getUTCDay(); // 0 = Sunday
  return addDays(iso, -((day + 6) % 7));
}
