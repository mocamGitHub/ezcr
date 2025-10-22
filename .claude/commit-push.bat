@echo off
REM EZ Cycle Ramp - Git Commit & Push Script (Windows)
REM Usage: .claude\commit-push.bat "Your commit message"

setlocal enabledelayedexpansion

REM Get current branch
for /f "tokens=*" %%i in ('git branch --show-current') do set BRANCH=%%i

REM Validate branch name (must start with 'claude/')
echo %BRANCH% | findstr /b /c:"claude/" >nul
if errorlevel 1 (
    echo Error: Branch must start with 'claude/' for push to work
    echo Current branch: %BRANCH%
    exit /b 1
)

REM Get commit message from argument or prompt
if "%~1"=="" (
    set /p COMMIT_MSG="Enter commit message: "
) else (
    set COMMIT_MSG=%~1
)

REM Check if there are changes
git status -s >nul 2>&1
if errorlevel 1 (
    echo No changes to commit
    git status
    exit /b 0
)

echo === EZ Cycle Ramp - Commit ^& Push ===
echo Branch: %BRANCH%
echo.

REM Show status
echo Changes to commit:
git status -s
echo.

REM Stage all changes
echo Staging all changes...
git add -A

REM Create commit with standard footer
echo Creating commit...
git commit -m "%COMMIT_MSG%" -m "" -m "🤖 Generated with [Claude Code](https://claude.com/claude-code)" -m "" -m "Co-Authored-By: Claude <noreply@anthropic.com>"

REM Push to remote
echo Pushing to origin/%BRANCH%...
git push -u origin %BRANCH%

REM Show final status
echo.
echo ✓ Success!
echo Commit and push completed
echo.
git log -1 --oneline
echo.
git status
