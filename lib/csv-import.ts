// Parsing and validation for importing applications from CSV.
// Used in the browser for the preview and again on the server when importing,
// so the server never trusts what the browser sends.

import { STATUSES, type Status } from "@/lib/types";

export const MAX_CSV_BYTES = 500 * 1024;
export const MAX_CSV_ROWS = 1000;

export type ImportRow = {
  line: number;
  company: string;
  position: string;
  status: Status;
  applied_on: string | null;
  notes: string | null;
};

export type ImportError = { line: number; message: string };

export type ParsedImport = {
  rows: ImportRow[];
  errors: ImportError[];
  // Problems with the file as a whole (no header, too many rows, ...).
  fatal?: string;
};

const HEADER_ALIASES: Record<string, keyof Omit<ImportRow, "line">> = {
  company: "company",
  position: "position",
  status: "status",
  applied_on: "applied_on",
  application_date: "applied_on",
  date: "applied_on",
  notes: "notes",
};

export function parseApplicationsCsv(text: string): ParsedImport {
  const records = parseCsv(text.replace(/^﻿/, ""));
  if (!records.length) {
    return { rows: [], errors: [], fatal: "The file is empty." };
  }

  const [header, ...data] = records;
  const columns = header.cells.map(
    (h) => HEADER_ALIASES[h.trim().toLowerCase().replace(/\s+/g, "_")],
  );
  const missing = (["company", "position"] as const).filter(
    (c) => !columns.includes(c),
  );
  if (missing.length) {
    return {
      rows: [],
      errors: [],
      fatal: `Missing required column${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}. The first line must be the header.`,
    };
  }
  if (data.length > MAX_CSV_ROWS) {
    return {
      rows: [],
      errors: [],
      fatal: `The file has ${data.length} rows; the limit is ${MAX_CSV_ROWS}.`,
    };
  }

  const rows: ImportRow[] = [];
  const errors: ImportError[] = [];

  for (const { line, cells } of data) {
    const get = (name: keyof Omit<ImportRow, "line">) => {
      const i = columns.indexOf(name);
      return i === -1 ? "" : (cells[i] ?? "").trim();
    };

    const company = get("company");
    const position = get("position");
    const statusText = get("status").toLowerCase() || "applied";
    const dateText = get("applied_on");
    const applied_on = dateText ? parseDate(dateText) : null;

    const problems: string[] = [];
    if (!company) problems.push("company is empty");
    if (!position) problems.push("position is empty");
    if (!STATUSES.includes(statusText as Status)) {
      problems.push(
        `unknown status "${get("status")}" (use ${STATUSES.join(", ")})`,
      );
    }
    if (dateText && !applied_on) {
      problems.push(`invalid date "${dateText}" (use YYYY-MM-DD or DD/MM/YYYY)`);
    }

    if (problems.length) {
      errors.push({ line, message: problems.join("; ") });
    } else {
      rows.push({
        line,
        company,
        position,
        status: statusText as Status,
        applied_on,
        notes: get("notes") || null,
      });
    }
  }

  return { rows, errors };
}

// Key used to detect duplicates: same company and position, ignoring case
// and extra spaces.
export function duplicateKey(company: string, position: string) {
  const norm = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();
  return `${norm(company)}\u0000${norm(position)}`;
}

// Accepts YYYY-MM-DD and DD/MM/YYYY (also D/M/YYYY); returns YYYY-MM-DD.
function parseDate(text: string): string | null {
  let y: number, m: number, d: number;
  let match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (match) {
    [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  } else {
    match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!match) return null;
    [d, m, y] = [Number(match[1]), Number(match[2]), Number(match[3])];
  }
  const date = new Date(Date.UTC(y, m - 1, d));
  if (
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== m - 1 ||
    date.getUTCDate() !== d
  ) {
    return null;
  }
  return date.toISOString().slice(0, 10);
}

type CsvRecord = { line: number; cells: string[] };

// Minimal RFC 4180 parser: quoted fields may contain the delimiter, quotes
// ("") and line breaks. The delimiter (comma or semicolon) is detected from
// the header line. Blank lines are skipped. `line` is where a record starts.
function parseCsv(text: string): CsvRecord[] {
  const delimiter = detectDelimiter(text);
  const records: CsvRecord[] = [];
  let cells: string[] = [];
  let cell = "";
  let inQuotes = false;
  let line = 1;
  let recordLine = 1;

  const endRecord = () => {
    cells.push(cell);
    if (cells.some((c) => c.trim() !== "")) {
      records.push({ line: recordLine, cells });
    }
    cells = [];
    cell = "";
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        if (ch === "\n") line++;
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      cells.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      endRecord();
      line++;
      recordLine = line;
    } else {
      cell += ch;
    }
  }
  if (cell !== "" || cells.length) endRecord();

  return records;
}

function detectDelimiter(text: string): "," | ";" {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const count = (ch: string) => firstLine.split(ch).length - 1;
  return count(";") > count(",") ? ";" : ",";
}
