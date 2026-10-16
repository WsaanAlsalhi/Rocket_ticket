-- ============================================
-- ROCKET MISSION DATABASE
-- ============================================

create table if not exists public.rocket_participants (

    id bigint generated always as identity primary key,

    name text not null,

    country text not null,

    mission_id text unique,

    seat text unique,

    ticket_image_url text,

    created_at timestamptz not null default now()

);


-- ============================================
-- INDEXES
-- ============================================

create index if not exists rocket_participants_created_at_idx
on public.rocket_participants(created_at desc);


create index if not exists rocket_participants_mission_id_idx
on public.rocket_participants(mission_id);


-- ============================================
-- STORAGE BUCKET
-- ============================================

insert into storage.buckets (
    id,
    name,
    public
)

values (
    'rocket-tickets',
    'rocket-tickets',
    true
)

on conflict (id)
do update set public = true;
