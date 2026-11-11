import { cn } from "@/lib/utils";

// Bordered surface with an optional header row, in the style of the
// Supabase dashboard's settings panels.
export function Panel({
  title,
  description,
  actions,
  danger = false,
  className,
  children,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  danger?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-md border bg-card shadow-sm",
        danger && "border-destructive/50",
        className,
      )}
    >
      {title && (
        <header
          className={cn(
            "flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3",
            danger && "border-destructive/50",
          )}
        >
          <div>
            <h2 className="text-sm font-medium">{title}</h2>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          {actions}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function PageHeader({
  title,
  description,
  children,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-normal tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}
