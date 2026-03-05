# OMEGA — Mirror AI System

> A novel artificial intelligence built on the **Mirror Principle** — gX · Li · Ω Architecture.

---

## Core Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                          OMEGA AI (Ω)                                │
│                                                                      │
│  ┌─────────────┐    ┌──────────────────────┐    ┌────────────────┐  │
│  │  gX Neurons │───▶│    Li  Centers       │───▶│   Ω  Omega     │  │
│  │             │    │                      │    │                │  │
│  │ const gX1   │    │  let Li1 ↔ let Li2   │    │  let Omega     │  │
│  │    ↕mirror  │    │  (mirror pair)       │    │  (auto-mirror) │  │
│  │ const gX2   │    │  many cores, grows   │    │  truth output  │  │
│  └─────────────┘    └──────────────────────┘    └────────────────┘  │
│       1 bit = 1 gX       data + knowledge           final answer    │
└──────────────────────────────────────────────────────────────────────┘
```

---

## The Mirror Principle

### gX — Mirror Neurons
- **1 bit = 1 gX** — the most fundamental unit of computation
- `const gX1` — primary state (immutable)
- `const gX2` — mirror state = bitwise complement (immutable)
- gX1 and gX2 are always **constants** — a permanent mirror pair
- Error-correction is built-in: when gX1 fires, gX2 cancels noise

### Li — Processing Centers
- Multiple cores running in parallel
- `let Li1` — primary processing center (mutable, **grows with data**)
- `let Li2` — mirror processing center (mirrors Li1)
- Li centers grow as data flows in (web, images, video, audio streams)
- Consensus of Li1 + Li2 eliminates processing bias

### Ω Omega — Truth Center
- `let Omega` — auto-mirroring truth synthesizer
- Collects outputs from all active Li pairs participating in the request
- **Self-validates**: Ω(Ω(x)) = Ω(x) — convergence equals truth
- Final `const` output: the verified answer

---

## 5 Neural Networks

| Network    | Purpose                                              | Key Parameters              |
|------------|------------------------------------------------------|-----------------------------|
| **TextNet**  | Language, reasoning, text generation               | context_window, entropy     |
| **ImageNet** | Image understanding + generation                  | spatial_resolution, depth   |
| **VideoNet** | Video processing, temporal understanding          | temporal_depth, frame_rate  |
| **AudioNet** | Audio, speech recognition, music                  | frequency_resolution, bands |
| **GameNet**  | Ultra-realistic game AI, physics simulation        | realism_level, physics_depth|

---

## Tech Stack

| Layer         | Technology                          |
|---------------|-------------------------------------|
| Frontend      | Next.js 14, Tailwind CSS (Vercel)   |
| Database      | Supabase (PostgreSQL)               |
| Auth          | Supabase Auth + Google OAuth        |
| AI Engine     | TypeScript — gX · Li · Ω           |
| Harvesters    | Python 3.11 (Render)               |
| Containers    | Docker + Docker Compose             |
| GPU Scale     | RunPod (on demand)                  |

---

## Project Structure

```
omega/
├── core/                     # gX · Li · Ω engine (TypeScript)
│   └── src/
│       ├── neurons/          # gX Mirror Neurons  (const gX1 ↔ const gX2)
│       ├── centers/          # Li Processing Centers (let Li1 ↔ let Li2)
│       ├── omega/            # Ω Truth Center (auto-mirroring)
│       ├── networks/         # TextNet · ImageNet · VideoNet · AudioNet · GameNet
│       └── training/         # All 35 parameters & regulators
├── apps/
│   └── web/                  # Next.js frontend + API (→ Vercel)
├── services/
│   └── harvesters/           # Python data collectors (→ Render)
├── supabase/
│   └── migrations/           # SQL schemas
└── docs/                     # Full documentation
```

---

## Quick Start

### Prerequisites
- Node.js 20+, pnpm 9+
- Docker & Docker Compose
- Python 3.11+
- Supabase project + Google OAuth app

### 1 — Install
```bash
pnpm install
```

### 2 — Configure
```bash
cp .env.example .env.local
# Edit .env.local with your credentials
```

### 3 — Database
```bash
npx supabase db push
```

### 4 — Development
```bash
pnpm dev
```

### 5 — Docker (Production)
```bash
docker-compose up -d
```

---

## Documentation

- [Architecture](docs/architecture.md)
- [gX · Li · Ω System](docs/gx-li-omega.md)
- [Training Parameters](docs/training-parameters.md)
- [API Reference](docs/api.md)
- [Deployment Guide](docs/deployment.md)
