@echo off
REM EZCR Documentation Structure Investigation
REM Phase 1: INVESTIGATION ONLY - NO CHANGES
REM Purpose: Verify current directory structure and identify what needs to be created
REM Environment: Windows 11

setlocal enabledelayedexpansion

echo ============================================== 
echo EZCR Documentation Structure Investigation
echo ==============================================
echo.

REM Project root
set "PROJECT_ROOT=C:\Users\morri\Dropbox\Websites\ezcr"

if not exist "%PROJECT_ROOT%" (
    echo [ERROR] Project root does not exist: %PROJECT_ROOT%
    pause
    exit /b 1
)

echo [INFO] Project root: %PROJECT_ROOT%
cd /d "%PROJECT_ROOT%"
echo.

REM Initialize counters
set /a TOTAL_DIRS=0
set /a EXISTING_DIRS=0
set /a MISSING_DIRS=0
set /a TOTAL_FILES=0
set /a EXISTING_FILES=0
set /a MISSING_FILES=0

echo [INFO] Checking directory structure...
echo.

REM Check directories
for %%D in (
    ".claude"
    ".claude\agents"
    ".claude\context"
    ".notebooklm"
    "docs"
    "docs\architecture"
    "docs\api"
    "docs\guides"
    "docs\decisions"
    "email-templates"
    "email-templates\orders"
    "email-templates\cart"
    "email-templates\support"
    "n8n"
    "n8n\workflows"
    "scripts"
    "supabase"
    "supabase\migrations"
    "supabase\functions"
) do (
    set /a TOTAL_DIRS+=1
    if exist "%%~D\" (
        echo [SUCCESS] Directory exists: %%~D
        set /a EXISTING_DIRS+=1
    ) else (
        echo [WARNING] Directory missing: %%~D
        set /a MISSING_DIRS+=1
        echo %%~D >> missing_dirs.tmp
    )
)

echo.
echo [INFO] Checking required files...
echo.

REM Check files
for %%F in (
    ".claude\coordinator.md"
    ".claude\project.md"
    ".claude\tasks.md"
    ".claude\agents\01-database-agent.md"
    ".claude\agents\02-ui-component-agent.md"
    ".claude\agents\03-ecommerce-agent.md"
    ".claude\agents\04-ai-rag-agent.md"
    ".claude\agents\05-automation-agent.md"
    ".claude\agents\06-testing-agent.md"
    ".claude\agents\07-devops-agent.md"
    ".claude\agents\08-documentation-agent.md"
    ".claude\agents\09-security-agent.md"
    ".claude\agents\10-notebooklm-agent.md"
    ".claude\agents\11-customer-success-agent.md"
    ".claude\agents\12-configurator-agent.md"
    ".claude\context\database-schema.md"
    ".claude\context\api-routes.md"
    ".claude\context\business-rules.md"
    ".claude\context\component-library.md"
) do (
    set /a TOTAL_FILES+=1
    if exist "%%~F" (
        echo [SUCCESS] File exists: %%~F
        set /a EXISTING_FILES+=1
    ) else (
        echo [WARNING] File missing: %%~F
        set /a MISSING_FILES+=1
        echo %%~F >> missing_files.tmp
    )
)

echo.
echo ==============================================
echo Investigation Summary
echo ==============================================
echo.

echo Directories:
echo   Total Required: !TOTAL_DIRS!
echo   Existing: !EXISTING_DIRS!
echo   Missing: !MISSING_DIRS!
echo.

echo Files:
echo   Total Required: !TOTAL_FILES!
echo   Existing: !EXISTING_FILES!
echo   Missing: !MISSING_FILES!
echo.

if exist missing_dirs.tmp (
    echo Missing Directories:
    type missing_dirs.tmp
    echo.
    del missing_dirs.tmp
)

if exist missing_files.tmp (
    echo Missing Files:
    type missing_files.tmp
    echo.
    del missing_files.tmp
)

echo [INFO] Checking for existing knowledge base documents...
echo.

for %%K in (
    "EZCR Complete Knowledge Base - Master Document.md"
    "EZCR - Complete Step-by-Step Project Instructions.md"
    "EZCR - Complete Agent Specification Files.md"
) do (
    if exist "%%~K" (
        echo [SUCCESS] Knowledge base exists: %%~K
    ) else (
        echo [WARNING] Knowledge base missing: %%~K
    )
)

echo.
echo ==============================================
echo Next Steps
echo ==============================================
echo.

if !MISSING_DIRS! gtr 0 (
    echo Phase 2 will analyze the structure and determine creation strategy.
    echo Phase 3 will create all missing directories and files.
) else (
    if !MISSING_FILES! gtr 0 (
        echo Phase 2 will analyze the structure and determine creation strategy.
        echo Phase 3 will create all missing directories and files.
    ) else (
        echo [SUCCESS] All required directories and files already exist!
        echo No action needed.
    )
)

echo.
echo [INFO] Investigation complete. Review findings and confirm to proceed to Phase 2.
echo ==============================================
echo.

REM Create simple report
echo Investigation Report > ezcr-docs-investigation-report.txt
echo =================== >> ezcr-docs-investigation-report.txt
echo. >> ezcr-docs-investigation-report.txt
echo Timestamp: %DATE% %TIME% >> ezcr-docs-investigation-report.txt
echo Project Root: %PROJECT_ROOT% >> ezcr-docs-investigation-report.txt
echo. >> ezcr-docs-investigation-report.txt
echo Directories: >> ezcr-docs-investigation-report.txt
echo   Total: !TOTAL_DIRS! >> ezcr-docs-investigation-report.txt
echo   Existing: !EXISTING_DIRS! >> ezcr-docs-investigation-report.txt
echo   Missing: !MISSING_DIRS! >> ezcr-docs-investigation-report.txt
echo. >> ezcr-docs-investigation-report.txt
echo Files: >> ezcr-docs-investigation-report.txt
echo   Total: !TOTAL_FILES! >> ezcr-docs-investigation-report.txt
echo   Existing: !EXISTING_FILES! >> ezcr-docs-investigation-report.txt
echo   Missing: !MISSING_FILES! >> ezcr-docs-investigation-report.txt

echo [SUCCESS] Investigation report saved to: ezcr-docs-investigation-report.txt
echo.

pause
