"use server";

import { refresh } from "next/cache";
import {
  fieldsOf,
  getAuthedClient,
  notSignedIn,
  text,
} from "@/lib/actions-helpers";
import type { ActionState } from "@/lib/types";

const FIELDS = ["title", "due_date", "application_id"];

export async function createTask(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await getAuthedClient();
  if (!supabase) return notSignedIn;

  const fields = fieldsOf(formData, FIELDS);
  const title = text(formData, "title");
  const application_id = text(formData, "application_id");
  if (!title) return { ok: false, message: "Title is required.", fields };
  if (!application_id) {
    return { ok: false, message: "Pick an application.", fields };
  }

  // user_id is filled in by the database; the database rules also reject an
  // application_id that belongs to another user.
  const { error } = await supabase.from("tasks").insert({
    title,
    application_id,
    due_date: text(formData, "due_date") || null,
  });
  if (error) {
    return { ok: false, message: `Could not save: ${error.message}`, fields };
  }

  refresh();
  return { ok: true, message: `Added task "${title}".` };
}

export async function updateTask(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await getAuthedClient();
  if (!supabase) return notSignedIn;

  const fields = fieldsOf(formData, FIELDS);
  const title = text(formData, "title");
  if (!title) return { ok: false, message: "Title is required.", fields };

  const { data, error } = await supabase
    .from("tasks")
    .update({ title, due_date: text(formData, "due_date") || null })
    .eq("id", id)
    .select("id");
  if (error) {
    return { ok: false, message: `Could not save: ${error.message}`, fields };
  }
  if (!data?.length) return { ok: false, message: "Task not found.", fields };

  refresh();
  return { ok: true, message: "Task saved." };
}

export async function setTaskDone(
  id: string,
  done: boolean,
): Promise<ActionState> {
  const supabase = await getAuthedClient();
  if (!supabase) return notSignedIn;

  const { data, error } = await supabase
    .from("tasks")
    .update({ done })
    .eq("id", id)
    .select("id");
  if (error) return { ok: false, message: `Could not update: ${error.message}` };
  if (!data?.length) return { ok: false, message: "Task not found." };

  refresh();
  return { ok: true, message: done ? "Marked as done." : "Marked as not done." };
}

export async function deleteTask(id: string): Promise<ActionState> {
  const supabase = await getAuthedClient();
  if (!supabase) return notSignedIn;

  const { data, error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) return { ok: false, message: `Could not delete: ${error.message}` };
  if (!data?.length) return { ok: false, message: "Task not found." };

  refresh();
  return { ok: true, message: "Task deleted." };
}
