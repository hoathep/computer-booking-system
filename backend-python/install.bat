@echo off
echo Installing Python Backend Dependencies...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://python.org
    pause
    exit /b 1
)

echo Python found, installing dependencies...
pip install -r requirements.txt

echo.
echo ✅ Installation completed!
echo.
echo To run the backend:
echo   python run.py
echo.
echo To view API docs:
echo   http://localhost:3000/docs
echo.
pause
