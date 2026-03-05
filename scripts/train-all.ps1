# OMEGA — Автоматическое обучение из Hugging Face
# Запускает train_textnet.py --config без ручного QA.
# Требует: AI Engine (4000), Harvesters не нужны для HF-only.
#
# Использование:
#   .\scripts\train-all.ps1
#   .\scripts\train-all.ps1 -Config custom.yaml
#   .\scripts\train-all.ps1 -Batch 16 -Limit 5000

param(
    [string]$Config = "datasets_config.yaml",
    [int]$Batch = 8,
    [int]$Limit = 0  # 0 = без лимита (из config)
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$harvestersDir = Join-Path $root "services\harvesters"
$configPath = if ([System.IO.Path]::IsPathRooted($Config)) { $Config } else { Join-Path $harvestersDir $Config }

Write-Host "OMEGA — Automated HF Training" -ForegroundColor Cyan
Write-Host "  Config: $configPath" -ForegroundColor Gray
Write-Host "  Batch:  $Batch" -ForegroundColor Gray
Write-Host ""

# 1. Проверка AI Engine
$engineUrl = "http://localhost:4000"
try {
    $r = Invoke-WebRequest -Uri "$engineUrl/health" -Method GET -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    if ($r.StatusCode -ne 200) { throw "status $($r.StatusCode)" }
    Write-Host "[OK] AI Engine: $engineUrl" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] AI Engine not reachable at $engineUrl" -ForegroundColor Red
    Write-Host "  Run: pnpm start:all  (or pnpm --filter @omega/core dev)" -ForegroundColor Yellow
    exit 1
}

# 2. Проверка config
if (-not (Test-Path $configPath)) {
    Write-Host "[FAIL] Config not found: $configPath" -ForegroundColor Red
    exit 1
}

# 3. HF token (опционально, для gated datasets)
$hfToken = $env:HF_TOKEN
if (-not $hfToken) { $hfToken = $env:HUGGING_FACE_HUB_TOKEN }
if ($hfToken) {
    Write-Host "[OK] HF_TOKEN set (for gated datasets)" -ForegroundColor Green
} else {
    Write-Host "[INFO] HF_TOKEN not set (public datasets only)" -ForegroundColor Gray
}

# 4. Запуск обучения
Write-Host ""
Write-Host "Starting training..." -ForegroundColor Yellow
$trainArgs = @("train_textnet.py", "--config", $configPath, "--batch", $Batch)

Push-Location $harvestersDir
try {
    & python $trainArgs
    $exitCode = $LASTEXITCODE
} finally {
    Pop-Location
}

Write-Host ""
if ($exitCode -eq 0) {
    Write-Host "Done. Check Admin Stats: http://localhost:3001/admin/stats" -ForegroundColor Green
} else {
    Write-Host "Training exited with code $exitCode" -ForegroundColor Red
    exit $exitCode
}
