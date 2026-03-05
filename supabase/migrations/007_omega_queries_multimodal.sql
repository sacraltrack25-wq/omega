-- ─────────────────────────────────────────────────────────────────────────────
-- OMEGA AI — omega_queries.multimodal
-- Migration: 007_omega_queries_multimodal.sql
--
-- Добавляет колонку multimodal для статистики доли multimodal-запросов.
-- Используется когда запрос отправлен с multimodal: true (объединение text+image+video+audio).
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.omega_queries
  add column if not exists multimodal boolean not null default false;

create index if not exists omega_queries_multimodal_idx on public.omega_queries (multimodal) where multimodal = true;
