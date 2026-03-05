# OMEGA — Деплой на Render

## Автодеплой

**render.yaml** в корне репозитория — Blueprint. При push в `main` Render автоматически подтягивает изменения и разворачивает оба сервиса.

## Подключение

### 1. Render Dashboard

1. [dashboard.render.com](https://dashboard.render.com) → **New** → **Blueprint**
2. Подключи GitHub (если ещё не подключён)
3. Выбери репозиторий `sacraltrack25-wo/omega` (или свой)
4. Ветка: `main`
5. Путь к Blueprint: `render.yaml` (по умолчанию в корне)

### 2. Переменные окружения

При первом создании Render попросит заполнить переменные с `sync: false`:

| Переменная | Сервис | Значение |
|------------|--------|----------|
| `SUPABASE_URL` | AI Engine, Harvesters | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | AI Engine, Harvesters | Service role key из Supabase |
| `AI_ENGINE_API_KEY` | AI Engine, Harvesters | Сгенерируй или используй свой |
| `AI_ENGINE_URL` | Harvesters | URL AI Engine (заполнишь после деплоя) |
| `HF_TOKEN` | Harvesters (опционально) | Hugging Face token для gated датасетов |

### 3. После первого деплоя

1. Дождись завершения деплоя AI Engine
2. Скопируй URL (например `https://omega-ai-engine.onrender.com`)
3. В Dashboard → Harvesters → Environment → **AI_ENGINE_URL** — вставь URL
4. Save → Redeploy Harvesters

### 4. Vercel (Web)

В Vercel задай:

- `AI_ENGINE_URL` — URL AI Engine на Render
- `HARVESTER_URL` — URL Harvesters на Render  
- `AI_ENGINE_API_KEY` — тот же ключ, что и в Render

## Сервисы

| Сервис | rootDir | Описание |
|--------|---------|----------|
| omega-ai-engine | core | Node.js, gX-Li-Ω, порт 4000 |
| omega-harvesters | services/harvesters | Python, train_textnet, порт 8000 |

## Free tier

- Сервисы засыпают после ~15 мин без запросов
- Cold start ~30–60 сек
- Для постоянной работы — платный план (Starter)

## Проверка

- AI Engine: `GET https://omega-ai-engine.onrender.com/health`
- Harvesters: `GET https://omega-harvesters.onrender.com/health`
