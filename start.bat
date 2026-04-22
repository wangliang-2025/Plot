@echo off
chcp 65001 >nul
setlocal
title Ink - Liquid Glass Blog

REM Move to the directory containing this script (so it works no matter where you double-click from)
cd /d "%~dp0"

echo.
echo   Ink - Liquid Glass Blog
echo   =======================
echo   Local launcher
echo.

REM Verify Node.js is present
where node >nul 2>nul
if errorlevel 1 (
  echo   [X] Node.js is not installed or not on PATH.
  echo       Download from https://nodejs.org/  ^(LTS, 20+^)
  echo.
  pause
  exit /b 1
)

REM One command does everything: setup if needed + dev server + auto-open browser
call npm run launch

REM If the server stops, keep the window open so the user can read the message
echo.
echo   Server stopped. Press any key to close this window.
pause >nul
endlocal
