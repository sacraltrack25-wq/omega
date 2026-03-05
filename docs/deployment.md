# Deployment Guide

## Prerequisites

- Supabase project (free tier OK for start)
- Google Cloud project with OAuth credentials
- Vercel account (frontend)
- Docker host or Render account (AI engine + harvesters)
- (Later) RunPod account for GPU inference

---

## 1 — Supabase Setup

1. Create a new Supabase project at https://supabase.com
2. Run migrations:
   ```bash
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   ```
3. In Supabase Dashboard → Authentication → Providers → Enable Google
4. Add your Google OAuth credentials (see step 2)
5. Set Redirect URL to `https://your-domain.vercel.app/auth/callback`

---

## 2 — Google OAuth

1. Go to https://console.cloud.google.com
2. Create OAuth 2.0 credentials
3. Authorized redirect URIs:
   - `https://your-project.supabase.co/auth/v1/callback`
   - `http://localhost:3000/auth/callback` (dev)
4. Copy Client ID + Secret to Supabase Auth settings

---

## 3 — Deploy Frontend (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# From apps/web/
vercel --prod
```

Set environment variables in Vercel dashboard:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
AI_ENGINE_URL=https://your-ai-engine.render.com
AI_ENGINE_API_KEY=...
```

---

## 4 — Deploy AI Engine (Docker / Render)

### Option A: Render
1. Create a new Web Service on Render
2. Point to `core/`
3. Set build command: `npm install && npm run build`
4. Set start command: `node dist/server.js`
5. Add all env vars

### Option B: Docker
```bash
cd core
docker build -t omega-ai-engine .
docker run -p 4000:4000 --env-file .env omega-ai-engine
```

### Option C: Docker Compose (full stack)
```bash
# From root
docker-compose up -d
```

---

## 5 — Deploy Harvesters (Render)

1. Create a new Web Service on Render
2. Point to `services/harvesters/`
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn main:app --host 0.0.0.0 --port 8000`
5. Add env vars: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `AI_ENGINE_URL`, `AI_ENGINE_API_KEY`

---

## 6 — Set Admin User

After first login with Google:
```sql
-- Run in Supabase SQL editor
UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
```

---

## 7 — RunPod (GPU Scale-up)

When you need GPU resources for heavy inference:

1. Build and push AI engine Docker image to Docker Hub:
   ```bash
   docker build -t yourhub/omega-ai-engine core
   docker push yourhub/omega-ai-engine
   ```

2. Create a RunPod template using your image
3. Add GPU pod (A100/H100 for heavy workloads)
4. Expose port 4000
5. Update `AI_ENGINE_URL` in your Vercel env vars

Uncomment the GPU section in `docker-compose.yml`:
```yaml
deploy:
  resources:
    reservations:
      devices:
        - driver: nvidia
          count: all
          capabilities: [gpu]
```

---

## Environment Variable Summary

| Variable | Service | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Web | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Web | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Web, Engine, Harvesters | Service role key (admin access) |
| `AI_ENGINE_URL` | Web | AI Engine base URL |
| `AI_ENGINE_API_KEY` | Web, Engine, Harvesters | Shared secret key |
| `SUPABASE_URL` | Engine, Harvesters | Same as NEXT_PUBLIC_SUPABASE_URL |
| `PORT` | Engine | Server port (default: 4000) |

---

## Health Checks

- AI Engine: `GET /health`
- Harvesters: `GET /health`
- Web: Vercel handles automatically
