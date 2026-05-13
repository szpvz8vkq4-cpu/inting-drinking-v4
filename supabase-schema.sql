create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  host_pin text not null,
  state jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.rooms enable row level security;

drop policy if exists "rooms_select_all" on public.rooms;
create policy "rooms_select_all"
on public.rooms for select
to anon
using (true);

drop policy if exists "rooms_insert_all" on public.rooms;
create policy "rooms_insert_all"
on public.rooms for insert
to anon
with check (true);

drop policy if exists "rooms_update_all" on public.rooms;
create policy "rooms_update_all"
on public.rooms for update
to anon
using (true)
with check (true);

do $$
begin
  alter publication supabase_realtime add table public.rooms;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;
