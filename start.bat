@echo off
echo ========================================
echo Canadian Nexus Admin Panel
echo Quick Start Script
echo ========================================
echo.

REM Check if MongoDB is running
echo [1/4] Checking MongoDB...
tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I /N "mongod.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo ✓ MongoDB is running
) else (
    echo ✗ MongoDB is not running
    echo Please start MongoDB first:
    echo   - net start MongoDB (if installed as service)
    echo   - Or run: mongod
    echo.
    pause
    exit /b 1
)

echo.
echo [2/4] Starting Backend Server (Port 5001)...
start "Canadian Nexus Backend" cmd /k "cd backend && npm start"
timeout /t 3 /nobreak >nul

echo.
echo [3/4] Creating Admin User...
timeout /t 2 /nobreak >nul
cd backend
call npm run seed
cd ..

echo.
echo [4/4] Starting Frontend Server (Port 3000)...
timeout /t 2 /nobreak >nul
start "Canadian Nexus Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo ✓ Setup Complete!
echo ========================================
echo.
echo Backend:  http://localhost:5001/api
echo Frontend: http://localhost:3001
echo.
echo Default Admin Credentials:
echo   Email:    admin@canadiannexus.com
echo   Password: admin123
echo.
echo ⚠ Please change the password after first login!
echo ========================================
echo.
echo Press any key to open the browser...
pause >nul
start http://localhost:3001
