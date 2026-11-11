import { Badge } from "@/components/ui/badge";
import type { Status } from "@/lib/types";

const VARIANT = {
  applied: "secondary",
  interviewing: "default",
  offer: "default",
  rejected: "outline",
} as const;

export function StatusBadge({ status }: { status: Status }) {
  return (
    <Badge variant={VARIANT[status]} className="capitalize">
      {status}
    </Badge>
  );
}
