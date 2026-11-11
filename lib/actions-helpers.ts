import { createClient } from "@/lib/supabase/server";

// Returns a Supabase client for the signed-in user, or null if nobody is
// signed in. Row Level Security in the database does the actual ownership
// check; this just gives a clear message instead of a database error.
export async function getAuthedClient() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) return null;
  return supabase;
}

export function text(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

export function fieldsOf(formData: FormData, names: string[]) {
  return Object.fromEntries(names.map((n) => [n, text(formData, n)]));
}

export const notSignedIn = {
  ok: false,
  message: "You are not signed in. Please log in again.",
} as const;
