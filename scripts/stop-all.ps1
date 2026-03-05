# OMEGA AI - Stop all services
# Kills processes on ports 4000, 3001, 8000

$ports = @(4000, 3000, 3001, 3002, 8000)
$killed = 0

foreach ($port in $ports) {
    $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($conn) {
        $procId = $conn.OwningProcess | Select-Object -First 1
        if ($procId) {
            Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
            Write-Host "Stopped process $procId on port $port" -ForegroundColor Yellow
            $killed++
        }
    }
}

if ($killed -eq 0) {
    Write-Host "No OMEGA processes found on ports 4000, 3000-3002, 8000" -ForegroundColor Gray
} else {
    Write-Host "Stopped $killed process(es)" -ForegroundColor Green
}
