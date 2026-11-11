"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import {
  fieldsOf,
  getAuthedClient,
  notSignedIn,
  text,
} from "@/lib/actions-helpers";
import { STATUSES, type ActionState, type Status } from "@/lib/types";

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
