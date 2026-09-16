create table if not exists public.rocket_participants (
    id bigint generated always as identity primary key,
    name text not null,
    country text not null,
    email text,
    mission_id text unique not null,
    seat text unique not null,
    ticket_url text,
    created_at timestamptz not null default now()
);

alter table public.rocket_participants
add column if not exists email text;

alter table public.rocket_participants
add column if not exists ticket_url text;
