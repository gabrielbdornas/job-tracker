"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  deleteTask,
  setTaskDone,
  updateTask,
} from "@/app/(tracker)/tasks/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeleteButton } from "@/components/tracker/delete-button";
import { FormMessage } from "@/components/tracker/form-message";
import type { ActionState, Task, TaskWithApplication } from "@/lib/types";
import { cn } from "@/lib/utils";

// Lists tasks. Set `showApplication` on the tasks page to link each task to
// the application it belongs to.
export function TaskList({
  tasks,
  showApplication = false,
}: {
  tasks: (Task | TaskWithApplication)[];
  showApplication?: boolean;
}) {
  if (!tasks.length) {
    return <p className="text-sm text-muted-foreground">No tasks yet.</p>;
  }

  return (
    <ul className="divide-y rounded-md border bg-card shadow-sm">
      {tasks.map((task) => (
        <TaskRow key={task.id} task={task} showApplication={showApplication} />
      ))}
    </ul>
  );
}

function TaskRow({
  task,
  showApplication,
}: {
  task: Task | TaskWithApplication;
  showApplication: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState<ActionState>(null);
  const [toggleState, toggleAction, toggling] = useActionState(
    setTaskDone.bind(null, task.id, !task.done),
    null,
  );
  const application = "applications" in task ? task.applications : null;
  const overdue =
    !task.done && !!task.due_date && task.due_date < localToday();

  if (editing) {
    return (
      <li className="px-4 py-2.5">
        <EditTaskForm
          task={task}
          onDone={(result) => {
            setSaved(result);
            setEditing(false);
          }}
        />
      </li>
    );
  }

  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-2.5 transition-colors hover:bg-accent/50">
      <form action={toggleAction}>
        <button
          type="submit"
          disabled={toggling}
          aria-label={task.done ? "Mark as not done" : "Mark as done"}
          className={cn(
            "flex h-4 w-4 items-center justify-center rounded-sm border border-muted-foreground/60 text-[10px] leading-none hover:border-brand disabled:opacity-50",
            task.done && "border-brand bg-brand text-black",
          )}
        >
          {task.done ? "✓" : ""}
        </button>
      </form>
      <div className="flex-1 min-w-40">
        <p
          className={cn(
            "text-sm",
            task.done && "line-through text-muted-foreground",
          )}
        >
          {task.title}
        </p>
        <p className="text-xs text-muted-foreground">
          <span
            suppressHydrationWarning
            className={cn(
              "font-mono",
              overdue && "text-red-600 dark:text-red-400",
            )}
          >
            {task.due_date
              ? `${overdue ? "Overdue" : "Due"} ${task.due_date}`
              : "No due date"}
          </span>
          {showApplication && application && (
            <>
              {" · "}
              <Link
                href={`/applications/${task.application_id}`}
                className="hover:text-brand"
              >
                {application.company} — {application.position}
              </Link>
            </>
          )}
        </p>
        {toggleState && !toggleState.ok && <FormMessage state={toggleState} />}
        {saved && <FormMessage state={saved} />}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setSaved(null);
          setEditing(true);
        }}
      >
        Edit
      </Button>
      <DeleteButton
        action={deleteTask.bind(null, task.id)}
        confirmText={`Delete task "${task.title}"?`}
      />
    </li>
  );
}

function EditTaskForm({
  task,
  onDone,
}: {
  task: Task;
  onDone: (result: ActionState) => void;
}) {
  const [state, formAction, pending] = useActionState(
    async (prev: Parameters<typeof updateTask>[1], formData: FormData) => {
      const result = await updateTask(task.id, prev, formData);
      if (result?.ok) onDone(result);
      return result;
    },
    null,
  );
  const value = (name: "title" | "due_date") =>
    state?.fields?.[name] ?? task[name] ?? "";

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-3">
      <Input
        name="title"
        aria-label="Task title"
        required
        defaultValue={value("title")}
        className="flex-1 min-w-40"
      />
      <Input
        name="due_date"
        type="date"
        aria-label="Due date"
        defaultValue={value("due_date")}
        className="w-auto"
      />
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving..." : "Save"}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onDone(null)}
      >
        Cancel
      </Button>
      <div className="basis-full">
        <FormMessage state={state} />
      </div>
    </form>
  );
}

// Today's date as YYYY-MM-DD in the viewer's time zone, to compare with due dates.
function localToday() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
