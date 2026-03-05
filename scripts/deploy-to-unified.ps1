# Deploy OMEGA Unified — AI Engine + Harvesters + Encoder in one Render service
# Usage: .\scripts\deploy-to-unified.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$deploy = Join-Path $root "deploy"
$unified = Join-Path $deploy "omega-unified"

# Clean and create
if (Test-Path $unified) { Remove-Item $unified -Recurse -Force }
New-Item -ItemType Directory -Path $unified -Force | Out-Null

Write-Host "Preparing omega-unified..."

# ── core ──────────────────────────────────────────────────────────────────────
$coreDest = Join-Path $unified "core"
New-Item -ItemType Directory -Path $coreDest -Force | Out-Null
Copy-Item (Join-Path $root "core\package.json") $coreDest
Copy-Item (Join-Path $root "core\tsconfig.json") $coreDest
Copy-Item (Join-Path $root "core\src") (Join-Path $coreDest "src") -Recurse -Force

# ── harvesters (with encoder mount in main.py) ──────────────────────────────────
$harvestersDest = Join-Path $unified "harvesters"
New-Item -ItemType Directory -Path $harvestersDest -Force | Out-Null
Copy-Item (Join-Path $root "services\harvesters\main.py") $harvestersDest
Copy-Item (Join-Path $root "services\harvesters\config.py") $harvestersDest
Copy-Item (Join-Path $root "services\harvesters\train_textnet.py") $harvestersDest
Copy-Item (Join-Path $root "services\harvesters\encoder_service.py") $harvestersDest
Copy-Item (Join-Path $root "services\harvesters\requirements.txt") $harvestersDest
Copy-Item (Join-Path $root "services\harvesters\datasets_config.yaml") $harvestersDest
Copy-Item (Join-Path $root "services\harvesters\harvesters") (Join-Path $harvestersDest "harvesters") -Recurse -Force

# ── Dockerfile ─────────────────────────────────────────────────────────────────
@"
# OMEGA Unified — Node AI Engine + Python Harvesters + Encoder
# One container: Node on PORT, Python on 8000 (internal)

FROM node:20-alpine AS node-builder
WORKDIR /app/core
COPY core/package.json core/tsconfig.json ./
COPY core/src ./src
RUN npm install && npm run build

FROM python:3.11-slim
RUN apt-get update && apt-get install -y ffmpeg && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY harvesters/requirements.txt ./harvesters/
RUN pip install --no-cache-dir -r harvesters/requirements.txt
COPY harvesters ./harvesters

COPY --from=node-builder /app/core/dist ./core/dist
COPY --from=node-builder /app/core/node_modules ./core/node_modules
COPY core/package.json ./core/

COPY start.sh /start.sh
RUN chmod +x /start.sh

ENV PORT=4000
EXPOSE 4000 8000
CMD ["/start.sh"]
"@ | Set-Content (Join-Path $unified "Dockerfile") -Encoding UTF8

# ── start.sh ───────────────────────────────────────────────────────────────────
@"
#!/bin/sh
# OMEGA Unified: Harvesters+Encoder on 8000, AI Engine on PORT

export AI_ENGINE_URL="http://localhost:${PORT:-4000}"
cd /app/harvesters && uvicorn main:app --host 0.0.0.0 --port 8000 &
cd /app/core && exec node dist/server.js
"@ | Set-Content (Join-Path $unified "start.sh") -Encoding UTF8 -NoNewline
# Ensure Unix line endings for start.sh
$startSh = Get-Content (Join-Path $unified "start.sh") -Raw
$startSh = $startSh -replace "`r`n", "`n"
[System.IO.File]::WriteAllText((Join-Path $unified "start.sh"), $startSh)

# ── render.yaml ───────────────────────────────────────────────────────────────
@"
services:
  - type: web
    runtime: docker
    name: omega-unified
    dockerfilePath: ./Dockerfile
    healthCheckPath: /health
    envVars:
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_SERVICE_ROLE_KEY
        sync: false
      - key: AI_ENGINE_API_KEY
        sync: false
      - key: ENCODER_SERVICE_URL
        value: http://localhost:8000/encoder
      - key: HF_TOKEN
        sync: false
"@ | Set-Content (Join-Path $unified "render.yaml") -Encoding UTF8

# ── .env.example ──────────────────────────────────────────────────────────────
@"
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
AI_ENGINE_API_KEY=generate-a-strong-random-key
ENCODER_SERVICE_URL=http://localhost:8000/encoder
HF_TOKEN=
"@ | Set-Content (Join-Path $unified ".env.example") -Encoding UTF8

# ── .gitignore ────────────────────────────────────────────────────────────────
@"
node_modules/
dist/
__pycache__/
*.pyc
.env
.env.local
*.log
.DS_Store
logs/
"@ | Set-Content (Join-Path $unified ".gitignore") -Encoding UTF8

# ── README ────────────────────────────────────────────────────────────────────
@"
# OMEGA Unified

AI Engine + Harvesters + Encoder in one Docker container. Deploy on Render.

## Architecture

- Node AI Engine on PORT (Render traffic)
- Python Harvesters + Encoder on 8000 (internal)
- ENCODER_SERVICE_URL=http://localhost:8000/encoder

## Render

1. New → Web Service
2. Connect repo: https://github.com/sacraltrack25-wq/omega-ai-engine
3. Root Directory: (leave empty)
4. Dockerfile Path: ./Dockerfile
5. Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, AI_ENGINE_API_KEY, HF_TOKEN
   (ENCODER_SERVICE_URL is set automatically)
"@ | Set-Content (Join-Path $unified "README.md") -Encoding UTF8

Write-Host ""
Write-Host "Done! Deploy package: $unified"
Write-Host ""
Write-Host "To push to omega-ai-engine:"
Write-Host "  cd deploy\omega-unified"
Write-Host "  git init"
Write-Host "  git add ."
Write-Host "  git commit -m 'Unified deploy: AI Engine + Harvesters + Encoder'"
Write-Host "  git branch -M main"
Write-Host "  git remote add origin https://github.com/sacraltrack25-wq/omega-ai-engine.git"
Write-Host "  git push -u origin main"
Write-Host ""
