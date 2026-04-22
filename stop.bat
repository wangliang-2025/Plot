@echo off
chcp 65001 >nul
title Ink — Stop server
cd /d "%~dp0"
call npm run stop
echo.
pause
