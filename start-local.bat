@echo off
chcp 65001 > nul
echo ========================================================
echo   KHOI CHAY UNG DUNG E-COMMERCE (CHE DO TRUC TIEP)
echo   De tai 9: E-Commerce Web & Monitoring - ICTU
echo ========================================================
echo.

cd /d "%~dp0app"

if not exist node_modules (
    echo [1/2] Dang cai dat thu vien node_modules...
    call npm install
) else (
    echo [1/2] Thu vien node_modules da san sang.
)

echo [2/2] Dang khoi dong Web Server tai cong 3000...
echo.
echo -> Mo trinh duyet tai: http://localhost:3000
echo -> Prometheus Metrics:  http://localhost:3000/metrics
echo.

start http://localhost:3000
node server.js
pause
