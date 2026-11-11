export const STATUSES = ["applied", "interviewing", "offer", "rejected"] as const;

export type Status = (typeof STATUSES)[number];

export type Application = {
  id: string;
  company: string;
  position: string;
  status: Status;
  applied_on: string | null;
  notes: string | null;
  created_at: string;
};

export type Task = {
  id: string;
  application_id: string;
  title: string;
  due_date: string | null;
  done: boolean;
  created_at: string;
};

export type TaskWithApplication = Task & {
  applications: Pick<Application, "company" | "position"> | null;
};

// Result returned by every server action so forms can show a message.
// `fields` echoes the submitted values so a failed form keeps what was typed.
export type ActionState = {
  ok: boolean;
  message: string;
  fields?: Record<string, string>;
} | null;
