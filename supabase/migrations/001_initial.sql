-- ─────────────────────────────────────────────────────────────────────────────
-- OMEGA AI — Initial Schema
-- Migration: 001_initial.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ─── Profiles ─────────────────────────────────────────────────────────────────
create table public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  email       text unique not null,
  full_name   text,
  avatar_url  text,
  role        text not null default 'user' check (role in ('user', 'admin')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql
as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- RLS
alter table public.profiles enable row level security;
create policy "Users can view own profile"   on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Admins can view all profiles" on public.profiles for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
