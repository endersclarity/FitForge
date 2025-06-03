@echo off
setlocal enabledelayedexpansion

REM ============================================
REM FitForge Advanced Development Server Manager
REM ============================================

title FitForge Development Server Manager

:MAIN_MENU
cls
echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║            🚀 FitForge Development Server              ║
echo ║                  Management Console                    ║
echo ╚════════════════════════════════════════════════════════╝
echo.

REM Get WSL IP
for /f "tokens=*" %%i in ('wsl -d Ubuntu -- ip addr show eth0 ^| grep "inet " ^| awk "{print $2}" ^| cut -d/ -f1 2^>nul') do set WSL_IP=%%i
if "%WSL_IP%"=="" set WSL_IP=localhost

echo 🌐 Access URL: http://%WSL_IP%:5000
echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║  Choose an option:                                     ║
echo ║                                                        ║
echo ║  [1] 🚀 Start Development Server (Auto-reload)        ║
echo ║  [2] 🛡️  Start Bulletproof Server (Crash recovery)    ║
echo ║  [3] 📊 Check Server Status                            ║
echo ║  [4] 📄 View Server Logs                               ║
echo ║  [5] 🔄 Restart Server                                 ║
echo ║  [6] 🛑 Stop Server                                    ║
echo ║  [7] 🏥 Health Check                                   ║
echo ║  [8] 🌐 Open in Browser                                ║
echo ║  [9] ❌ Exit                                           ║
echo ║                                                        ║
echo ╚════════════════════════════════════════════════════════╝
echo.

set /p choice="Enter your choice (1-9): "

if "%choice%"=="1" goto START_DEV
if "%choice%"=="2" goto START_STABLE
if "%choice%"=="3" goto CHECK_STATUS
if "%choice%"=="4" goto VIEW_LOGS
if "%choice%"=="5" goto RESTART_SERVER
if "%choice%"=="6" goto STOP_SERVER
if "%choice%"=="7" goto HEALTH_CHECK
if "%choice%"=="8" goto OPEN_BROWSER
if "%choice%"=="9" goto EXIT
goto MAIN_MENU

:START_DEV
cls
echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║          🚀 Starting Development Server                ║
echo ╚════════════════════════════════════════════════════════╝
echo.
echo ✅ Auto-reload enabled
echo ✅ Accessible at: http://%WSL_IP%:5000
echo ✅ Keep this window open to keep server running
echo.
echo Press Ctrl+C to stop the server and return to menu
echo.
echo ========================================
echo 🔄 Server Output:
echo ========================================

wsl -d Ubuntu -- bash -c "cd /home/ender/.claude/projects/ai-tools-workflow-integration/FitForge && npm run dev"

echo.
echo 🛑 Server stopped. Press any key to return to main menu...
pause >nul
goto MAIN_MENU

:START_STABLE
cls
echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║        🛡️ Starting Bulletproof Server                 ║
echo ╚════════════════════════════════════════════════════════╝
echo.
echo ✅ Auto-reload enabled
echo ✅ Crash recovery enabled
echo ✅ Health monitoring enabled
echo ✅ Accessible at: http://%WSL_IP%:5000
echo.
echo Press Ctrl+C to stop the server and return to menu
echo.
echo ========================================
echo 🔄 Server Output:
echo ========================================

wsl -d Ubuntu -- bash -c "cd /home/ender/.claude/projects/ai-tools-workflow-integration/FitForge && npm run dev-stable"

echo.
echo 🛑 Server stopped. Press any key to return to main menu...
pause >nul
goto MAIN_MENU

:CHECK_STATUS
cls
echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║              📊 Server Status Check                   ║
echo ╚════════════════════════════════════════════════════════╝
echo.

wsl -d Ubuntu -- bash -c "cd /home/ender/.claude/projects/ai-tools-workflow-integration/FitForge && npm run server status"

echo.
echo Press any key to return to main menu...
pause >nul
goto MAIN_MENU

:VIEW_LOGS
cls
echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║                📄 Server Logs                         ║
echo ╚════════════════════════════════════════════════════════╝
echo.

wsl -d Ubuntu -- bash -c "cd /home/ender/.claude/projects/ai-tools-workflow-integration/FitForge && npm run server logs"

echo.
echo Press any key to return to main menu...
pause >nul
goto MAIN_MENU

:RESTART_SERVER
cls
echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║              🔄 Restarting Server                     ║
echo ╚════════════════════════════════════════════════════════╝
echo.

wsl -d Ubuntu -- bash -c "cd /home/ender/.claude/projects/ai-tools-workflow-integration/FitForge && npm run server restart"

echo.
echo ✅ Server restart command completed.
echo.
echo Press any key to return to main menu...
pause >nul
goto MAIN_MENU

:STOP_SERVER
cls
echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║               🛑 Stopping Server                      ║
echo ╚════════════════════════════════════════════════════════╝
echo.

wsl -d Ubuntu -- bash -c "cd /home/ender/.claude/projects/ai-tools-workflow-integration/FitForge && npm run server stop"

echo.
echo ✅ Server stop command completed.
echo.
echo Press any key to return to main menu...
pause >nul
goto MAIN_MENU

:HEALTH_CHECK
cls
echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║              🏥 Health Check                          ║
echo ╚════════════════════════════════════════════════════════╝
echo.

wsl -d Ubuntu -- bash -c "cd /home/ender/.claude/projects/ai-tools-workflow-integration/FitForge && npm run server health"

echo.
echo Press any key to return to main menu...
pause >nul
goto MAIN_MENU

:OPEN_BROWSER
echo.
echo 🌐 Opening browser to http://%WSL_IP%:5000
start http://%WSL_IP%:5000
timeout /t 2 >nul
goto MAIN_MENU

:EXIT
cls
echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║            👋 Thank you for using FitForge!           ║
echo ║                                                        ║
echo ║     Your development server may still be running.     ║
echo ║     Use option 6 to stop it if needed.               ║
echo ╚════════════════════════════════════════════════════════╝
echo.
timeout /t 3 >nul
exit /b 0