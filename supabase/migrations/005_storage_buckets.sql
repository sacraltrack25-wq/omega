-- ─────────────────────────────────────────────────────────────────────────────
-- OMEGA AI — Supabase Storage Buckets + Attachments + Curated Answers
-- Migration: 005_storage_buckets.sql
--
-- Idempotent: можно запускать повторно — DROP IF EXISTS перед каждым CREATE
-- ─────────────────────────────────────────────────────────────────────────────


-- ─── 1. Бакеты ───────────────────────────────────────────────────────────────
-- on conflict (id) do nothing — безопасно при повторном запуске

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'avatars', 'avatars', true,
    2097152,
    array['image/jpeg','image/png','image/webp','image/gif']
  ),
  (
    'media', 'media', false,
    524288000,
    array[
      'image/jpeg','image/png','image/webp','image/gif','image/bmp','image/tiff',
      'video/mp4','video/webm','video/ogg','video/quicktime','video/x-msvideo',
      'audio/mpeg','audio/wav','audio/ogg','audio/webm','audio/flac','audio/aac',
      'application/pdf','text/plain','text/csv','application/json'
    ]
  ),
  (
    'training-data', 'training-data', false,
    1073741824,
    array['application/json','text/plain','text/csv','application/jsonl','application/octet-stream']
  ),
  (
    'knowledge-export', 'knowledge-export', false,
    2147483648,
    array['application/json','application/octet-stream']
  )
on conflict (id) do nothing;


-- ─── 2. RLS: бакет avatars ────────────────────────────────────────────────────

drop policy if exists "Public read avatars"       on storage.objects;
drop policy if exists "Users upload own avatar"   on storage.objects;
drop policy if exists "Users update own avatar"   on storage.objects;
drop policy if exists "Users delete own avatar"   on storage.objects;

create policy "Public read avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users upload own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (string_to_array(name, '/'))[1]
  );

create policy "Users update own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (string_to_array(name, '/'))[1]
  );

create policy "Users delete own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (string_to_array(name, '/'))[1]
  );


-- ─── 3. RLS: бакет media ─────────────────────────────────────────────────────
-- Структура: media/{user_id}/{network_type}/{filename}

drop policy if exists "Users read own media"    on storage.objects;
drop policy if exists "Users upload own media"  on storage.objects;
drop policy if exists "Users delete own media"  on storage.objects;
drop policy if exists "Admins read all media"   on storage.objects;

create policy "Users read own media"
  on storage.objects for select
  using (
    bucket_id = 'media'
    and auth.uid()::text = (string_to_array(name, '/'))[1]
  );

create policy "Users upload own media"
  on storage.objects for insert
  with check (
    bucket_id = 'media'
    and auth.uid()::text = (string_to_array(name, '/'))[1]
  );

create policy "Users delete own media"
  on storage.objects for delete
  using (
    bucket_id = 'media'
    and auth.uid()::text = (string_to_array(name, '/'))[1]
  );

create policy "Admins read all media"
  on storage.objects for select
  using (
    bucket_id = 'media'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );


-- ─── 4. RLS: бакет training-data ─────────────────────────────────────────────
-- Только admins читают/пишут; service_role обходит RLS автоматически

drop policy if exists "Admins read training data"   on storage.objects;
drop policy if exists "Admins write training data"  on storage.objects;
drop policy if exists "Admins delete training data" on storage.objects;

create policy "Admins read training data"
  on storage.objects for select
  using (
    bucket_id = 'training-data'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins write training data"
  on storage.objects for insert
  with check (
    bucket_id = 'training-data'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins delete training data"
  on storage.objects for delete
  using (
    bucket_id = 'training-data'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );


-- ─── 5. RLS: бакет knowledge-export ──────────────────────────────────────────

drop policy if exists "Admins read knowledge exports" on storage.objects;

create policy "Admins read knowledge exports"
  on storage.objects for select
  using (
    bucket_id = 'knowledge-export'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );


-- ─── 6. Таблица query_attachments ────────────────────────────────────────────
-- Прикреплённые медиафайлы к запросам пользователей

create table if not exists public.query_attachments (
  id           uuid        primary key default uuid_generate_v4(),
  query_id     uuid        references public.omega_queries(id) on delete cascade,
  user_id      uuid        not null references public.profiles(id) on delete cascade,
  network_type text        not null check (network_type in ('text','image','video','audio','game')),
  bucket       text        not null default 'media',
  path         text        not null,
  filename     text        not null,
  mime_type    text        not null,
  size_bytes   bigint      not null default 0,
  processed    boolean     not null default false,
  vector_key   text,
  created_at   timestamptz not null default now()
);

create index if not exists query_attachments_query_idx   on public.query_attachments (query_id);
create index if not exists query_attachments_user_idx    on public.query_attachments (user_id);
create index if not exists query_attachments_network_idx on public.query_attachments (network_type);

alter table public.query_attachments enable row level security;

drop policy if exists "Users see own attachments"    on public.query_attachments;
drop policy if exists "Users upload own attachments" on public.query_attachments;
drop policy if exists "Admins see all attachments"   on public.query_attachments;

create policy "Users see own attachments"
  on public.query_attachments for select
  using (auth.uid() = user_id);

create policy "Users upload own attachments"
  on public.query_attachments for insert
  with check (auth.uid() = user_id);

create policy "Admins see all attachments"
  on public.query_attachments for select
  using (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));


-- ─── 7. Таблица curated_answers ──────────────────────────────────────────────
-- Администратор помечает лучшие ответы → идут в обучение

create table if not exists public.curated_answers (
  id              uuid        primary key default uuid_generate_v4(),
  network_type    text        not null,
  question        text        not null,
  answer          text        not null,
  source          text        not null default 'manual',
  tags            text[]      not null default '{}',
  quality_score   float       not null default 1.0,
  origin_query_id uuid        references public.omega_queries(id) on delete set null,
  export_path     text,
  created_by      uuid        references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Trigger (создаём только если ещё нет)
do $$ begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'set_curated_answers_updated_at'
  ) then
    create trigger set_curated_answers_updated_at
      before update on public.curated_answers
      for each row execute function public.set_updated_at();
  end if;
end $$;

create index if not exists curated_answers_network_idx on public.curated_answers (network_type);
create index if not exists curated_answers_tags_idx    on public.curated_answers using gin (tags);

alter table public.curated_answers enable row level security;

drop policy if exists "Admins manage curated answers"  on public.curated_answers;
drop policy if exists "Anyone can read curated answers" on public.curated_answers;

create policy "Admins manage curated answers"
  on public.curated_answers for all
  using (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

create policy "Anyone can read curated answers"
  on public.curated_answers for select
  using (true);
