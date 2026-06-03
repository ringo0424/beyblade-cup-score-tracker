-- Run in Supabase SQL Editor (https://supabase.com/dashboard → SQL)
-- Single shared state: everyone using the app syncs to the same data (no room code).

create table if not exists public.app_global (
  id text primary key default 'main',
  payload jsonb not null default '{}'::jsonb,
  revision bigint not null default 0,
  updated_at timestamptz not null default now()
);

insert into public.app_global (id, payload, revision)
values (
  'main',
  '{"eventDays":[],"matches":[],"accounts":[],"version":2}'::jsonb,
  0
)
on conflict (id) do nothing;

alter table public.app_global enable row level security;

create policy "app_global_select" on public.app_global
  for select to anon, authenticated using (true);

create policy "app_global_insert" on public.app_global
  for insert to anon, authenticated with check (true);

create policy "app_global_update" on public.app_global
  for update to anon, authenticated using (true);

alter publication supabase_realtime add table public.app_global;
