import { Suspense } from "react";
import { TaskForm } from "@/components/tracker/task-form";
import { TaskList } from "@/components/tracker/task-list";
import { createClient } from "@/lib/supabase/server";
import type { Application, TaskWithApplication } from "@/lib/types";

export default function TasksPage() {
  return (
    <section className="flex flex-col gap-4">
      <h1 className="font-bold text-2xl">Tasks</h1>
      <Suspense fallback={<p className="text-sm">Loading tasks...</p>}>
        <TasksContent />
      </Suspense>
    </section>
  );
}

async function TasksContent() {
  const supabase = await createClient();
  // Row Level Security makes both queries return only the user's own rows.
  const [tasksResult, applicationsResult] = await Promise.all([
    supabase
      .from("tasks")
      .select("*, applications(company, position)")
      .order("done")
      .order("due_date", { nullsFirst: false })
      .returns<TaskWithApplication[]>(),
    supabase
      .from("applications")
      .select("id, company, position")
      .order("company")
      .returns<Pick<Application, "id" | "company" | "position">[]>(),
  ]);

  const error = tasksResult.error ?? applicationsResult.error;
  if (error) {
    return (
      <p role="alert" className="text-sm text-red-500">
        Could not load tasks: {error.message}
      </p>
    );
  }

  return (
    <>
      <TaskList tasks={tasksResult.data ?? []} showApplication />
      <h2 className="font-semibold text-xl mt-6">Add task</h2>
      <TaskForm applications={applicationsResult.data ?? []} />
    </>
  );
}
