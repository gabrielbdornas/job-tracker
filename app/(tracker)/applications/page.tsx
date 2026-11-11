import Link from "next/link";
import { Suspense } from "react";
import { ApplicationForm } from "@/components/tracker/application-form";
import { KanbanBoard } from "@/components/tracker/kanban-board";
import { PageHeader, Panel } from "@/components/tracker/panel";
import { StatusBadge } from "@/components/tracker/status-badge";
import { ViewToggle } from "@/components/tracker/view-toggle";
import { Button } from "@/components/ui/button";
import { getApplicationsView } from "@/lib/applications-view";
import { createClient } from "@/lib/supabase/server";
import type { Application } from "@/lib/types";

export default function ApplicationsPage() {
  return (
    <>
      <PageHeader
        title="Applications"
        description="Every job you have applied to, newest first."
      >
        <div className="flex items-center gap-2">
          <Suspense>
            <CurrentViewToggle />
          </Suspense>
          <Button asChild size="sm">
            <a href="#new-application">New application</a>
          </Button>
        </div>
      </PageHeader>
      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground">Loading applications...</p>
        }
      >
        <Applications />
      </Suspense>
      <Panel
        title={<span id="new-application">Add application</span>}
        description="It is saved to your account only."
      >
        <ApplicationForm />
      </Panel>
    </>
  );
}

async function CurrentViewToggle() {
  return <ViewToggle current={await getApplicationsView()} />;
}

async function Applications() {
  const view = await getApplicationsView();
  const supabase = await createClient();
  // Row Level Security makes this return only the signed-in user's rows.
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<Application[]>();

  if (error) {
    return (
      <p role="alert" className="text-sm text-red-500">
        Could not load applications: {error.message}
      </p>
    );
  }
  if (!data.length) {
    return (
      <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
        No applications yet. Add your first one below.
      </div>
    );
  }

  if (view === "kanban") return <KanbanBoard applications={data} />;

  return (
    <div className="overflow-x-auto rounded-md border bg-card shadow-sm">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-2 font-normal">Company</th>
            <th className="px-4 py-2 font-normal">Position</th>
            <th className="px-4 py-2 font-normal">Status</th>
            <th className="px-4 py-2 font-normal">Applied on</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {data.map((a) => (
            <tr key={a.id} className="transition-colors hover:bg-accent/50">
              <td className="px-4 py-2.5">
                <Link
                  href={`/applications/${a.id}`}
                  className="font-medium hover:text-brand"
                >
                  {a.company}
                </Link>
              </td>
              <td className="px-4 py-2.5 text-muted-foreground">{a.position}</td>
              <td className="px-4 py-2.5">
                <StatusBadge status={a.status} />
              </td>
              <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                {a.applied_on ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
