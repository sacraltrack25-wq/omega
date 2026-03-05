-- ─────────────────────────────────────────────────────────────────────────────
-- OMEGA AI — Knowledge Persistence + Filters + Feedback
-- Migration: 004_knowledge_filters.sql
--
-- Таблицы:
--   li_knowledge      — постоянное хранилище всех Li знаний (векторы + текст)
--   filters           — гибкие управляемые фильтры (блок, буст, качество, сеть)
--   filter_logs       — лог применения фильтров к запросам
--   answer_feedback   — оценки ответов пользователями (👍/👎)
--
-- После обучения Li: данные сохраняются в li_knowledge
-- При запуске AI Engine: знания загружаются обратно в Li (персистентность)
-- При каждом запросе: фильтры применяются до и после AI обработки
-- Хорошие ответы (rated ↑) повышают strength знания в li_knowledge
-- ─────────────────────────────────────────────────────────────────────────────


-- ─── 1. Li Knowledge — постоянное хранилище знаний ───────────────────────────
-- Каждая запись = один обученный чанк (вектор + gX fingerprint + raw текст)
-- AI Engine пишет сюда при /learn, читает при старте

create table if not exists public.li_knowledge (
  id            uuid        primary key default uuid_generate_v4(),
  key           text        not null,                -- sha256 хэш контента
  network_type  text        not null
                            check (network_type in ('text','image','video','audio','game')),
  -- feature vector as float array (384-dim for sentence-transformers)
  vector        jsonb       not null,                -- number[] хранится как JSON
  -- gX binary activation fingerprint (0/1 per neuron)
  fingerprint   jsonb       not null default '[]',   -- number[]
  -- original content for human-readable recall
  raw           text,
  source        text        not null,
  -- knowledge quality metrics
  strength      float       not null default 0.5,    -- [0..1], grows with use
  access_count  integer     not null default 1,
  last_accessed timestamptz not null default now(),
  -- quality score (0=low, 1=high) set by harvesters
  quality       float       not null default 0.7,
  -- was this entry promoted by positive user feedback?
  boosted       boolean     not null default false,
  boost_score   float       not null default 0,      -- accumulated positive feedback
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  unique (key, network_type)
);

create trigger set_li_knowledge_updated_at
  before update on public.li_knowledge
  for each row execute function public.set_updated_at();

-- Индексы для быстрой загрузки при старте и поиска
create index if not exists li_knowledge_network_idx   on public.li_knowledge (network_type);
create index if not exists li_knowledge_strength_idx  on public.li_knowledge (strength desc);
create index if not exists li_knowledge_boosted_idx   on public.li_knowledge (boosted) where boosted = true;
create index if not exists li_knowledge_source_idx    on public.li_knowledge (source);
create index if not exists li_knowledge_accessed_idx  on public.li_knowledge (last_accessed desc);

alter table public.li_knowledge enable row level security;

-- Только сервис (service_role) пишет напрямую; пользователи не имеют доступа
create policy "Service role full access to li_knowledge"
  on public.li_knowledge for all
  using (true)   -- service_role bypasses RLS
  with check (true);

create policy "Admins can read li_knowledge"
  on public.li_knowledge for select
  using (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));


-- ─── 2. Filters — гибкая система управляемых фильтров ────────────────────────
-- Каждый фильтр — правило применяемое к запросам до/после AI обработки.
-- Типы:
--   content_block   — блокировать запросы содержащие keywords
--   source_block    — игнорировать знания из определённых источников
--   source_boost    — поднимать знания из указанных источников
--   quality_min     — минимальный порог recall_score для ответа
--   network_restrict — разрешить сеть только для определённых планов
--   response_inject  — добавить текст к ответу (disclaimer, ссылки)
--   rate_custom      — кастомный лимит для конкретного user/plan

create table if not exists public.filters (
  id            uuid        primary key default uuid_generate_v4(),
  name          text        not null,
  description   text        not null default '',
  type          text        not null check (type in (
                  'content_block',
                  'source_block',
                  'source_boost',
                  'quality_min',
                  'network_restrict',
                  'response_inject',
                  'rate_custom'
                )),
  -- flexible JSON config, schema depends on type:
  -- content_block:    {"keywords": ["violence","spam"], "match": "any|all"}
  -- source_block:     {"sources": ["reddit.com","4chan.org"]}
  -- source_boost:     {"sources": ["wikipedia.org","arxiv.org"], "multiplier": 1.5}
  -- quality_min:      {"min_resonance": 0.6, "fallback": "no_answer|best_effort"}
  -- network_restrict: {"network": "video", "min_plan": "pro"}
  -- response_inject:  {"text": "...", "position": "before|after"}
  -- rate_custom:      {"user_id": "...", "limit_day": 1000}
  config        jsonb       not null default '{}',
  -- applies to specific network or all (null = all)
  network_type  text        check (network_type in ('text','image','video','audio','game')),
  -- priority: lower number = applied first
  priority      integer     not null default 100,
  is_active     boolean     not null default true,
  -- stats
  apply_count   bigint      not null default 0,
  block_count   bigint      not null default 0,
  created_by    uuid        references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger set_filters_updated_at
  before update on public.filters
  for each row execute function public.set_updated_at();

create index if not exists filters_active_idx    on public.filters (is_active, priority) where is_active = true;
create index if not exists filters_type_idx      on public.filters (type);
create index if not exists filters_network_idx   on public.filters (network_type);

alter table public.filters enable row level security;

-- Anyone can read active filters (needed for client-side checks)
create policy "Anyone can read active filters"
  on public.filters for select
  using (is_active = true);

create policy "Admins manage all filters"
  on public.filters for all
  using (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

-- Seed: базовые фильтры
insert into public.filters (name, description, type, config, priority) values
  (
    'Block low quality responses',
    'Не возвращать ответы с gX резонансом ниже 30%',
    'quality_min',
    '{"min_resonance": 0.30, "fallback": "best_effort"}',
    10
  ),
  (
    'Boost Wikipedia sources',
    'Повысить вес знаний из Википедии в ответах',
    'source_boost',
    '{"sources": ["wikipedia.org", "wikipedia/en", "wikipedia/ru"], "multiplier": 1.4}',
    20
  ),
  (
    'Block spam sources',
    'Игнорировать знания из спам-источников',
    'source_block',
    '{"sources": ["spam.com", "clickbait.net"]}',
    5
  )
on conflict do nothing;


-- ─── 3. Filter Logs — лог применения фильтров ────────────────────────────────
create table if not exists public.filter_logs (
  id            uuid        primary key default uuid_generate_v4(),
  query_id      uuid        references public.omega_queries(id) on delete cascade,
  filter_id     uuid        not null references public.filters(id) on delete cascade,
  action        text        not null check (action in ('blocked','boosted','modified','allowed')),
  details       jsonb,
  created_at    timestamptz not null default now()
);

create index if not exists filter_logs_query_idx  on public.filter_logs (query_id);
create index if not exists filter_logs_filter_idx on public.filter_logs (filter_id);
create index if not exists filter_logs_date_idx   on public.filter_logs (created_at desc);

alter table public.filter_logs enable row level security;
create policy "Admins see filter logs"
  on public.filter_logs for select
  using (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));


-- ─── 4. Answer Feedback — рейтинг ответов пользователями ─────────────────────
-- 👍 = +1, 👎 = -1
-- Влияет на strength в li_knowledge → лучшие знания поднимаются

create table if not exists public.answer_feedback (
  id          uuid        primary key default uuid_generate_v4(),
  query_id    uuid        not null references public.omega_queries(id) on delete cascade,
  user_id     uuid        not null references public.profiles(id) on delete cascade,
  rating      smallint    not null check (rating in (-1, 1)),  -- 👍=1, 👎=-1
  comment     text,
  created_at  timestamptz not null default now(),
  unique (query_id, user_id)   -- один голос на запрос на юзера
);

create index if not exists answer_feedback_query_idx on public.answer_feedback (query_id);
create index if not exists answer_feedback_user_idx  on public.answer_feedback (user_id);

alter table public.answer_feedback enable row level security;

create policy "Users submit own feedback"
  on public.answer_feedback for insert
  with check (auth.uid() = user_id);

create policy "Users see own feedback"
  on public.answer_feedback for select
  using (auth.uid() = user_id);

create policy "Admins see all feedback"
  on public.answer_feedback for select
  using (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));


-- ─── 5. Trigger: обратная связь → strength в li_knowledge ────────────────────
-- Когда пользователь ставит 👍 — strength знания растёт
-- Когда 👎 — strength падает
-- Boosted = true если суммарный рейтинг >= 3

create or replace function public.on_feedback_insert()
returns trigger language plpgsql security definer
as $$
declare
  top_source text;
begin
  -- Find the source of the best recall match for this query
  select recall_top_source into top_source
  from public.omega_queries
  where id = new.query_id;

  if top_source is not null then
    if new.rating = 1 then
      -- 👍: boost strength + boost_score
      update public.li_knowledge
      set
        strength    = least(1.0, strength + 0.05),
        boost_score = boost_score + 1,
        boosted     = (boost_score + 1) >= 3,
        access_count = access_count + 1,
        last_accessed = now()
      where source like '%' || top_source || '%'
        and network_type = (
          select network_type from public.omega_queries where id = new.query_id
        );
    else
      -- 👎: reduce strength
      update public.li_knowledge
      set
        strength    = greatest(0.1, strength - 0.03),
        boost_score = greatest(0, boost_score - 1)
      where source like '%' || top_source || '%'
        and network_type = (
          select network_type from public.omega_queries where id = new.query_id
        );
    end if;
  end if;

  -- Update omega_queries with aggregate feedback score
  update public.omega_queries
  set quality_score = (
    select coalesce(sum(rating), 0)
    from public.answer_feedback
    where query_id = new.query_id
  )
  where id = new.query_id;

  return new;
end;
$$;

create trigger on_answer_feedback_insert
  after insert on public.answer_feedback
  for each row execute function public.on_feedback_insert();


-- ─── 6. Add quality_score to omega_queries ────────────────────────────────────
alter table public.omega_queries
  add column if not exists quality_score  integer not null default 0;   -- sum of ratings (+1/-1)

create index if not exists omega_queries_quality_idx
  on public.omega_queries (quality_score desc)
  where quality_score > 0;


-- ─── 7. Knowledge stats view (для admin панели) ───────────────────────────────
create or replace view public.knowledge_stats as
select
  network_type,
  count(*)                                          as total_entries,
  count(*) filter (where boosted = true)            as boosted_entries,
  round(avg(strength)::numeric, 3)                  as avg_strength,
  round(avg(quality)::numeric, 3)                   as avg_quality,
  sum(access_count)                                 as total_accesses,
  count(*) filter (where raw is not null)           as entries_with_text,
  max(updated_at)                                   as last_updated
from public.li_knowledge
group by network_type;


-- ─── 8. Filter helper function ────────────────────────────────────────────────
-- Возвращает все активные фильтры для данной сети (отсортированные по приоритету)
create or replace function public.get_active_filters(p_network_type text default null)
returns table (
  id uuid, name text, type text, config jsonb, priority integer
) language sql stable security definer
as $$
  select id, name, type, config, priority
  from public.filters
  where is_active = true
    and (network_type is null or network_type = p_network_type)
  order by priority asc;
$$;
