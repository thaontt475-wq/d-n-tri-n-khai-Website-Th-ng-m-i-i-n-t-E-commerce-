@echo off
chcp 65001 > nul
echo ========================================================
echo   KHOI CHAY HE THONG DOCKER COMPOSE (9 DICH VU)
echo   De tai 9: E-Commerce Web & Monitoring - ICTU
echo ========================================================
echo.

cd /d "%~dp0"

where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo [LOI] Khong tim thay Docker CLI trong PATH.
    echo Vui long mo Docker Desktop truoc khi chay script nay!
    echo.
    echo Neu may chua co Docker, ban co the chay script "start-local.bat"
    echo de trai nghiem website ngay lap tuc bang Node.js!
    pause
    exit /b 1
)

echo Dang build va khoi dong 9 container Docker...
docker-compose up -d --build

echo.
echo ========================================================
echo HE THONG DA KHOI CHAY THANH CONG!
echo ========================================================
echo 1. Website E-Commerce HTTPS: https://localhost
echo 2. Quan tri phpMyAdmin:      https://localhost/phpmyadmin/
echo 3. Grafana Monitoring:       http://localhost:3001 (admin/admin)
echo 4. Prometheus Server:        http://localhost:9090
echo 5. cAdvisor Container Stats: http://localhost:8080
echo ========================================================
pause
