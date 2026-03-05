# Deploy OMEGA AI Engine and Harvesters to separate GitHub repos for Render
# Usage: .\scripts\deploy-to-separate-repos.ps1

$ErrorActionPreference = "Stop"
# Script is in scripts/; root is parent of scripts
$root = Split-Path -Parent $PSScriptRoot
$deploy = Join-Path $root "deploy"

# Clean and create deploy dirs
if (Test-Path $deploy) { Remove-Item $deploy -Recurse -Force }
New-Item -ItemType Directory -Path (Join-Path $deploy "omega-ai-engine") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $deploy "omega-harvesters") -Force | Out-Null

# ── omega-ai-engine ────────────────────────────────────────────────────────────
Write-Host "Preparing omega-ai-engine..."
$aiEngine = Join-Path $deploy "omega-ai-engine"

# Copy core files (exclude node_modules, dist, .env)
Copy-Item (Join-Path $root "core\package.json") $aiEngine
Copy-Item (Join-Path $root "core\tsconfig.json") $aiEngine
Copy-Item (Join-Path $root "core\Dockerfile") $aiEngine
Copy-Item (Join-Path $root "core\src") (Join-Path $aiEngine "src") -Recurse -Force

# render.yaml for single service
@"
services:
  - type: web
    runtime: docker
    name: omega-ai-engine
    dockerfilePath: ./Dockerfile
    healthCheckPath: /health
    envVars:
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_SERVICE_ROLE_KEY
        sync: false
      - key: AI_ENGINE_API_KEY
        sync: false
"@ | Set-Content (Join-Path $aiEngine "render.yaml") -Encoding UTF8

# .env.example
@"
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
AI_ENGINE_API_KEY=generate-a-strong-random-key
"@ | Set-Content (Join-Path $aiEngine ".env.example") -Encoding UTF8

# .gitignore
@"
node_modules/
dist/
.env
.env.local
*.log
.DS_Store
"@ | Set-Content (Join-Path $aiEngine ".gitignore") -Encoding UTF8

# README
@"
# OMEGA AI Engine

gX · Li · Ω core engine. Deploy on Render.

## Render

1. New → Web Service
2. Connect repo: https://github.com/sacraltrack25-wq/omega-ai-engine
3. Root Directory: (leave empty)
4. Dockerfile Path: ./Dockerfile
5. Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, AI_ENGINE_API_KEY
"@ | Set-Content (Join-Path $aiEngine "README.md") -Encoding UTF8

# ── omega-harvesters ───────────────────────────────────────────────────────────
Write-Host "Preparing omega-harvesters..."
$harvesters = Join-Path $deploy "omega-harvesters"

Copy-Item (Join-Path $root "services\harvesters\main.py") $harvesters
Copy-Item (Join-Path $root "services\harvesters\config.py") $harvesters
Copy-Item (Join-Path $root "services\harvesters\train_textnet.py") $harvesters
Copy-Item (Join-Path $root "services\harvesters\encoder_service.py") $harvesters
Copy-Item (Join-Path $root "services\harvesters\requirements.txt") $harvesters
Copy-Item (Join-Path $root "services\harvesters\datasets_config.yaml") $harvesters
Copy-Item (Join-Path $root "services\harvesters\Dockerfile") $harvesters
Copy-Item (Join-Path $root "services\harvesters\harvesters") (Join-Path $harvesters "harvesters") -Recurse -Force

# render.yaml
@"
services:
  - type: web
    runtime: docker
    name: omega-harvesters
    dockerfilePath: ./Dockerfile
    healthCheckPath: /health
    envVars:
      - key: AI_ENGINE_URL
        sync: false
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_SERVICE_ROLE_KEY
        sync: false
      - key: AI_ENGINE_API_KEY
        sync: false
      - key: HF_TOKEN
        sync: false
"@ | Set-Content (Join-Path $harvesters "render.yaml") -Encoding UTF8

# .env.example
@"
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
AI_ENGINE_URL=https://omega-ai-engine.onrender.com
AI_ENGINE_API_KEY=your-api-key
HF_TOKEN=
"@ | Set-Content (Join-Path $harvesters ".env.example") -Encoding UTF8

# .gitignore
@"
__pycache__/
*.pyc
.env
.env.local
*.log
.DS_Store
logs/
"@ | Set-Content (Join-Path $harvesters ".gitignore") -Encoding UTF8

# README
@"
# OMEGA Harvesters

Training and harvesting service. Deploy on Render.

## Render

1. New → Web Service
2. Connect repo: https://github.com/sacraltrack25-wq/omega-harvesters
3. Root Directory: (leave empty)
4. Dockerfile Path: ./Dockerfile
5. Env: AI_ENGINE_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, AI_ENGINE_API_KEY, HF_TOKEN
"@ | Set-Content (Join-Path $harvesters "README.md") -Encoding UTF8

Write-Host ""
Write-Host "Done! Deploy packages in: $deploy"
Write-Host ""
Write-Host "To push to GitHub:"
Write-Host "  cd deploy\omega-ai-engine"
Write-Host "  git init"
Write-Host "  git add ."
Write-Host "  git commit -m 'Initial deploy'"
Write-Host "  git branch -M main"
Write-Host "  git remote add origin https://github.com/sacraltrack25-wq/omega-ai-engine.git"
Write-Host "  git push -u origin main"
Write-Host ""
Write-Host "  cd ..\omega-harvesters"
Write-Host "  git init"
Write-Host "  git add ."
Write-Host "  git commit -m 'Initial deploy'"
Write-Host "  git branch -M main"
Write-Host "  git remote add origin https://github.com/sacraltrack25-wq/omega-harvesters.git"
Write-Host "  git push -u origin main"
