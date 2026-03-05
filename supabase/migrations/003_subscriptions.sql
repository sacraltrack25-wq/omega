-- ─────────────────────────────────────────────────────────────────────────────
-- OMEGA AI — Subscriptions, Conversations & Full Query Logging
-- Migration: 003_subscriptions.sql
--
-- New tables:
--   plans             — тарифные планы (free / pro / pro_unlimited)
--   subscriptions     — подписки пользователей
--   conversations     — сессии чата (группируют запросы)
--
-- Extended tables:
--   profiles          — добавлен current_plan
--   omega_queries     — добавлены conversation_id, recall_used, recall_score,
--                       knowledge_recall, is_admin_query, recall_top_source
--
-- Functions:
--   get_user_plan(user_id)      — текущий активный план пользователя
--   count_queries_today(uid)    — кол-во запросов за сегодня
--   check_rate_limit(uid)       — разрешён ли следующий запрос
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── 1. Plans ─────────────────────────────────────────────────────────────────
-- Справочник тарифов. Меняется только через admin SQL.

create table if not exists public.plans (
  id                uuid        primary key default uuid_generate_v4(),
  name              text        not null unique,            -- 'free' | 'pro' | 'pro_unlimited'
  display_name      text        not null,
  description       text        not null default '',
  price_usd         numeric(10,2) not null default 0,
  -- -1 = unlimited
  queries_per_day   integer     not null default 10,
  queries_per_month integer     not null default 100,
  -- which AI networks are accessible
  networks          text[]      not null default '{text}',
  -- extra features as jsonb flags
  features          jsonb       not null default '{}',
  is_active         boolean     not null default true,
  sort_order        integer     not null default 0,
  created_at        timestamptz not null default now()
);

-- Seed: Free, Pro, Pro Unlimited
insert into public.plans
  (name, display_name, description, price_usd, queries_per_day, queries_per_month, networks, features, sort_order)
values
  (
    'free',
    'Free',
    'Basic access — try OMEGA AI',
    0.00,
    20,           -- 20 queries / day
    300,          -- 300 / month
    '{text}',
    '{"speed":"standard","history_days":7,"export":false}',
    0
  ),
  (
    'pro',
    'Pro',
    'Full access — all networks, priority processing',
    9.99,
    500,          -- 500 / day
    10000,        -- 10k / month
    '{text,image,video,audio,game}',
    '{"speed":"priority","history_days":365,"export":true,"api_access":true}',
    1
  ),
  (
    'pro_unlimited',
    'Pro Unlimited',
    'Unlimited queries — maximum speed, no limits',
    19.99,
    -1,           -- unlimited
    -1,           -- unlimited
    '{text,image,video,audio,game}',
    '{"speed":"turbo","history_days":365,"export":true,"api_access":true,"priority_gpu":true}',
    2
  )
on conflict (name) do nothing;

-- RLS: only admins can modify plans; anyone can read
alter table public.plans enable row level security;

create policy "Anyone can read plans"
  on public.plans for select
  using (true);

create policy "Admins can manage plans"
  on public.plans for all
  using (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));


-- ─── 2. Subscriptions ─────────────────────────────────────────────────────────

create table if not exists public.subscriptions (
  id                uuid        primary key default uuid_generate_v4(),
  user_id           uuid        not null references public.profiles(id) on delete cascade,
  plan_id           uuid        not null references public.plans(id),
  status            text        not null default 'active'
                                check (status in ('active','cancelled','expired','trial','paused')),
  -- billing period
  started_at        timestamptz not null default now(),
  expires_at        timestamptz,                           -- null = no expiry (lifetime)
  cancelled_at      timestamptz,
  -- payment
  payment_provider  text,                                  -- 'stripe' | 'manual' | null
  payment_ref       text,                                  -- Stripe subscription ID
  -- metadata
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger set_subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

create index on public.subscriptions (user_id);
create index on public.subscriptions (status);
create index on public.subscriptions (expires_at);

alter table public.subscriptions enable row level security;

create policy "Users see own subscriptions"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create policy "Admins manage all subscriptions"
  on public.subscriptions for all
  using (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));


-- ─── 3. Extend profiles — current_plan (denormalised for fast reads) ──────────

alter table public.profiles
  add column if not exists current_plan  text not null default 'free',
  add column if not exists plan_expires  timestamptz,
  add column if not exists query_count   bigint not null default 0;   -- lifetime total


-- Auto-assign free plan on signup (update the existing trigger)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  free_plan_id uuid;
begin
  -- Insert profile
  insert into public.profiles (id, email, full_name, avatar_url, current_plan)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    'free'
  )
  on conflict (id) do nothing;

  -- Create free subscription
  select id into free_plan_id from public.plans where name = 'free' limit 1;
  if free_plan_id is not null then
    insert into public.subscriptions (user_id, plan_id, status, expires_at)
    values (new.id, free_plan_id, 'active', null)
    on conflict do nothing;
  end if;

  return new;
end;
$$;


-- ─── 4. Conversations ─────────────────────────────────────────────────────────
-- Группируют запросы omega_queries в сессии (как чат в Gemini/GPT)

create table if not exists public.conversations (
  id              uuid        primary key default uuid_generate_v4(),
  user_id         uuid        not null references public.profiles(id) on delete cascade,
  network_type    text        not null default 'text',
  title           text        not null default 'New conversation',
  message_count   integer     not null default 0,
  is_admin        boolean     not null default false,  -- admin test sessions
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);

create trigger set_conversations_updated_at
  before update on public.conversations
  for each row execute function public.set_updated_at();

create index on public.conversations (user_id);
create index on public.conversations (last_message_at desc);
create index on public.conversations (network_type);

alter table public.conversations enable row level security;

create policy "Users see own conversations"
  on public.conversations for select
  using (auth.uid() = user_id);

create policy "Users create own conversations"
  on public.conversations for insert
  with check (auth.uid() = user_id);

create policy "Users update own conversations"
  on public.conversations for update
  using (auth.uid() = user_id);

create policy "Users delete own conversations"
  on public.conversations for delete
  using (auth.uid() = user_id);

create policy "Admins see all conversations"
  on public.conversations for select
  using (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));


-- ─── 5. Extend omega_queries ──────────────────────────────────────────────────

alter table public.omega_queries
  add column if not exists conversation_id  uuid references public.conversations(id) on delete set null,
  add column if not exists recall_used      boolean     not null default false,
  add column if not exists recall_score     float       not null default 0,   -- best gX resonance [0..1]
  add column if not exists recall_top_source text,                             -- source of best match
  add column if not exists knowledge_recall  jsonb,                            -- top-K matches [{key,score,resonanceScore,source,raw}]
  add column if not exists is_admin_query   boolean     not null default false,
  add column if not exists tokens_estimate  integer     not null default 0;   -- rough token count

create index if not exists omega_queries_conversation_idx on public.omega_queries (conversation_id);
create index if not exists omega_queries_recall_idx on public.omega_queries (recall_used);

-- Trigger: increment conversation.message_count and update last_message_at
create or replace function public.on_query_insert()
returns trigger language plpgsql security definer
as $$
begin
  -- Update conversation stats
  if new.conversation_id is not null then
    update public.conversations
    set message_count   = message_count + 1,
        last_message_at = now(),
        updated_at      = now()
    where id = new.conversation_id;
  end if;

  -- Increment profile lifetime query counter
  update public.profiles
  set query_count = query_count + 1
  where id = new.user_id;

  return new;
end;
$$;

drop trigger if exists on_omega_query_insert on public.omega_queries;
create trigger on_omega_query_insert
  after insert on public.omega_queries
  for each row execute function public.on_query_insert();


-- ─── 6. Helper functions ──────────────────────────────────────────────────────

-- Returns the name of user's current active plan
create or replace function public.get_user_plan(p_user_id uuid)
returns text language sql stable security definer
as $$
  select p.name
  from public.subscriptions s
  join public.plans p on p.id = s.plan_id
  where s.user_id = p_user_id
    and s.status = 'active'
    and (s.expires_at is null or s.expires_at > now())
  order by p.sort_order desc
  limit 1;
$$;

-- Returns number of queries user made today
create or replace function public.count_queries_today(p_user_id uuid)
returns bigint language sql stable security definer
as $$
  select count(*)
  from public.omega_queries
  where user_id = p_user_id
    and created_at >= current_date
    and created_at <  current_date + interval '1 day'
    and is_admin_query = false;
$$;

-- Returns number of queries user made this month
create or replace function public.count_queries_month(p_user_id uuid)
returns bigint language sql stable security definer
as $$
  select count(*)
  from public.omega_queries
  where user_id   = p_user_id
    and created_at >= date_trunc('month', now())
    and is_admin_query = false;
$$;

-- Returns true if user is allowed to make another query right now
create or replace function public.check_rate_limit(p_user_id uuid)
returns jsonb language plpgsql stable security definer
as $$
declare
  plan_name         text;
  plan_qpd          integer;
  plan_qpm          integer;
  queries_today     bigint;
  queries_month     bigint;
  allowed           boolean;
begin
  -- Get active plan
  select p.name, p.queries_per_day, p.queries_per_month
  into plan_name, plan_qpd, plan_qpm
  from public.subscriptions s
  join public.plans p on p.id = s.plan_id
  where s.user_id = p_user_id
    and s.status = 'active'
    and (s.expires_at is null or s.expires_at > now())
  order by p.sort_order desc
  limit 1;

  if plan_name is null then
    plan_name := 'free';
    plan_qpd  := 20;
    plan_qpm  := 300;
  end if;

  -- Unlimited plan — always allowed
  if plan_qpd = -1 then
    return jsonb_build_object(
      'allowed', true,
      'plan', plan_name,
      'queries_today', 0,
      'limit_day', -1,
      'queries_month', 0,
      'limit_month', -1
    );
  end if;

  queries_today := public.count_queries_today(p_user_id);
  queries_month := public.count_queries_month(p_user_id);

  allowed := (queries_today < plan_qpd) and (plan_qpm = -1 or queries_month < plan_qpm);

  return jsonb_build_object(
    'allowed',        allowed,
    'plan',           plan_name,
    'queries_today',  queries_today,
    'limit_day',      plan_qpd,
    'queries_month',  queries_month,
    'limit_month',    plan_qpm
  );
end;
$$;


-- ─── 7. Useful views ──────────────────────────────────────────────────────────

-- Admin overview: users + their current plan
create or replace view public.admin_users_view as
select
  pr.id,
  pr.email,
  pr.full_name,
  pr.avatar_url,
  pr.role,
  pr.current_plan,
  pr.plan_expires,
  pr.query_count,
  pr.created_at,
  coalesce(public.count_queries_today(pr.id), 0)  as queries_today,
  coalesce(public.count_queries_month(pr.id), 0)  as queries_month,
  s.status  as subscription_status,
  s.expires_at as subscription_expires
from public.profiles pr
left join public.subscriptions s
  on s.user_id = pr.id
  and s.status = 'active'
  and (s.expires_at is null or s.expires_at > now());


-- ─── 8. Trigger: keep profiles.current_plan in sync with subscriptions ────────

create or replace function public.sync_profile_plan()
returns trigger language plpgsql security definer
as $$
declare
  new_plan text;
  new_exp  timestamptz;
begin
  select p.name, s.expires_at
  into new_plan, new_exp
  from public.subscriptions s
  join public.plans p on p.id = s.plan_id
  where s.user_id = new.user_id
    and s.status  = 'active'
    and (s.expires_at is null or s.expires_at > now())
  order by p.sort_order desc
  limit 1;

  if new_plan is null then
    new_plan := 'free';
    new_exp  := null;
  end if;

  update public.profiles
  set current_plan = new_plan,
      plan_expires = new_exp
  where id = new.user_id;

  return new;
end;
$$;

create trigger sync_plan_on_subscription_change
  after insert or update or delete on public.subscriptions
  for each row execute function public.sync_profile_plan();


-- ─── 9. Indexes for performance ───────────────────────────────────────────────

create index if not exists omega_queries_user_date_idx
  on public.omega_queries (user_id, created_at desc);

create index if not exists omega_queries_network_date_idx
  on public.omega_queries (network_type, created_at desc);

create index if not exists subscriptions_user_active_idx
  on public.subscriptions (user_id, status)
  where status = 'active';
