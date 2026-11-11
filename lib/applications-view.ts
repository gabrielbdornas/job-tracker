import { cookies } from "next/headers";
import { VIEWS, type ApplicationsView } from "@/lib/types";

// The Applications page remembers Table vs. Kanban in this cookie.
export const VIEW_COOKIE = "applications_view";

export async function getApplicationsView(): Promise<ApplicationsView> {
  const value = (await cookies()).get(VIEW_COOKIE)?.value;
  return VIEWS.find((v) => v === value) ?? "table";
}
