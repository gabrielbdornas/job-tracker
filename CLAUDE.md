# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

The Next.js version here has breaking changes from older releases; the bundled docs in `node_modules/next/dist/docs/` are the source of truth (see AGENTS.md above).

## Commands

```bash
npm run dev          # dev server on http://localhost:3000 (reads .env.local)
npm run build        # production build
npm run lint         # ESLint
npx tsc --noEmit     # type check (no separate script)

npm run db:new <name>  # new timestamped file in supabase/migrations/
npm run db:push        # apply pending migrations to the linked Supabase project
npm run db:status      # local vs. applied migrations
npm run db:seed        # push + run supabase/seed.sql
```

There is no test suite.

Supabase CLI notes (v3, dev dependency, run via `npx supabase`):
- Commands target a **local** Docker database by default; the npm scripts pass `--remote` to hit the linked project.
- The linked project is marked production. From an agent session the CLI refuses mutating commands (`db push`, `db query` without `--read-only`) unless `--yes` is passed; ask the user before adding `--yes`. `--dry-run` and `db query --remote --read-only "<sql>"` are safe for inspection.
- Never edit an applied migration; add a new one.

## Architecture

Job Tracker built on the Next.js + Supabase starter: users track job **applications** and follow-up **tasks** (each task belongs to one application).

**Auth (from the starter; don't restructure).** `proxy.ts` → `lib/supabase/proxy.ts` refreshes the session on every request and redirects signed-out users to `/auth/login` for any path except `/` and `/auth/*`. So new pages are protected automatically. Log-in forms in `components/*-form.tsx` push to `/protected`, which `next.config.ts` redirects to `/dashboard`.

**Data isolation is enforced in the database, not the app.** `supabase/migrations/` creates `applications` and `tasks` with RLS policies restricting every operation to `user_id = auth.uid()`; task insert/update also require the parent application to belong to the same user. `user_id` defaults to `auth.uid()`, so app code never sets it. Queries therefore don't filter by user — RLS does. Server code uses `lib/supabase/server.ts` (publishable key + user cookies), never a service-role key.

**App routes** live in the `app/(tracker)/` route group, whose `layout.tsx` provides the top nav:
- `applications/page.tsx`, `applications/[id]/page.tsx`, `tasks/page.tsx` — Server Components.
- `applications/actions.ts`, `tasks/actions.ts` — Server Actions for all mutations.

**Cache Components is enabled** (`cacheComponents: true`). Any component that reads cookies, params or Supabase data must sit inside `<Suspense>`; pages are therefore a synchronous shell that renders an async inner component in a boundary. Pages that only call `redirect()` trip dev-time instant-navigation validation — use `redirects()` in `next.config.ts` instead.

**Mutation pattern.**
- Every action returns `ActionState` (`lib/types.ts`): `{ ok, message, fields? }`.
- Actions start with `getAuthedClient()` from `lib/actions-helpers.ts`, then validate, then write.
- They call `refresh()` from `next/cache` after writing; `deleteApplication` calls `redirect()`.
- Updates and deletes use `.select("id")` and treat zero rows as "not found", because RLS hides other users' rows instead of erroring.
- Client forms in `components/tracker/` use `useActionState` and render `<FormMessage>`.
- React resets a form after each action, so actions echo submitted values in `fields` and forms use them as `defaultValue`, which keeps input after a failed save.
- To pass an id, bind it to the action (`action.bind(null, id)`).

**UI.** shadcn/ui primitives in `components/ui/`, Tailwind with HSL CSS variables in `app/globals.css` (Supabase-dashboard-style palette with a custom `brand` emerald token; dark theme by default via `next-themes`). Shared tracker pieces: `Panel`/`PageHeader` (`components/tracker/panel.tsx`), `StatusBadge`. Allowed statuses are defined twice — `STATUSES` in `lib/types.ts` and the `check` constraint in the initial migration — keep them in sync.

**Environment.** `.env.local` needs `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (see `.env.example`).
