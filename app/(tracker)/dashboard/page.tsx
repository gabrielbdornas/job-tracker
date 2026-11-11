import Link from "next/link";
import { Suspense } from "react";
import {
  StatTile,
  StatusBars,
  TaskStack,
  UpcomingTasks,
  WeeklyColumns,
} from "@/components/tracker/dashboard-charts";
import { PageHeader, Panel } from "@/components/tracker/panel";
import { Button } from "@/components/ui/button";
import { computeStats, todayIn, upcomingTasks, WEEKS } from "@/lib/stats";
import { createClient } from "@/lib/supabase/server";
import type { Application, Task } from "@/lib/types";

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="How your job search is going."
      />
      <Suspense
        fallback={<p className="text-sm text-muted-foreground">Loading stats...</p>}
      >
        <DashboardContent />
      </Suspense>
    </>
  );
}

type TaskWithCompany = Task & { applications: { company: string } | null };

async function DashboardContent() {
  const supabase = await createClient();
  // Row Level Security makes both queries return only the user's own rows.
  const [appsResult, tasksResult] = await Promise.all([
    supabase
      .from("applications")
      .select("status, applied_on")
      .returns<Pick<Application, "status" | "applied_on">[]>(),
    supabase
      .from("tasks")
      .select("*, applications(company)")
      .returns<TaskWithCompany[]>(),
  ]);

  const error = appsResult.error ?? tasksResult.error;
  if (error) {
    return (
      <p role="alert" className="text-sm text-red-500">
        Could not load stats: {error.message}
      </p>
    );
  }

  const apps = appsResult.data ?? [];
  const tasks = tasksResult.data ?? [];

  if (!apps.length) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-md border border-dashed p-10 text-center">
        <p className="text-sm text-muted-foreground">
          Add or import applications to see your stats.
        </p>
        <Button asChild size="sm">
          <Link href="/applications">Go to applications</Link>
        </Button>
      </div>
    );
  }

  // The server's local date; for a local dev server that is the user's date.
  const today = todayIn(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const stats = computeStats(apps, tasks, today);
  const offerPct = Math.round(stats.offerRate * 100);

  return (
    <>
      <section
        aria-label="Key numbers"
        className="grid grid-cols-2 gap-4 lg:grid-cols-5"
      >
        <StatTile
          label="Total applications"
          value={stats.total}
          detail={`${stats.last30Days} in the last 30 days`}
        />
        <StatTile
          label="Active"
          value={stats.active}
          detail="Applied or interviewing"
        />
        <StatTile label="Interviewing" value={stats.interviewing} />
        <StatTile
          label="Offers"
          value={stats.offers}
          detail={`${offerPct}% of applications`}
        />
        <StatTile
          label="Open tasks"
          value={stats.tasks.open}
          detail={
            stats.tasks.overdue ? `${stats.tasks.overdue} overdue` : "None overdue"
          }
          tone={stats.tasks.overdue ? "danger" : undefined}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Applications by status" description="Current status of every application.">
          <StatusBars byStatus={stats.byStatus} />
        </Panel>
        <Panel
          title="Applications per week"
          description={`Last ${WEEKS} weeks, by application date.${
            stats.undated
              ? ` ${stats.undated} without a date ${stats.undated === 1 ? "is" : "are"} not shown.`
              : ""
          }`}
        >
          <WeeklyColumns weeks={stats.weeks} />
        </Panel>
        <Panel title="Tasks by due date" description="Open tasks, by when they are due.">
          <TaskStack tasks={stats.tasks} />
        </Panel>
        <Panel
          title="Upcoming tasks"
          description="Your next open tasks, overdue first."
          actions={
            <Link href="/tasks" className="text-xs text-muted-foreground hover:text-brand">
              All tasks
            </Link>
          }
        >
          <UpcomingTasks tasks={upcomingTasks(tasks)} today={today} />
        </Panel>
      </div>
    </>
  );
}
