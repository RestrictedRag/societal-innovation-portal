@echo off
title CivicNexus - Local Presentation Setup
color 0A
cls

echo =======================================================
echo    CivicNexus - 1-Click Local Environment Setup
echo    SIH 2026 Innovation Platform
echo =======================================================
echo.

node setup-local.js

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Setup encountered an issue. Please review the messages above.
    pause
    exit /b %errorlevel%
)

echo.
echo =======================================================
echo Setup finished successfully!
echo.
set /p START_NOW="Do you want to start CivicNexus now? (y/n): "
if /i "%START_NOW%"=="y" (
    echo Starting CivicNexus dev server...
    npm run dev
) else (
    echo.
    echo You can start the app anytime by running: npm run dev
    pause
)
