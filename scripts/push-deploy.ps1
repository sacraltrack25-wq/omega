# Push deploy packages to GitHub (run this in your terminal - will prompt for auth)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$deploy = Join-Path $root "deploy"

Write-Host "Pushing omega-ai-engine..." -ForegroundColor Cyan
Push-Location (Join-Path $deploy "omega-ai-engine")
git push -u origin main
Pop-Location

Write-Host "`nPushing omega-harvesters..." -ForegroundColor Cyan
Push-Location (Join-Path $deploy "omega-harvesters")
git push -u origin main
Pop-Location

Write-Host "`nDone!" -ForegroundColor Green
