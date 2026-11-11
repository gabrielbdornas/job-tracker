"use client";

import { Download, Upload } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import {
  importApplications,
  type ImportResult,
} from "@/app/(tracker)/applications/actions";
import { FormMessage } from "@/components/tracker/form-message";
import { StatusBadge } from "@/components/tracker/status-badge";
import { Button } from "@/components/ui/button";
import {
  MAX_CSV_BYTES,
  parseApplicationsCsv,
  type ParsedImport,
} from "@/lib/csv-import";

const PREVIEW_ROWS = 5;

// "Import CSV" button: pick a file, preview what will be imported, confirm.
export function ImportApplications() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [csv, setCsv] = useState("");
  const [preview, setPreview] = useState<ParsedImport | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [pending, startTransition] = useTransition();

  async function onFile(file: File | undefined) {
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    if (file.size > MAX_CSV_BYTES) {
      setCsv("");
      setPreview({ rows: [], errors: [], fatal: "The file is too large (max 500 KB)." });
    } else {
      const text = await file.text();
      setCsv(text);
      setPreview(parseApplicationsCsv(text));
    }
  }

  function open() {
    dialogRef.current?.showModal();
  }

  function chooseFile() {
    // Allow choosing the same file again.
    if (inputRef.current) inputRef.current.value = "";
    inputRef.current?.click();
  }

  function close() {
    dialogRef.current?.close();
  }

  function reset() {
    setFileName("");
    setPreview(null);
    setResult(null);
    setCsv("");
  }

  function confirmImport() {
    startTransition(async () => {
      setResult(await importApplications(csv));
    });
  }

  const errors = result?.errors ?? preview?.errors ?? [];
  const canImport = !!preview?.rows.length && !preview.fatal && !result;

  return (
    <>
      <Button size="sm" variant="outline" onClick={open}>
        <Upload aria-hidden />
        Import CSV
      </Button>

      <dialog
        ref={dialogRef}
        onClose={reset}
        aria-labelledby="import-title"
        className="m-auto w-[min(42rem,calc(100vw-2rem))] rounded-md border bg-card p-0 text-card-foreground shadow-lg backdrop:bg-black/60"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => onFile(e.target.files?.[0])}
        />
        <header className="border-b px-4 py-3">
          <h2 id="import-title" className="text-sm font-medium">
            Import applications
          </h2>
          {fileName && (
            <p className="text-xs text-muted-foreground break-all">
              {fileName}
            </p>
          )}
        </header>

        <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto p-4 text-sm">
          {preview?.fatal ? (
            <p role="alert" className="text-red-500">
              {preview.fatal}
            </p>
          ) : result ? (
            <FormMessage state={result} />
          ) : (
            preview && (
              <>
                <p>
                  <span className="font-medium text-brand">
                    {preview.rows.length}
                  </span>{" "}
                  row{preview.rows.length === 1 ? "" : "s"} ready to import
                  {preview.errors.length > 0 && (
                    <>
                      ,{" "}
                      <span className="font-medium text-red-500">
                        {preview.errors.length}
                      </span>{" "}
                      with errors (they will be skipped)
                    </>
                  )}
                  . Rows matching an application you already have (same
                  company and position) are skipped too.
                </p>
                {preview.rows.length > 0 && (
                  <div className="overflow-x-auto rounded-md border">
                    <table className="w-full text-xs">
                      <thead className="border-b bg-muted/60 text-left uppercase tracking-wider text-muted-foreground">
                        <tr>
                          <th className="px-3 py-2 font-normal">Line</th>
                          <th className="px-3 py-2 font-normal">Company</th>
                          <th className="px-3 py-2 font-normal">Position</th>
                          <th className="px-3 py-2 font-normal">Status</th>
                          <th className="px-3 py-2 font-normal">Applied on</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {preview.rows.slice(0, PREVIEW_ROWS).map((r) => (
                          <tr key={r.line}>
                            <td className="px-3 py-2 font-mono text-muted-foreground">
                              {r.line}
                            </td>
                            <td className="px-3 py-2">{r.company}</td>
                            <td className="px-3 py-2">{r.position}</td>
                            <td className="px-3 py-2">
                              <StatusBadge status={r.status} />
                            </td>
                            <td className="px-3 py-2 font-mono">
                              {r.applied_on ?? "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {preview.rows.length > PREVIEW_ROWS && (
                      <p className="border-t px-3 py-2 text-xs text-muted-foreground">
                        and {preview.rows.length - PREVIEW_ROWS} more
                      </p>
                    )}
                  </div>
                )}
              </>
            )
          )}

          {errors.length > 0 && !preview?.fatal && (
            <div>
              <h3 className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Skipped rows
              </h3>
              <ul className="flex flex-col gap-1 text-xs">
                {errors.map((e) => (
                  <li key={e.line}>
                    <span className="font-mono text-muted-foreground">
                      Line {e.line}:
                    </span>{" "}
                    <span className="text-red-500">{e.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
            <p>
              The first line must be the header. Columns:{" "}
              <code>company</code> and <code>position</code> (required),{" "}
              <code>status</code> ({"applied, interviewing, offer, rejected"};
              empty means applied), <code>applied_on</code> (YYYY-MM-DD or
              DD/MM/YYYY), <code>notes</code>. Comma or semicolon separated.
            </p>
            <a
              href="/applications-template.csv"
              download
              className="mt-2 inline-flex items-center gap-1 font-medium text-brand hover:underline"
            >
              <Download className="h-3.5 w-3.5" aria-hidden />
              Download template
            </a>
          </div>
        </div>

        <footer className="flex justify-end gap-2 border-t px-4 py-3">
          <Button size="sm" variant="outline" onClick={close}>
            {result ? "Close" : "Cancel"}
          </Button>
          {!result && (
            <Button
              size="sm"
              variant={canImport ? "outline" : "default"}
              onClick={chooseFile}
              disabled={pending}
            >
              {preview ? "Choose another file" : "Choose CSV file"}
            </Button>
          )}
          {canImport && (
            <Button size="sm" onClick={confirmImport} disabled={pending}>
              {pending
                ? "Importing..."
                : `Import ${preview.rows.length} row${preview.rows.length === 1 ? "" : "s"}`}
            </Button>
          )}
        </footer>
      </dialog>
    </>
  );
}
