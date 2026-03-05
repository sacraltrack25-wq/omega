# OMEGA — Деплой

## Vercel (Web)

1. Подключите репозиторий https://github.com/sacraltrack25-wq/omega к Vercel.
2. **Root Directory:** оставьте пустым (корень репо).
3. Framework: Next.js (next добавлен в корневой package.json для детекции).
4. Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL` — URL Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — anon key
   - `SUPABASE_SERVICE_ROLE_KEY` — service role key
   - `AI_ENGINE_URL` — URL AI Engine на Render (например https://omega-unified.onrender.com)
   - `HARVESTER_URL` — тот же URL (unified) или отдельный Harvesters
   - `AI_ENGINE_API_KEY` — ключ API
   - `NEXTAUTH_URL` — URL Vercel (например https://omega.vercel.app)
   - `NEXTAUTH_SECRET` — секрет NextAuth
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — для OAuth

## Render (Backend — AI Engine + Harvesters + Encoder)

1. New → Web Service.
2. Подключите репо omega.
3. Runtime: Docker.
4. Dockerfile Path: `./Dockerfile`.
5. Environment Variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `AI_ENGINE_API_KEY`
   - `ENCODER_SERVICE_URL` = `http://localhost:8000/encoder` (уже в render.yaml)
   - `HF_TOKEN` — для Hugging Face (опционально)

После деплоя Render скопируйте URL сервиса и укажите его в Vercel как `AI_ENGINE_URL` и `HARVESTER_URL`.
