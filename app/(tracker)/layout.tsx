import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import Link from "next/link";
import { Suspense } from "react";

export default function TrackerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
        <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
          <div className="flex gap-5 items-center font-semibold">
            <Link href="/applications">Job Tracker</Link>
            <Link
              href="/applications"
              className="font-normal hover:underline underline-offset-4"
            >
              Applications
            </Link>
            <Link
              href="/tasks"
              className="font-normal hover:underline underline-offset-4"
            >
              Tasks
            </Link>
          </div>
          <Suspense>
            <AuthButton />
          </Suspense>
        </div>
      </nav>
      <div className="flex-1 w-full max-w-5xl flex flex-col gap-10 p-5">
        {children}
      </div>
      <footer className="w-full flex items-center justify-center border-t text-xs py-8">
        <ThemeSwitcher />
      </footer>
    </main>
  );
}
