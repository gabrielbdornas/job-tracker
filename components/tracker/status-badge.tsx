import { cn } from "@/lib/utils";
import type { Status } from "@/lib/types";

const STYLE: Record<Status, string> = {
  applied:
    "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400 [&>span]:bg-sky-500",
  interviewing:
    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 [&>span]:bg-amber-500",
  offer:
    "border-brand/40 bg-brand/10 text-emerald-700 dark:text-brand [&>span]:bg-brand",
  rejected:
    "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400 [&>span]:bg-red-500",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs capitalize",
        STYLE[status],
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full" aria-hidden />
      {status}
    </span>
  );
}
