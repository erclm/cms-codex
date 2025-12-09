-- Enable extensions
create extension if not exists "pgcrypto";

-- Products table
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  price_cents integer not null check (price_cents >= 0),
  status text not null default 'draft' check (status in ('draft','published')),
  summary text,
  description text,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Events table
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status text not null default 'draft' check (status in ('draft','published')),
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS policies
alter table public.products enable row level security;
alter table public.events enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'products' and policyname = 'products_authenticated_all'
  ) then
    create policy products_authenticated_all on public.products
      for all
      using (auth.role() = 'authenticated')
      with check (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'events' and policyname = 'events_authenticated_all'
  ) then
    create policy events_authenticated_all on public.events
      for all
      using (auth.role() = 'authenticated')
      with check (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'products' and policyname = 'products_public_published'
  ) then
    create policy products_public_published on public.products
      for select
      using (status = 'published');
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'events' and policyname = 'events_public_published'
  ) then
    create policy events_public_published on public.events
      for select
      using (status = 'published');
  end if;
end $$;

-- Seed data (idempotent)
insert into public.products (name, slug, price_cents, status, summary, description, image_url)
select * from (values
  ('Minimal Tee', 'minimal-tee', 2800, 'published', 'Soft cotton tee', 'A simple everyday tee in breathable cotton.', null),
  ('Utility Backpack', 'utility-backpack', 7900, 'published', 'Durable daily pack', 'Rugged backpack with laptop sleeve and water-resistant finish.', null),
  ('Weekender Duffel', 'weekender-duffel', 12500, 'draft', 'Carry-on ready', 'Compact duffel perfect for quick trips.', null)
) as v(name, slug, price_cents, status, summary, description, image_url)
where not exists (select 1 from public.products p where p.slug = v.slug);

insert into public.events (title, description, status, starts_at, ends_at)
select * from (values
  ('Spring Launch', 'Seasonal drop of basics and accessories.', 'published', now() + interval '7 days', now() + interval '7 days' + interval '2 hours'),
  ('Pop-up Preview', 'In-person preview for select customers.', 'draft', now() + interval '21 days', now() + interval '21 days' + interval '4 hours')
) as v(title, description, status, starts_at, ends_at)
where not exists (select 1 from public.events e where e.title = v.title);
