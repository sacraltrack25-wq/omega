@echo off
REM OMEGA AI — Запуск всех сервисов
cd /d "%~dp0.."

echo OMEGA AI — Starting all services...
echo.

start "OMEGA AI Engine" cmd /k "pnpm --filter @omega/core dev"
timeout /t 2 /nobreak >nul

start "OMEGA Web" cmd /k "pnpm --filter @omega/web dev"
timeout /t 2 /nobreak >nul

start "OMEGA Harvesters" cmd /k "cd services\harvesters && python -m uvicorn main:app --port 8000 --reload"
timeout /t 2 /nobreak >nul

echo.
echo Done. Opened 3 terminal windows.
echo.
echo   AI Engine:  http://localhost:4000
echo   Web/Admin:  http://localhost:3001/admin
echo   Harvesters: http://localhost:8000
echo.
pause
