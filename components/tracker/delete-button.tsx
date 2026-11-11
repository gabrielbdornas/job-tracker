"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/tracker/form-message";
import type { ActionState } from "@/lib/types";

export function DeleteButton({
  action,
  confirmText,
  label = "Delete",
}: {
  action: () => Promise<ActionState>;
  confirmText: string;
  label?: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm(confirmText)) e.preventDefault();
      }}
      className="flex items-center gap-3"
    >
      <Button type="submit" variant="destructive" size="sm" disabled={pending}>
        {pending ? "Deleting..." : label}
      </Button>
      {state && !state.ok && <FormMessage state={state} />}
    </form>
  );
}
