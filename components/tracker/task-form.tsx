"use client";

import { useActionState } from "react";
import { createTask } from "@/app/(tracker)/tasks/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage, fieldClass } from "@/components/tracker/form-message";
import type { Application } from "@/lib/types";

// New-task form. Pass `applicationId` to attach tasks to a fixed application
// (detail page), or `applications` to let the user pick one (tasks page).
export function TaskForm({
  applicationId,
  applications,
}: {
  applicationId?: string;
  applications?: Pick<Application, "id" | "company" | "position">[];
}) {
  const [state, formAction, pending] = useActionState(createTask, null);
  const value = (name: string) => state?.fields?.[name] ?? "";

  if (!applicationId && !applications?.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Add an application first, then you can add tasks to it.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      {applicationId ? (
        <input type="hidden" name="application_id" value={applicationId} />
      ) : (
        <div className="grid gap-2">
          <Label htmlFor="task-application">Application</Label>
          <select
            id="task-application"
            name="application_id"
            required
            className={`${fieldClass} h-9`}
            defaultValue={value("application_id")}
            key={value("application_id")}
          >
            <option value="" disabled>
              Choose...
            </option>
            {applications!.map((a) => (
              <option key={a.id} value={a.id}>
                {a.company} — {a.position}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="grid gap-2 grow">
        <Label htmlFor="task-title">Task</Label>
        <Input
          id="task-title"
          name="title"
          required
          defaultValue={value("title")}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="task-due">Due date</Label>
        <Input
          id="task-due"
          name="due_date"
          type="date"
          defaultValue={value("due_date")}
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Adding..." : "Add task"}
      </Button>
      <div className="basis-full">
        <FormMessage state={state} />
      </div>
    </form>
  );
}
