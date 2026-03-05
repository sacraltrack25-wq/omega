-- ─────────────────────────────────────────────────────────────────────────────
-- OMEGA AI — Harvest Log (аудит загрузок данных)
-- Migration: 006_harvest_log.sql
--
-- Таблица harvest_log — лог загрузок из Hugging Face, Wikipedia, URL, JSONL.
-- Используется для аудита, resume при обрыве, статистики.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.harvest_log (
  id            uuid        primary key default uuid_generate_v4(),
  job_id        text        not null unique,
  source_type   text        not null,   -- 'huggingface' | 'wikipedia' | 'url' | 'jsonl'
  source_id     text        not null,   -- 'HuggingFaceFW/fineweb' | url | path
  config        jsonb,                  -- {split, column, limit, filters}
  items_count   integer     not null default 0,
  status        text        not null default 'running',
  started_at    timestamptz not null default now(),
  completed_at  timestamptz,
  error         text,
  checkpoint    jsonb                   -- для resume: {shard, offset, state_dict}
);

create index if not exists harvest_log_source_idx on public.harvest_log (source_type, source_id);
create index if not exists harvest_log_status_idx on public.harvest_log (status);

alter table public.harvest_log enable row level security;

drop policy if exists "Service role full access to harvest_log" on public.harvest_log;
drop policy if exists "Admins can read harvest_log" on public.harvest_log;

create policy "Service role full access to harvest_log"
  on public.harvest_log for all
  using (true)
  with check (true);

create policy "Admins can read harvest_log"
  on public.harvest_log for select
  using (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));
