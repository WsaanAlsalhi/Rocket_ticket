create table public.rocket_participants (
    id bigint generated always as identity primary key,

    name text not null,

    country text not null,

    mission_id text not null unique,

    seat text not null,

    ticket_image_url text,

    created_at timestamptz not null default now()
);


create index rocket_participants_created_at_idx
on public.rocket_participants(created_at desc);


create index rocket_participants_mission_id_idx
on public.rocket_participants(mission_id);