@echo off
REM Quick validation script for the Support Ticket System (Windows Batch)

echo.
echo ============================================
echo Support Ticket System - Setup Validation
echo ============================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not installed or not in PATH
    exit /b 1
) else (
    echo OK: Docker is installed
    docker --version
)

echo.
echo Project structure check:
echo.

REM Check key files exist
setlocal enabledelayedexpansion
set "files[0]=docker-compose.yml"
set "files[1]=README.md"
set "files[2]=backend\requirements.txt"
set "files[3]=backend\Dockerfile"
set "files[4]=backend\manage.py"
set "files[5]=backend\config\settings.py"
set "files[6]=backend\tickets\models.py"
set "files[7]=backend\tickets\views.py"
set "files[8]=backend\tickets\llm_service.py"
set "files[9]=frontend\Dockerfile"
set "files[10]=frontend\package.json"
set "files[11]=frontend\src\App.js"
set "files[12]=frontend\src\components\TicketForm.js"
set "files[13]=frontend\src\components\TicketList.js"
set "files[14]=frontend\src\components\Stats.js"

set "all_good=1"
for /L %%i in (0,1,14) do (
    if exist "!files[%%i]!" (
        echo OK: !files[%%i]!
    ) else (
        echo ERROR: !files[%%i]! (MISSING)
        set "all_good=0"
    )
)

echo.
if "%all_good%"=="1" (
    echo OK: All required files are present!
    echo.
    echo Next steps:
    echo 1. Create .env file with your LLM API key (optional^):
    echo    copy .env.example .env
    echo    and edit .env with your Anthropic API key
    echo.
    echo 2. Start the application:
    echo    docker-compose up --build
    echo.
    echo 3. Access the application:
    echo    Frontend: http://localhost:3000
    echo    Backend API: http://localhost:8000/api/tickets/
) else (
    echo ERROR: Some files are missing. Please check the project structure.
    exit /b 1
)
