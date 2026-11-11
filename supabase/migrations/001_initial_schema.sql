-- Job Tracker: initial schema
-- Run this once in the Supabase dashboard: SQL Editor > New query > paste > Run.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  company text not null check (length(trim(company)) > 0),
  position text not null check (length(trim(position)) > 0),
  status text not null default 'applied'
    check (status in ('applied', 'interviewing', 'offer', 'rejected')),
  applied_on date,
  notes text,
  created_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  application_id uuid not null references public.applications (id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  due_date date,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

create index applications_user_id_idx on public.applications (user_id);
create index tasks_user_id_idx on public.tasks (user_id);
create index tasks_application_id_idx on public.tasks (application_id);

-- ---------------------------------------------------------------------------
-- Row Level Security: every user can only read and write their own rows.
-- ---------------------------------------------------------------------------

alter table public.applications enable row level security;
alter table public.tasks enable row level security;

-- applications

create policy "Users can read their own applications"
  on public.applications for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own applications"
  on public.applications for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own applications"
  on public.applications for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own applications"
  on public.applications for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- tasks
-- Insert and update also require that the linked application belongs to the
-- same user, so a task can never be attached to someone else's application.

create policy "Users can read their own tasks"
  on public.tasks for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create tasks on their own applications"
  on public.tasks for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.applications a
      where a.id = application_id and a.user_id = (select auth.uid())
    )
  );

create policy "Users can update their own tasks"
  on public.tasks for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.applications a
      where a.id = application_id and a.user_id = (select auth.uid())
    )
  );

create policy "Users can delete their own tasks"
  on public.tasks for delete
  to authenticated
  using ((select auth.uid()) = user_id);
