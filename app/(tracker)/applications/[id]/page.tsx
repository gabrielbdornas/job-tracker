import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { deleteApplication } from "@/app/(tracker)/applications/actions";
import { ApplicationForm } from "@/components/tracker/application-form";
import { DeleteButton } from "@/components/tracker/delete-button";
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
      <Link href="/applications" className="text-sm hover:underline">
        ← All applications
      </Link>
      <Suspense fallback={<p className="text-sm">Loading application...</p>}>
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
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-bold text-2xl">
            {application.company} — {application.position}
          </h1>
          <StatusBadge status={application.status} />
        </div>
        <ApplicationForm application={application} />
        <DeleteButton
          action={deleteApplication.bind(null, application.id)}
          confirmText={`Delete the application to ${application.company} and all its tasks?`}
          label="Delete application"
        />
      </section>
      <section className="flex flex-col gap-4">
        <h2 className="font-semibold text-xl">Tasks</h2>
        {tasksResult.error ? (
          <p role="alert" className="text-sm text-red-500">
            Could not load tasks: {tasksResult.error.message}
          </p>
        ) : (
          <TaskList tasks={tasksResult.data} />
        )}
        <TaskForm applicationId={application.id} />
      </section>
    </>
  );
}
