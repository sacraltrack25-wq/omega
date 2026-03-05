# Push deploy packages to GitHub repos
# Usage: .\scripts\push-to-github-repos.ps1
# Prerequisites: run deploy-to-separate-repos.ps1 first

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$deploy = Join-Path $root "deploy"

if (-not (Test-Path $deploy)) {
    Write-Host "Run deploy-to-separate-repos.ps1 first!"
    exit 1
}

$repos = @(
    @{ name = "omega-ai-engine"; url = "https://github.com/sacraltrack25-wq/omega-ai-engine.git" },
    @{ name = "omega-harvesters"; url = "https://github.com/sacraltrack25-wq/omega-harvesters.git" }
)

foreach ($repo in $repos) {
    $dir = Join-Path $deploy $repo.name
    if (-not (Test-Path $dir)) {
        Write-Host "Skip $($repo.name) - folder not found"
        continue
    }
    Write-Host "`n=== Pushing $($repo.name) ===" -ForegroundColor Cyan
    Push-Location $dir
    try {
        if (-not (Test-Path ".git")) {
            git init
            git add .
            git commit -m "Initial deploy for Render"
            git branch -M main
            git remote add origin $repo.url
        } else {
            git add .
            git status
            $changes = git diff --cached --name-only
            if ($changes) {
                git commit -m "Update deploy"
            }
        }
        git push -u origin main
        Write-Host "Pushed $($repo.name) successfully" -ForegroundColor Green
    } catch {
        Write-Host "Error: $_" -ForegroundColor Red
    } finally {
        Pop-Location
    }
}

Write-Host "`nDone. Connect each repo to Render in dashboard.render.com" -ForegroundColor Yellow
