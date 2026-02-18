-- Drama Tracker - Supabase (PostgreSQL) schema
-- Run this in Supabase SQL Editor or via Supabase CLI

-- Enable UUID extension if not already
create extension if not exists "uuid-ossp";

-- Users (we handle auth in backend; store password_hash here)
create table public.users (
  id uuid primary key default uuid_generate_v4(),
  email text not null unique,
  password_hash text not null,
  name text,
  created_at timestamptz not null default now()
);

-- Watched entries (user + TMDB movie id)
create table public.watched_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  movie_id integer not null,
  title text,
  poster_path text,
  added_at timestamptz not null default now(),
  unique(user_id, movie_id)
);

create index watched_entries_user_id on public.watched_entries(user_id);

-- Playlists
create table public.playlists (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  owner_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index playlists_owner_id on public.playlists(owner_id);

-- Playlist members (watch together)
create table public.playlist_members (
  id uuid primary key default uuid_generate_v4(),
  playlist_id uuid not null references public.playlists(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique(playlist_id, user_id)
);

create index playlist_members_playlist_id on public.playlist_members(playlist_id);
create index playlist_members_user_id on public.playlist_members(user_id);

-- Playlist movies
create table public.playlist_movies (
  id uuid primary key default uuid_generate_v4(),
  playlist_id uuid not null references public.playlists(id) on delete cascade,
  movie_id integer not null,
  title text,
  poster_path text,
  added_by_id uuid not null references public.users(id) on delete cascade,
  added_at timestamptz not null default now()
);

create index playlist_movies_playlist_id on public.playlist_movies(playlist_id);

-- Recommendations
create table public.recommendations (
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

create index recommendations_to_user_id on public.recommendations(to_user_id);
create index recommendations_from_user_id on public.recommendations(from_user_id);

-- RLS: we use the service role key in the backend, so these policies allow the backend full access.
-- If you use anon key from the client, tighten these.
alter table public.users enable row level security;
alter table public.watched_entries enable row level security;
alter table public.playlists enable row level security;
alter table public.playlist_members enable row level security;
alter table public.playlist_movies enable row level security;
alter table public.recommendations enable row level security;

-- Allow service role full access (backend uses service_role key)
create policy "Service role full access users" on public.users for all using (true) with check (true);
create policy "Service role full access watched_entries" on public.watched_entries for all using (true) with check (true);
create policy "Service role full access playlists" on public.playlists for all using (true) with check (true);
create policy "Service role full access playlist_members" on public.playlist_members for all using (true) with check (true);
create policy "Service role full access playlist_movies" on public.playlist_movies for all using (true) with check (true);
create policy "Service role full access recommendations" on public.recommendations for all using (true) with check (true);
