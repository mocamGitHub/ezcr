@echo off
REM EZ Cycle Ramp - Session Startup Script (Windows)
REM Usage: .claude\session-start.bat

setlocal enabledelayedexpansion

cls

echo ╔════════════════════════════════════════════════════════╗
echo ║                                                        ║
echo ║           EZ Cycle Ramp - Session Startup             ║
echo ║                                                        ║
echo ╚════════════════════════════════════════════════════════╝
echo.

REM Get current branch
for /f "tokens=*" %%i in ('git branch --show-current') do set BRANCH=%%i
echo Current Branch: %BRANCH%
echo.

REM Check if on a claude/ branch
echo %BRANCH% | findstr /b /c:"claude/" >nul
if errorlevel 1 (
    echo ⚠️  Warning: Not on a 'claude/' branch
    echo    Push operations may fail
    echo.
)

REM Step 1: Clear Claude Code context
echo Step 1: Clearing Claude Code context...
echo    ^(Run '/clear' command in Claude Code^)
echo.
pause
echo.

REM Step 2: Pull latest changes
echo Step 2: Pulling latest changes from remote...
git fetch origin

REM Check if up to date
git diff --quiet HEAD origin/%BRANCH%
if %errorlevel% equ 0 (
    echo ✓ Already up to date
) else (
    echo Pulling changes...
    git pull origin %BRANCH%
    echo ✓ Changes pulled successfully
)
echo.

REM Step 3: Show repository status
echo Step 3: Repository Status
echo Branch: %BRANCH%
echo.

REM Check working tree status
git status -s >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Working tree clean
) else (
    echo ⚠️  Uncommitted changes:
    git status -s
)
echo.

REM Show recent commits
echo Recent commits:
git log -5 --oneline --decorate
echo.

REM Step 4: Display session handoff
echo Step 4: Loading session handoff...
echo.
echo ════════════════════════════════════════════════════════
echo.

REM Check if handoff file exists
if exist ".claude\SESSION-HANDOFF.md" (
    echo 📊 SESSION HANDOFF SUMMARY
    echo.

    echo Current Status:
    echo ─────────────
    REM Note: Windows doesn't have easy sed/awk, so we'll just point to the file
    echo See .claude\SESSION-HANDOFF.md for complete details
    echo.

    echo ════════════════════════════════════════════════════════
    echo.
    echo 📖 Full handoff document: .claude\SESSION-HANDOFF.md
    echo.

    REM Offer to open full handoff
    set /p OPEN="Open full SESSION-HANDOFF.md? (y/n) "
    if /i "%OPEN%"=="y" (
        if exist "%ProgramFiles%\Microsoft VS Code\bin\code.cmd" (
            "%ProgramFiles%\Microsoft VS Code\bin\code.cmd" .claude\SESSION-HANDOFF.md
        ) else (
            notepad .claude\SESSION-HANDOFF.md
        )
    )
) else (
    echo ✗ SESSION-HANDOFF.md not found
    echo   Create it with session handoff content
)

echo.
echo ════════════════════════════════════════════════════════
echo.

REM Step 5: Show quick commands
echo Quick Commands:
echo.
echo Commit ^& Push:
echo   .claude\commit-push.bat "Your message"
echo.
echo Start Next Session:
echo   .claude\session-start.bat
echo.
echo View Handoff:
echo   type .claude\SESSION-HANDOFF.md
echo.
echo Integration Priorities:
echo   type docs\INTEGRATION-PRIORITIES.md
echo.

echo ════════════════════════════════════════════════════════
echo.
echo ✓ Session startup complete!
echo.
echo Now run in Claude Code:
echo /startup .claude/SESSION-HANDOFF.md
echo.

pause
