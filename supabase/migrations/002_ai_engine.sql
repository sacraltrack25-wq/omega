-- ─────────────────────────────────────────────────────────────────────────────
-- OMEGA AI — AI Engine Schema
-- Migration: 002_ai_engine.sql
-- Tables: networks, li_centers, gx_neurons, omega_queries,
--         training_sessions, harvester_jobs, network_configs
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Networks (5 neural networks) ────────────────────────────────────────────
create table public.networks (
  id              uuid primary key default uuid_generate_v4(),
  type            text not null unique check (type in ('text','image','video','audio','game')),
  cluster_count   integer not null default 3,
  total_neurons   bigint  not null default 0,
  total_knowledge bigint  not null default 0,
  status          text    not null default 'idle' check (status in ('active','training','idle','error')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create trigger set_networks_updated_at before update on public.networks
  for each row execute function public.set_updated_at();

-- Seed initial 5 networks
insert into public.networks (type, status) values
  ('text',  'active'),
  ('image', 'active'),
  ('video', 'active'),
  ('audio', 'active'),
  ('game',  'active');

-- ─── Li Centers ───────────────────────────────────────────────────────────────
-- Each Li center is part of a mirror pair (Li1 ↔ Li2)
create table public.li_centers (
  id               uuid primary key default uuid_generate_v4(),
  name             text not null,
  network_type     text not null references public.networks(type) on delete cascade,
  mirror_id        uuid references public.li_centers(id),   -- mirror partner
  layer_count      integer not null default 0,
  neuron_count     bigint  not null default 0,
  knowledge_size   bigint  not null default 0,
  avg_resonance    float   not null default 0,
  processing_count bigint  not null default 0,
  is_primary       boolean not null default true,           -- true=Li1, false=Li2
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create trigger set_li_centers_updated_at before update on public.li_centers
  for each row execute function public.set_updated_at();
create index on public.li_centers (network_type);
create index on public.li_centers (mirror_id);

alter table public.li_centers enable row level security;
create policy "Admins only" on public.li_centers using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- ─── gX Neurons ──────────────────────────────────────────────────────────────
-- Snapshot table for neuron states (not live, updated by sync job)
create table public.gx_neurons (
  id               uuid primary key default uuid_generate_v4(),
  name             text not null,
  gx1_state        smallint not null check (gx1_state in (0,1)),
  gx2_state        smallint not null check (gx2_state in (0,1)),  -- always complement of gx1
  layer_index      integer not null default 0,
  position         integer not null default 0,
  activations      bigint  not null default 0,
  resonance_score  float   not null default 0,
  network_id       uuid not null references public.networks(id) on delete cascade,
  li_center_id     uuid references public.li_centers(id),
  created_at       timestamptz not null default now()
);
create index on public.gx_neurons (network_id);
create index on public.gx_neurons (li_center_id);

alter table public.gx_neurons enable row level security;
create policy "Admins only" on public.gx_neurons using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- ─── Omega Queries ────────────────────────────────────────────────────────────
-- Every query + Omega truth output logged here
create table public.omega_queries (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  network_type      text not null,
  input             text,
  answer            text,
  confidence        float   not null default 0,
  converged         boolean not null default false,
  iterations        integer not null default 0,
  participating_li  text[]  not null default '{}',
  mirror_agreement  float   not null default 0,
  processing_ms     integer not null default 0,
  created_at        timestamptz not null default now()
);
create index on public.omega_queries (user_id);
create index on public.omega_queries (network_type);
create index on public.omega_queries (created_at desc);

alter table public.omega_queries enable row level security;
create policy "Users see own queries" on public.omega_queries for select using (auth.uid() = user_id);
create policy "Users create own queries" on public.omega_queries for insert with check (auth.uid() = user_id);
create policy "Admins see all" on public.omega_queries for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- ─── Training Sessions ────────────────────────────────────────────────────────
create table public.training_sessions (
  id               uuid primary key default uuid_generate_v4(),
  network_type     text not null,
  parameters       jsonb not null default '{}',
  status           text not null default 'running' check (status in ('running','completed','failed','paused')),
  items_processed  bigint not null default 0,
  metrics          jsonb,
  started_at       timestamptz not null default now(),
  completed_at     timestamptz
);
create index on public.training_sessions (network_type);
create index on public.training_sessions (status);

alter table public.training_sessions enable row level security;
create policy "Admins only" on public.training_sessions using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- ─── Harvester Jobs ───────────────────────────────────────────────────────────
create table public.harvester_jobs (
  id               uuid primary key default uuid_generate_v4(),
  type             text not null,
  source_url       text not null,
  status           text not null default 'queued' check (status in ('queued','running','completed','failed')),
  items_collected  bigint  not null default 0,
  error            text,
  started_at       timestamptz not null default now(),
  completed_at     timestamptz
);
create index on public.harvester_jobs (status);
create index on public.harvester_jobs (type);

alter table public.harvester_jobs enable row level security;
create policy "Admins only" on public.harvester_jobs using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- ─── Network Configs (training parameters) ────────────────────────────────────
create table public.network_configs (
  id           uuid primary key default uuid_generate_v4(),
  network_type text not null unique,
  parameters   jsonb not null default '{}',
  updated_by   uuid references public.profiles(id),
  updated_at   timestamptz not null default now()
);

-- Seed default configs
insert into public.network_configs (network_type, parameters) values
  ('text',  '{"LEARNING_RATE":0.001,"CONTEXT_WINDOW":4096,"ENTROPY_REGULATION":0.5}'),
  ('image', '{"LEARNING_RATE":0.001,"SPATIAL_RESOLUTION":4,"ENTROPY_REGULATION":0.3}'),
  ('video', '{"LEARNING_RATE":0.0005,"TEMPORAL_DEPTH":64,"SPATIAL_RESOLUTION":3}'),
  ('audio', '{"LEARNING_RATE":0.001,"FREQUENCY_RESOLUTION":256,"TEMPORAL_DEPTH":64}'),
  ('game',  '{"LEARNING_RATE":0.0008,"REALISM_LEVEL":3,"SPATIAL_RESOLUTION":4}');

alter table public.network_configs enable row level security;
create policy "Admins can read/write" on public.network_configs using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- ─── API Usage tracking ───────────────────────────────────────────────────────
create table public.api_usage (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  network_type text not null,
  tokens_used  integer not null default 0,
  created_at   timestamptz not null default now()
);
create index on public.api_usage (user_id);
create index on public.api_usage (created_at desc);

alter table public.api_usage enable row level security;
create policy "Users see own usage" on public.api_usage for select using (auth.uid() = user_id);
create policy "Admins see all usage" on public.api_usage for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
