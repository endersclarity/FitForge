@echo off

REM ============================================
REM FitForge Quick Start - Zero Configuration
REM ============================================

title FitForge Development Server

REM Simple, one-click start
echo 🚀 Starting FitForge...

REM Get WSL IP for display
for /f "tokens=*" %%i in ('wsl -d Ubuntu -- ip addr show eth0 ^| grep "inet " ^| awk "{print $2}" ^| cut -d/ -f1 2^>nul') do set WSL_IP=%%i
if "%WSL_IP%"=="" set WSL_IP=localhost

echo.
echo ✅ Access your app at: http://%WSL_IP%:5000
echo ✅ Keep this window open to keep server running
echo ✅ Press Ctrl+C to stop
echo.

REM Start server
wsl -d Ubuntu -- bash -c "cd /home/ender/.claude/projects/ai-tools-workflow-integration/FitForge && npm run dev"

echo.
echo 🛑 Server stopped.
pause