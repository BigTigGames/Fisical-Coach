@echo off
setlocal enabledelayedexpansion

:: Navigate to project root directory
cd /d "%~dp0"

echo ===================================================
echo       Fisical Coach WebGL - Post Build Tool
echo ===================================================
echo.

:: 1. Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found in PATH!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: 2. Run split.js
echo [1/3] Running split.js...
node split.js
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] split.js encountered an error!
    pause
    exit /b %errorlevel%
)

echo.
echo ===================================================
echo [SUCCESS] Build split successfully!
echo ===================================================
echo.

:: 3. Git Commit and Push
:: If called with --auto or --push argument (e.g., from Unity PostProcessBuild)
if "%1"=="--auto" goto do_push
if "%1"=="--push" goto do_push

:: Interactive prompt when double-clicked by user
set /p PUSH_CHOICE="Do you want to commit and push to GitHub now? (Y/N) [default: Y]: "
if /i "%PUSH_CHOICE%"=="N" (
    echo Push skipped. You can manually commit whenever you are ready.
    goto finish
)

:do_push
echo.
echo [2/3] Staging changes in Git...
git add .

set COMMIT_MSG=Update WebGL build
if not "%1"=="--auto" if not "%1"=="--push" (
    set /p USER_MSG="Enter commit message (press Enter for default '%COMMIT_MSG%'): "
    if not "!USER_MSG!"=="" set COMMIT_MSG=!USER_MSG!
)

echo [3/3] Committing and pushing...
git commit -m "!COMMIT_MSG!"
git push origin main

if %errorlevel% neq 0 (
    echo.
    echo [WARNING] Git push failed or there were no changes to commit.
) else (
    echo.
    echo ===================================================
    echo [SUCCESS] Pushed to GitHub! Netlify & Vercel are now deploying!
    echo ===================================================
)

:finish
echo.
if not "%1"=="--auto" (
    pause
)
