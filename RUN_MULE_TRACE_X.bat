@echo off
setlocal
title MULE TRACE X - ANALYTICAL CLUSTER LAUNCHER

:: -------------------------------------------------------------------------
:: [ M U L E   T R A C E   X ] - ONE-CLICK EXECUTION FABRIC
:: -------------------------------------------------------------------------

echo =====================================================================
echo.
echo     [ M U L E   T R A C E   X ]
echo.
echo     GPU-Accelerated Hybrid Financial Forensics Engine
echo =====================================================================
echo.

:: 1. PREREQUISITE VALIDATION
echo [1/4] VALIDATING EXECUTION FABRIC...

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found. Please install it from https://nodejs.org/
    pause
    exit /b
)

where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python not found. Please install it from https://python.org/
    pause
    exit /b
)

:: 2. ENVIRONMENT SYNC
echo.
echo [2/4] SYNCHRONIZING NEURAL DEPENDENCIES...
echo Note: This step downloads PyTorch (~2GB), which may take several minutes.
set /p choice="Do you want to skip dependency check and launch directly? (y/n): "
if /i "%choice%"=="y" goto skip_deps

echo Syncing NPM Distribution Fabric...
call npm install --no-fund --no-audit

cd frontend
call npm install --no-fund --no-audit
cd ..

if not exist .venv (
    echo Creating Python Virtual Environment...
    python -m venv .venv
)

echo Activating Analytical Fabric (VENV)...
if not exist .venv\Scripts\python.exe (
    echo [ERROR] Virtual Environment corrupted. Recreating...
    python -m venv .venv
)

echo.
echo Syncing Backend Dependencies...
echo [INFO] This ensures PyTorch, Pandas, and Neural Cores are ready.
echo [INFO] Running: .venv\Scripts\python.exe -m pip install -r backend/requirements.txt
echo.

:: Use direct venv python call for robustness
.venv\Scripts\python.exe -m pip install --upgrade pip
.venv\Scripts\python.exe -m pip install -r backend/requirements.txt

if %errorlevel% neq 0 (
    echo.
    echo [WARNING] Dependency sync encountered an issue. 
    echo [WARNING] Attempting to proceed with current environment...
    timeout /t 3 >nul
)

:skip_deps
echo.
echo [3/4] INITIALIZING HYBRID CORES (Starting Servers)...
echo.
echo ---------------------------------------------------------------------
echo    Note: Backend (8000) and Frontend (5173) are starting...
echo    Monitor the 'MULE TRACE X' terminal window for live logs.
echo ---------------------------------------------------------------------
echo.

:: Launch concurrently in a new window to keep this one for monitoring
start "MULE TRACE X - ACTIVE NODES" npm run dev

:: 4. DASHBOARD SYNC
echo.
echo [4/4] WAITING FOR SLINGSHOT FABRIC STABILIZATION...
timeout /t 8 /nobreak >nul

echo.
echo [COMPLETE] Launching MULE TRACE X Dashboard...
start http://localhost:5173

echo.
echo =====================================================================
echo    CLUSTERS ACTIVE. YOU CAN NOW MINIMIZE THIS WINDOW.
echo    PRESS CTRL+C IN THE OTHER WINDOW TO STOP ALL SERVICES.
echo =====================================================================
echo.
pause
