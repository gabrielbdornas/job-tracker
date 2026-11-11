import Link from "next/link";
import { Suspense } from "react";
import { ApplicationForm } from "@/components/tracker/application-form";
import { StatusBadge } from "@/components/tracker/status-badge";
import { createClient } from "@/lib/supabase/server";
import type { Application } from "@/lib/types";

export default function ApplicationsPage() {
  return (
    <>
      <section className="flex flex-col gap-4">
        <h1 className="font-bold text-2xl">Applications</h1>
        <Suspense fallback={<p className="text-sm">Loading applications...</p>}>
          <ApplicationsTable />
        </Suspense>
      </section>
      <section className="flex flex-col gap-4">
        <h2 className="font-semibold text-xl">Add application</h2>
        <ApplicationForm />
      </section>
    </>
  );
}

async function ApplicationsTable() {
  const supabase = await createClient();
  // Row Level Security makes this return only the signed-in user's rows.
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<Application[]>();

  if (error) {
    return (
      <p role="alert" className="text-sm text-red-500">
        Could not load applications: {error.message}
      </p>
    );
  }
  if (!data.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No applications yet. Add your first one below.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left">
          <tr>
            <th className="p-3 font-medium">Company</th>
            <th className="p-3 font-medium">Position</th>
            <th className="p-3 font-medium">Status</th>
            <th className="p-3 font-medium">Applied on</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {data.map((a) => (
            <tr key={a.id} className="hover:bg-muted/30">
              <td className="p-3">
                <Link
                  href={`/applications/${a.id}`}
                  className="font-medium underline underline-offset-2"
                >
                  {a.company}
                </Link>
              </td>
              <td className="p-3">{a.position}</td>
              <td className="p-3">
                <StatusBadge status={a.status} />
              </td>
              <td className="p-3">{a.applied_on ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
