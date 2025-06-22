@echo off
REM SAP Integration Suite Backend Startup Script (Windows)
REM This script sets up and starts the Python FastAPI backend

echo 🚀 Starting SAP Integration Suite Backend...

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed. Please install Python 3.8 or higher.
    pause
    exit /b 1
)

REM Check if pip is installed
pip --version >nul 2>&1
if errorlevel 1 (
    echo ❌ pip is not installed. Please install pip.
    pause
    exit /b 1
)

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo 📦 Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo 🔄 Activating virtual environment...
call venv\Scripts\activate.bat

REM Install/upgrade pip
echo 🔄 Upgrading pip...
pip install --upgrade pip

REM Install dependencies
echo 📦 Installing dependencies...
pip install -r requirements.txt

REM Create .env file from example if it doesn't exist
if not exist ".env" (
    echo ⚙️ Creating .env file from example...
    copy .env.example .env
    echo 📝 Please update .env file with your SAP credentials if needed
)

REM Start the backend server
echo 🚀 Starting FastAPI backend server...
echo.
echo 📍 Backend will be available at: http://localhost:8000
echo 📖 API Documentation: http://localhost:8000/docs
echo 🔍 Health Check: http://localhost:8000/health
echo.
echo Press Ctrl+C to stop the server
echo.

REM Start the server with uvicorn
python main.py

pause
