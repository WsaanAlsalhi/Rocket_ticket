-- ============================================
-- 1) Participants table
-- ============================================
create table if not exists public.rocket_participants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text not null,
  email text,
  mission_id text not null unique,
  seat text not null,
  ticket_url text,
  created_at timestamptz default now()
);

-- ============================================
-- 2) Tickets bucket (public read)
-- ============================================
insert into storage.buckets (id, name, public)
values ('tickets', 'tickets', true)
on conflict (id) do nothing;

-- ============================================
-- 3) Storage policies
-- ============================================
drop policy if exists "service_role upload tickets" on storage.objects;
create policy "service_role upload tickets"
on storage.objects for insert
to service_role
with check (bucket_id = 'tickets');

drop policy if exists "public read tickets" on storage.objects;
create policy "public read tickets"
on storage.objects for select
to public
using (bucket_id = 'tickets');

drop policy if exists "service_role update tickets" on storage.objects;
create policy "service_role update tickets"
on storage.objects for update
to service_role
using (bucket_id = 'tickets');
