# OMEGA — Сохранить Li в Supabase и перезапустить
# 1. Вызывает POST /dump-li (сохраняет RAM в Supabase)
# 2. Останавливает все сервисы
# 3. Запускает все заново

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$engineUrl = "http://localhost:4000"
$apiKey = $env:AI_ENGINE_API_KEY
if (-not $apiKey) { $apiKey = "generate-a-strong-random-key" }

Write-Host "OMEGA - Save Li and Restart" -ForegroundColor Cyan
Write-Host ""

# 1. Dump Li to Supabase (if AI Engine is running)
Write-Host "[1/3] Saving Li RAM to Supabase..." -ForegroundColor Yellow
try {
    $r = Invoke-WebRequest -Uri "$engineUrl/dump-li" -Method POST `
        -Headers @{ "x-api-key" = $apiKey } -TimeoutSec 10 -UseBasicParsing
    $data = $r.Content | ConvertFrom-Json
    if ($data.ok) {
        Write-Host "  Saved $($data.total) entries" -ForegroundColor Green
    } else {
        Write-Host "  Response: $($r.Content)" -ForegroundColor Gray
    }
} catch {
    Write-Host "  AI Engine not running or error: $_" -ForegroundColor Gray
}

# 2. Stop all
Write-Host ""
Write-Host "[2/3] Stopping services..." -ForegroundColor Yellow
Push-Location $root
try {
    pnpm stop:all 2>$null
    Start-Sleep -Seconds 2
} finally { Pop-Location }

# 3. Start all
Write-Host ""
Write-Host "[3/3] Starting services..." -ForegroundColor Yellow
Push-Location $root
try {
    pnpm start:all
} finally { Pop-Location }

Write-Host ""
Write-Host "Done" -ForegroundColor Green
