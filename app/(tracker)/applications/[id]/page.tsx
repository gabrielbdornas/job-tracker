import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { deleteApplication } from "@/app/(tracker)/applications/actions";
import { ApplicationForm } from "@/components/tracker/application-form";
import { DeleteButton } from "@/components/tracker/delete-button";
import { PageHeader, Panel } from "@/components/tracker/panel";
import { StatusBadge } from "@/components/tracker/status-badge";
import { TaskForm } from "@/components/tracker/task-form";
import { TaskList } from "@/components/tracker/task-list";
import { createClient } from "@/lib/supabase/server";
import type { Application, Task } from "@/lib/types";

export default function ApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <>
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <Link href="/applications" className="hover:text-foreground">
          Applications
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">Details</span>
      </nav>
      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground">Loading application...</p>
        }
      >
        <ApplicationDetail params={params} />
      </Suspense>
    </>
  );
}

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function ApplicationDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const supabase = await createClient();
  const [applicationResult, tasksResult] = await Promise.all([
    supabase
      .from("applications")
      .select("*")
      .eq("id", id)
      .maybeSingle<Application>(),
    supabase
      .from("tasks")
      .select("*")
      .eq("application_id", id)
      .order("done")
      .order("due_date", { nullsFirst: false })
      .returns<Task[]>(),
  ]);

  if (applicationResult.error) {
    return (
      <p role="alert" className="text-sm text-red-500">
        Could not load application: {applicationResult.error.message}
      </p>
    );
  }
  // Also covers applications owned by someone else: RLS hides them.
  const application = applicationResult.data;
  if (!application) notFound();

  return (
    <>
      <PageHeader
        title={application.company}
        description={application.position}
      >
        <StatusBadge status={application.status} />
      </PageHeader>
      <Panel title="Details" description="Edit and save this application.">
        <ApplicationForm application={application} />
      </Panel>
      <Panel title="Tasks" description="Follow-ups for this application.">
        <div className="flex flex-col gap-4">
          {tasksResult.error ? (
            <p role="alert" className="text-sm text-red-500">
              Could not load tasks: {tasksResult.error.message}
            </p>
          ) : (
            <TaskList tasks={tasksResult.data} />
          )}
          <TaskForm applicationId={application.id} />
        </div>
      </Panel>
      <Panel
        danger
        title="Danger zone"
        description="Deleting an application also deletes all of its tasks."
      >
        <DeleteButton
          action={deleteApplication.bind(null, application.id)}
          confirmText={`Delete the application to ${application.company} and all its tasks?`}
          label="Delete application"
        />
      </Panel>
    </>
  );
}
