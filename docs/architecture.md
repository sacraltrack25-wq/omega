# OMEGA AI — System Architecture

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                                │
│                    Next.js Web App (Vercel)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │  Chat    │  │  Images  │  │  Video   │  │  Admin   │  ...       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘           │
└───────┼─────────────┼─────────────┼──────────────┼─────────────────┘
        │  API routes │             │              │
        ▼             ▼             ▼              ▼
┌───────────────────────────────────────────────────────────────────┐
│              AI Engine  (Docker / RunPod)  :4000                   │
│                                                                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ TextNet  │  │ImageNet  │  │VideoNet  │  │AudioNet  │ GameNet  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘          │
│       │              │              │              │               │
│       └──────────────┴──────────────┴──────────────┘               │
│                              │                                     │
│                    ┌─────────▼─────────┐                           │
│                    │   Ω  Omega Core   │                           │
│                    │  (truth synthesis)│                           │
│                    └─────────┬─────────┘                           │
│                              │                                     │
│              ┌───────────────┼───────────────┐                     │
│              ▼               ▼               ▼                     │
│        LiCluster[0]    LiCluster[1]    LiCluster[2]  ...           │
│       Li1 ↔ Li2       Li3 ↔ Li4       Li5 ↔ Li6                   │
│              │                                                     │
│         NeuronLayer(gX neurons)                                    │
└───────────────────────────────────────────────────────────────────┘
        │                              ▲
        ▼                              │ /learn
┌──────────────┐              ┌────────────────────┐
│  Supabase    │              │ Harvesters (Render) │
│  PostgreSQL  │◀─────────────│  Web / Image /     │
│  Auth + Data │              │  Audio / Video      │
└──────────────┘              └────────────────────┘
```

---

## Services

### 1. Next.js Web App (→ Vercel)
- **Public landing page** — discover OMEGA, sign in
- **Dashboard** — 5 network interfaces (Chat, Images, Video, Audio, Games)
- **Admin panel** — neurons, training parameters, statistics, harvesters
- **API routes** — proxy queries to AI Engine, auth with Supabase
- **Auth** — Supabase Auth + Google OAuth

### 2. AI Engine (→ Docker / RunPod)
- **Express API** on port 4000
- **MirrorAI singleton** — owns all 5 networks + Omega
- Endpoints: `POST /query`, `POST /learn`, `POST /consolidate`, `GET /status`
- Protected by `x-api-key` header
- **RunPod integration** — when GPU resources are needed, deploy this container on RunPod

### 3. Harvesters (→ Render / Docker)
- **FastAPI** on port 8000
- Receives jobs from Admin panel
- 4 harvester types: Web, Image, Audio, Video
- Encodes content → feeds to AI Engine `/learn`
- Tracks job status in Supabase

### 4. Supabase
- **PostgreSQL** database (hosted)
- **Auth** — Google OAuth via Supabase Auth
- **Tables** — profiles, networks, li_centers, gx_neurons, omega_queries, training_sessions, harvester_jobs, network_configs

---

## Data Flow

### Inference (query → answer)
```
Browser → Next.js API route → AI Engine /query
       → MirrorAI.query(type, input)
       → Network.encode(input) → vector
       → LiClusters.process(vector) → cluster results
       → Omega.emit(results) → self-validate → OmegaTruth
       ← Next.js saves to Supabase ← Browser
```

### Training (data collection)
```
Admin Panel → Harvester Service /harvest
           → Harvester.run(url)
           → fetch + encode content
           → AI Engine /learn (per item)
           → Li.learn(key, vector, source)
           → Li grows: knowledge + neurons
```

---

## Security

- All AI Engine calls require `x-api-key`
- All Next.js routes require Supabase session
- Admin routes additionally require `role = 'admin'` in profiles table
- Row Level Security (RLS) on all Supabase tables
- Docker secrets for sensitive env vars
