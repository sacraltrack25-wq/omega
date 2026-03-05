# OMEGA AI - Start all services
# AI Engine (4000), Web (3001), Harvesters (8000)
# Fix: WorkingDirectory, python -m uvicorn, path escaping

$root = Split-Path -Parent $PSScriptRoot
if (-not $root) { $root = (Get-Location).Path }
$root = $root.TrimEnd('\')
$harvestersDir = Join-Path $root "services\harvesters"
Set-Location $root

Write-Host "OMEGA AI - Starting all services..." -ForegroundColor Cyan
Write-Host "  Root: $root" -ForegroundColor Gray
Write-Host ""

Write-Host "[1/3] AI Engine (port 4000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root'; pnpm --filter @omega/core dev" -WorkingDirectory $root
Start-Sleep -Seconds 2

Write-Host "[2/3] Web (port 3001)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root'; pnpm --filter @omega/web dev" -WorkingDirectory $root
Start-Sleep -Seconds 2

Write-Host "[3/3] Harvesters (port 8000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$harvestersDir'; python -m uvicorn main:app --port 8000 --reload" -WorkingDirectory $harvestersDir
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "Done. Opened 3 terminal windows." -ForegroundColor Green
Write-Host "  AI Engine:  http://localhost:4000"
Write-Host "  Web/Admin:  http://localhost:3001/admin"
Write-Host "  Harvesters: http://localhost:8000"
Write-Host ""
Write-Host "If a window closes immediately, run manually in 3 terminals:" -ForegroundColor Gray
Write-Host "  1. pnpm --filter @omega/core dev" -ForegroundColor Gray
Write-Host "  2. pnpm --filter @omega/web dev" -ForegroundColor Gray
Write-Host "  3. cd services\harvesters; python -m uvicorn main:app --port 8000 --reload" -ForegroundColor Gray
