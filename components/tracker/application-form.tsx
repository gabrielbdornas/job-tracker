"use client";

import { useActionState } from "react";
import {
  createApplication,
  updateApplication,
} from "@/app/(tracker)/applications/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage, fieldClass } from "@/components/tracker/form-message";
import { STATUSES, type Application } from "@/lib/types";

export function ApplicationForm({
  application,
}: {
  application?: Application;
}) {
  const action = application
    ? updateApplication.bind(null, application.id)
    : createApplication;
  const [state, formAction, pending] = useActionState(action, null);

  // After a submit React resets the form to its default values, so feed the
  // last submitted values back in; otherwise fall back to the saved record.
  const value = (name: keyof Application) =>
    state?.fields?.[name] ?? application?.[name] ?? "";

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      <div className="grid gap-2">
        <Label htmlFor="company">Company</Label>
        <Input
          id="company"
          name="company"
          required
          defaultValue={value("company")}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="position">Position</Label>
        <Input
          id="position"
          name="position"
          required
          defaultValue={value("position")}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          name="status"
          className={`${fieldClass} h-9 capitalize`}
          defaultValue={value("status") || "applied"}
          key={value("status")}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="applied_on">Application date</Label>
        <Input
          id="applied_on"
          name="applied_on"
          type="date"
          defaultValue={value("applied_on")}
        />
      </div>
      <div className="grid gap-2 sm:col-span-2">
        <Label htmlFor="notes">Notes</Label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          className={fieldClass}
          defaultValue={value("notes")}
        />
      </div>
      <div className="flex items-center gap-4 sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending
            ? "Saving..."
            : application
              ? "Save changes"
              : "Add application"}
        </Button>
        <FormMessage state={state} />
      </div>
    </form>
  );
}
