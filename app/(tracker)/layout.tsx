import { ThemeSwitcher } from "@/components/theme-switcher";
import { NavLinks } from "@/components/tracker/nav-links";
import { UserNav } from "@/components/tracker/user-nav";
import Link from "next/link";
import { Suspense } from "react";

export default function TrackerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-4">
            <Link
              href="/applications"
              className="flex items-center gap-2 text-sm font-medium"
            >
              <span
                className="flex h-6 w-6 items-center justify-center rounded-md border border-brand/40 bg-brand/15 text-xs font-semibold text-brand"
                aria-hidden
              >
                JT
              </span>
              <span className="hidden sm:inline">Job Tracker</span>
            </Link>
            <span className="h-5 w-px bg-border" aria-hidden />
            <Suspense>
              <NavLinks />
            </Suspense>
          </div>
          <div className="flex items-center gap-1">
            <ThemeSwitcher />
            <Suspense>
              <UserNav />
            </Suspense>
          </div>
        </div>
      </nav>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8">
        {children}
      </main>
    </div>
  );
}
