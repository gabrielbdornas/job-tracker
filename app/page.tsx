import { ThemeSwitcher } from "@/components/theme-switcher";
import { LogoMark } from "@/components/tracker/logo";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { Briefcase, ListChecks, Lock } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

const FEATURES = [
  {
    icon: Briefcase,
    title: "Applications",
    text: "Company, position, status, date and notes for every job you apply to.",
  },
  {
    icon: ListChecks,
    title: "Tasks",
    text: "Follow-ups with due dates for each application, all in one list.",
  },
  {
    icon: Lock,
    title: "Private",
    text: "Your data belongs to your account. Nobody else can see it.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="border-b">
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between gap-3 px-4">
          <Link href="/" className="flex items-center gap-2 text-sm font-medium">
            <LogoMark />
            Job Tracker
          </Link>
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <Suspense fallback={<SignedOutActions />}>
              <Actions />
            </Suspense>
          </div>
        </div>
      </nav>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center gap-16 px-4 py-20">
        <section className="flex max-w-2xl flex-col items-center gap-6 text-center">
          <h1 className="text-4xl font-normal tracking-tight sm:text-5xl">
            Keep your job search{" "}
            <span className="text-brand">organized</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Track every application and the follow-ups that go with it, in one
            simple place.
          </p>
          <Suspense fallback={<SignedOutActions size="default" />}>
            <Actions size="default" />
          </Suspense>
        </section>

        <section className="grid w-full gap-4 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-md border bg-card p-5 shadow-sm">
              <Icon className="h-5 w-5 text-brand" aria-hidden />
              <h2 className="mt-3 text-sm font-medium">{title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}

type Size = "sm" | "default";

// Signed-in visitors get a link into the app instead of sign in / sign up.
async function Actions({ size = "sm" }: { size?: Size }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (data?.claims) {
    return (
      <Button asChild size={size}>
        <Link href="/applications">Open Job Tracker</Link>
      </Button>
    );
  }
  return <SignedOutActions size={size} />;
}

function SignedOutActions({ size = "sm" }: { size?: Size }) {
  return (
    <div className="flex items-center gap-2">
      <Button asChild size={size} variant="outline">
        <Link href="/auth/login">Sign in</Link>
      </Button>
      <Button asChild size={size}>
        <Link href="/auth/sign-up">Sign up</Link>
      </Button>
    </div>
  );
}
