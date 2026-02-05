@echo off
REM E-Commerce App - Quick Start Script for Windows

echo ======================================
echo E-Commerce App - Setup and Start
echo ======================================
echo.

REM Check if Java is installed
echo Checking Java installation...
java -version >nul 2>&1
if %errorlevel% neq 0 (
    echo X Java is NOT installed
    echo Please install Java 17 or higher from:
    echo https://www.oracle.com/java/technologies/downloads/
    pause
    exit /b 1
) else (
    echo + Java is installed
)

REM Check if Maven is installed
echo Checking Maven installation...
mvn -version >nul 2>&1
if %errorlevel% neq 0 (
    echo X Maven is NOT installed
    echo Please install Maven from:
    echo https://maven.apache.org/download.cgi
    pause
    exit /b 1
) else (
    echo + Maven is installed
)

REM Check if Node.js is installed
echo Checking Node.js installation...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo X Node.js is NOT installed
    echo Please install Node.js from:
    echo https://nodejs.org/
    pause
    exit /b 1
) else (
    echo + Node.js is installed
)

echo.
echo ======================================
echo All prerequisites are installed!
echo ======================================
echo.

REM Ask to install dependencies
set /p INSTALL="Do you want to install project dependencies? (Y/N): "
if /i "%INSTALL%"=="Y" (
    echo.
    echo Installing backend dependencies...
    cd backend
    call mvn clean install
    cd ..
    
    echo.
    echo Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
    
    echo.
    echo + Dependencies installed successfully!
)

echo.
echo ======================================
echo How to run the application:
echo ======================================
echo.
echo 1. Start Backend (in one Command Prompt):
echo    cd backend
echo    mvn spring-boot:run
echo.
echo 2. Start Frontend (in another Command Prompt):
echo    cd frontend
echo    npm start
echo.
echo 3. Open browser to: http://localhost:3000
echo.
pause

REM Ask to start the application
set /p START="Do you want to start the application now? (Y/N): "
if /i "%START%"=="Y" (
    echo.
    echo Starting backend server...
    echo Backend will run at: http://localhost:8080
    start cmd /k "cd backend && mvn spring-boot:run"
    
    timeout /t 15 /nobreak
    
    echo.
    echo Starting frontend server...
    echo Frontend will run at: http://localhost:3000
    start cmd /k "cd frontend && npm start"
)
