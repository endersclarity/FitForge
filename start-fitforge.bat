@echo off
setlocal enabledelayedexpansion

REM ============================================
REM FitForge Development Server - One-Click Start
REM ============================================

echo.
echo ========================================
echo 🚀 FitForge Development Server Startup
echo ========================================
echo.

REM Colors (Windows CMD doesn't support colors natively, but we can use text)
echo [INFO] Starting FitForge development environment...
echo.

REM Set project path - adjust this to your actual path
set PROJECT_PATH=\\wsl$\Ubuntu\home\ender\.claude\projects\ai-tools-workflow-integration\FitForge

REM Check if WSL is available
wsl --list --quiet >nul 2>&1
if errorlevel 1 (
    echo [ERROR] WSL is not available or not running
    echo Please make sure WSL is installed and Ubuntu is running
    pause
    exit /b 1
)

echo [INFO] WSL detected - checking Ubuntu...

REM Check if Ubuntu distribution exists
wsl -d Ubuntu echo "Ubuntu is available" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Ubuntu distribution not found in WSL
    echo Available distributions:
    wsl --list
    pause
    exit /b 1
)

echo [SUCCESS] Ubuntu WSL distribution found
echo.

REM Get WSL IP address for Windows access
echo [INFO] Getting WSL IP address...
for /f "tokens=*" %%i in ('wsl -d Ubuntu -- ip addr show eth0 ^| grep "inet " ^| awk "{print $2}" ^| cut -d/ -f1') do set WSL_IP=%%i

if "%WSL_IP%"=="" (
    echo [ERROR] Could not determine WSL IP address
    set WSL_IP=localhost
    echo [WARNING] Using localhost instead - you may need to access via WSL terminal
) else (
    echo [SUCCESS] WSL IP Address: %WSL_IP%
)

echo.
echo ========================================
echo 🌐 Access URLs (save these!)
echo ========================================
echo Windows Browser: http://%WSL_IP%:5000
echo Local Access:    http://localhost:5000
echo ========================================
echo.

REM Change to project directory and start server
echo [INFO] Navigating to FitForge project directory...
echo [INFO] Project path: %PROJECT_PATH%
echo.

echo [INFO] Starting FitForge development server...
echo [INFO] This will:
echo   ✅ Auto-reload on code changes
echo   ✅ Keep running until you close this window
echo   ✅ Show all server logs here
echo   ✅ Be accessible from Windows browser
echo.
echo [IMPORTANT] Keep this window open to keep the server running!
echo [IMPORTANT] Press Ctrl+C in this window to stop the server
echo.

REM Start the development server using WSL
echo ========================================
echo 🚀 Starting Server... (this may take a moment)
echo ========================================

wsl -d Ubuntu -- bash -c "cd /home/ender/.claude/projects/ai-tools-workflow-integration/FitForge && npm run dev"

REM If we get here, the server has stopped
echo.
echo ========================================
echo 🛑 FitForge Server Stopped
echo ========================================
echo.
echo The development server has been stopped.
echo You can restart it by running this batch file again.
echo.
pause