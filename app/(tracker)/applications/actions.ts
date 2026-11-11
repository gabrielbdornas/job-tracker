"use server";

import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  fieldsOf,
  getAuthedClient,
  notSignedIn,
  text,
} from "@/lib/actions-helpers";
import { VIEW_COOKIE } from "@/lib/applications-view";
import {
  MAX_CSV_BYTES,
  duplicateKey,
  parseApplicationsCsv,
  type ImportError,
} from "@/lib/csv-import";
import {
  STATUSES,
  VIEWS,
  type ActionState,
  type ApplicationsView,
  type Status,
} from "@/lib/types";

const FIELDS = ["company", "position", "status", "applied_on", "notes"];

type ApplicationValues = {
  company: string;
  position: string;
  status: Status;
  applied_on: string | null;
  notes: string | null;
};

function parse(
  formData: FormData,
): { error: string } | { values: ApplicationValues } {
  const values: ApplicationValues = {
    company: text(formData, "company"),
    position: text(formData, "position"),
    status: text(formData, "status") as Status,
    applied_on: text(formData, "applied_on") || null,
    notes: text(formData, "notes") || null,
  };

  if (!values.company) return { error: "Company is required." };
  if (!values.position) return { error: "Position is required." };
  if (!STATUSES.includes(values.status)) return { error: "Pick a valid status." };

  return { values };
}

export async function createApplication(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await getAuthedClient();
  if (!supabase) return notSignedIn;

  const fields = fieldsOf(formData, FIELDS);
  const parsed = parse(formData);
  if ("error" in parsed) return { ok: false, message: parsed.error, fields };
  const { values } = parsed;

  // user_id is filled in by the database from the signed-in user.
  const { error: dbError } = await supabase.from("applications").insert(values);
  if (dbError) {
    return { ok: false, message: `Could not save: ${dbError.message}`, fields };
  }

  refresh();
  return { ok: true, message: `Saved application to ${values.company}.` };
}

export async function updateApplication(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await getAuthedClient();
  if (!supabase) return notSignedIn;

  const fields = fieldsOf(formData, FIELDS);
  const parsed = parse(formData);
  if ("error" in parsed) return { ok: false, message: parsed.error, fields };
  const { values } = parsed;

  const { data, error: dbError } = await supabase
    .from("applications")
    .update(values)
    .eq("id", id)
    .select("id");
  if (dbError) {
    return { ok: false, message: `Could not save: ${dbError.message}`, fields };
  }
  if (!data?.length) {
    return { ok: false, message: "Application not found.", fields };
  }

  refresh();
  return { ok: true, message: "Changes saved.", fields };
}

export async function deleteApplication(id: string): Promise<ActionState> {
  const supabase = await getAuthedClient();
  if (!supabase) return notSignedIn;

  const { data, error } = await supabase
    .from("applications")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) return { ok: false, message: `Could not delete: ${error.message}` };
  if (!data?.length) return { ok: false, message: "Application not found." };

  redirect("/applications");
}

// Used by the Kanban board when a card is dropped on another column.
export async function setApplicationStatus(
  id: string,
  status: Status,
): Promise<ActionState> {
  const supabase = await getAuthedClient();
  if (!supabase) return notSignedIn;
  if (!STATUSES.includes(status)) {
    return { ok: false, message: "Pick a valid status." };
  }

  const { data, error } = await supabase
    .from("applications")
    .update({ status })
    .eq("id", id)
    .select("id");
  if (error) return { ok: false, message: `Could not move: ${error.message}` };
  if (!data?.length) return { ok: false, message: "Application not found." };

  refresh();
  return { ok: true, message: `Moved to ${status}.` };
}

export async function setApplicationsView(view: ApplicationsView) {
  if (!VIEWS.includes(view)) return;
  (await cookies()).set(VIEW_COOKIE, view, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  refresh();
}

export type ImportResult = {
  ok: boolean;
  message: string;
  imported: number;
  duplicates: number;
  errors: ImportError[];
};

// Imports applications from CSV text. Invalid rows and rows matching an
// existing application (same company and position) are skipped.
export async function importApplications(csv: string): Promise<ImportResult> {
  const fail = (message: string, errors: ImportError[] = []) => ({
    ok: false,
    message,
    imported: 0,
    duplicates: 0,
    errors,
  });

  const supabase = await getAuthedClient();
  if (!supabase) return fail(notSignedIn.message);
  if (new Blob([csv]).size > MAX_CSV_BYTES) {
    return fail("The file is too large (max 500 KB).");
  }

  const { rows, errors, fatal } = parseApplicationsCsv(csv);
  if (fatal) return fail(fatal);

  const { data: existing, error: readError } = await supabase
    .from("applications")
    .select("company, position");
  if (readError) {
    return fail(`Could not check for duplicates: ${readError.message}`, errors);
  }

  const seen = new Set(existing.map((a) => duplicateKey(a.company, a.position)));
  const toInsert = [];
  let duplicates = 0;
  for (const row of rows) {
    const key = duplicateKey(row.company, row.position);
    if (seen.has(key)) {
      duplicates++;
      continue;
    }
    seen.add(key);
    toInsert.push({
      company: row.company,
      position: row.position,
      status: row.status,
      applied_on: row.applied_on,
      notes: row.notes,
    });
  }

  if (toInsert.length) {
    // user_id is filled in by the database from the signed-in user.
    const { error } = await supabase.from("applications").insert(toInsert);
    if (error) return fail(`Could not import: ${error.message}`, errors);
    refresh();
  }

  const parts = [
    `Imported ${toInsert.length} application${toInsert.length === 1 ? "" : "s"}.`,
  ];
  if (duplicates) parts.push(`${duplicates} duplicate${duplicates === 1 ? "" : "s"} skipped.`);
  if (errors.length) parts.push(`${errors.length} invalid row${errors.length === 1 ? "" : "s"} skipped.`);

  return {
    ok: toInsert.length > 0 || (duplicates > 0 && !errors.length),
    message: parts.join(" "),
    imported: toInsert.length,
    duplicates,
    errors,
  };
}
