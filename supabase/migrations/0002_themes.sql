-- Themes table tied to events
create table if not exists public.themes (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  title text not null,
  notes text,
  status text not null default 'requested' check (status in ('requested', 'building', 'ready', 'failed')),
  enabled boolean not null default false,
  issue_number integer,
  issue_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_themes_event_id on public.themes (event_id);

alter table public.themes enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'themes' and policyname = 'themes_authenticated_all'
  ) then
    create policy themes_authenticated_all on public.themes
      for all
      using (auth.role() = 'authenticated')
      with check (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'themes' and policyname = 'themes_public_ready'
  ) then
    create policy themes_public_ready on public.themes
      for select
      using (enabled = true and status = 'ready');
  end if;
end $$;
