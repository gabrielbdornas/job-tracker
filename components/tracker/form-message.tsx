import { cn } from "@/lib/utils";
import type { ActionState } from "@/lib/types";

export function FormMessage({ state }: { state: ActionState }) {
  return (
    <p
      aria-live="polite"
      role={state && !state.ok ? "alert" : undefined}
      className={cn(
        "text-sm",
        !state && "sr-only",
        state?.ok && "text-green-600 dark:text-green-500",
        state && !state.ok && "text-red-500",
      )}
    >
      {state?.message}
    </p>
  );
}

// Same look as components/ui/input.tsx, for <select> and <textarea>.
export const fieldClass =
  "flex w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";
