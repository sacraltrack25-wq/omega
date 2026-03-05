# OMEGA AI — Проверка Admin API и сервисов
# Запуск: .\scripts\test-admin-apis.ps1
# Требует: Web (3001), AI Engine (4000), Harvesters (8000) — хотя бы Web для базовых проверок

$base = "http://localhost:3001"
$engine = "http://localhost:4000"
$harvesters = "http://localhost:8000"
$apiKey = if ($env:AI_ENGINE_API_KEY) { $env:AI_ENGINE_API_KEY } else { "generate-a-strong-random-key" }

$ok = 0
$fail = 0

function Test-Url($name, $url, $headers = @{}) {
    try {
        $params = @{ Uri = $url; UseBasicParsing = $true; TimeoutSec = 5 }
        if ($headers.Count -gt 0) { $params.Headers = $headers }
        $r = Invoke-WebRequest @params -ErrorAction Stop
        Write-Host "  OK  $name" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "  FAIL $name - $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

Write-Host "`n=== OMEGA Admin API Test ===" -ForegroundColor Cyan
Write-Host ""

# Web
Write-Host "[Web :3001]" -ForegroundColor Yellow
if (Test-Url "GET /" "$base/") { $ok++ } else { $fail++ }
if (Test-Url "GET /admin" "$base/admin") { $ok++ } else { $fail++ }
if (Test-Url "GET /api/admin/params" "$base/api/admin/params") { $ok++ } else { $fail++ }
if (Test-Url "GET /api/admin/status" "$base/api/admin/status") { $ok++ } else { $fail++ }
if (Test-Url "GET /api/admin/stats" "$base/api/admin/stats") { $ok++ } else { $fail++ }
if (Test-Url "GET /api/admin/harvest-log" "$base/api/admin/harvest-log") { $ok++ } else { $fail++ }
Write-Host ""

# AI Engine
Write-Host "[AI Engine :4000]" -ForegroundColor Yellow
$h = @{ "x-api-key" = $apiKey }
if (Test-Url "GET /status" "$engine/status" $h) { $ok++ } else { $fail++ }
if (Test-Url "GET /health" "$engine/health" $h) { $ok++ } else { $fail++ }
Write-Host ""

# Harvesters
Write-Host "[Harvesters :8000]" -ForegroundColor Yellow
if (Test-Url "GET /" "$harvesters/") { $ok++ } else { $fail++ }
if (Test-Url "GET /health" "$harvesters/health") { $ok++ } else { $fail++ }
Write-Host ""

Write-Host "=== Result: $ok OK, $fail FAIL ===" -ForegroundColor $(if ($fail -eq 0) { "Green" } else { "Yellow" })
Write-Host ""
