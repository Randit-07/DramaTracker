-- Drama Tracker – Supabase schema
-- Run this in Supabase Dashboard → SQL Editor (one-time setup)

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users (backend auth; password_hash stored here)
create table if not exists public.users (
  id uuid primary key default uuid_generate_v4(),
  email text not null unique,
  password_hash text not null,
  name text,
  created_at timestamptz not null default now()
);

-- Watched entries (user + TMDB movie id)
create table if not exists public.watched_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  movie_id integer not null,
  title text,
  poster_path text,
  added_at timestamptz not null default now(),
  unique(user_id, movie_id)
);
create index if not exists watched_entries_user_id on public.watched_entries(user_id);

-- Playlists
create table if not exists public.playlists (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  owner_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists playlists_owner_id on public.playlists(owner_id);

-- Playlist members (watch together)
create table if not exists public.playlist_members (
  id uuid primary key default uuid_generate_v4(),
  playlist_id uuid not null references public.playlists(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique(playlist_id, user_id)
);
create index if not exists playlist_members_playlist_id on public.playlist_members(playlist_id);
create index if not exists playlist_members_user_id on public.playlist_members(user_id);

-- Playlist movies
create table if not exists public.playlist_movies (
  id uuid primary key default uuid_generate_v4(),
  playlist_id uuid not null references public.playlists(id) on delete cascade,
  movie_id integer not null,
  title text,
  poster_path text,
  added_by_id uuid not null references public.users(id) on delete cascade,
  added_at timestamptz not null default now()
);
create index if not exists playlist_movies_playlist_id on public.playlist_movies(playlist_id);

-- Recommendations
create table if not exists public.recommendations (
  id uuid primary key default uuid_generate_v4(),
  from_user_id uuid not null references public.users(id) on delete cascade,
  to_user_id uuid not null references public.users(id) on delete cascade,
  movie_id integer not null,
  title text,
  poster_path text,
  message text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists recommendations_to_user_id on public.recommendations(to_user_id);
create index if not exists recommendations_from_user_id on public.recommendations(from_user_id);

-- Row Level Security (backend uses service_role key; these allow backend full access)
alter table public.users enable row level security;
alter table public.watched_entries enable row level security;
alter table public.playlists enable row level security;
alter table public.playlist_members enable row level security;
alter table public.playlist_movies enable row level security;
alter table public.recommendations enable row level security;

drop policy if exists "Service role full access users" on public.users;
drop policy if exists "Service role full access watched_entries" on public.watched_entries;
drop policy if exists "Service role full access playlists" on public.playlists;
drop policy if exists "Service role full access playlist_members" on public.playlist_members;
drop policy if exists "Service role full access playlist_movies" on public.playlist_movies;
drop policy if exists "Service role full access recommendations" on public.recommendations;

create policy "Service role full access users" on public.users for all using (true) with check (true);
create policy "Service role full access watched_entries" on public.watched_entries for all using (true) with check (true);
create policy "Service role full access playlists" on public.playlists for all using (true) with check (true);
create policy "Service role full access playlist_members" on public.playlist_members for all using (true) with check (true);
create policy "Service role full access playlist_movies" on public.playlist_movies for all using (true) with check (true);
create policy "Service role full access recommendations" on public.recommendations for all using (true) with check (true);
