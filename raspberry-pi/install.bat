@echo off
REM Victron Solar Monitor - Windows Installer Launcher
REM Double-click this file to start the installer

title Victron Solar Monitor - Installer

echo.
echo ╔══════════════════════════════════════════════════════════════════╗
echo ║                                                                  ║
echo ║        Victron Solar Monitor - Windows Installer                ║
echo ║                                                                  ║
echo ╚══════════════════════════════════════════════════════════════════╝
echo.
echo Starting installer...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed!
    echo.
    echo Please install Python from: https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation.
    echo.
    pause
    exit /b 1
)

REM Check if tkinter is available
python -c "import tkinter" >nul 2>&1
if errorlevel 1 (
    echo ERROR: tkinter is not installed!
    echo.
    echo Please reinstall Python and ensure tkinter is selected.
    echo.
    pause
    exit /b 1
)

REM Check for admin rights
net session >nul 2>&1
if errorlevel 1 (
    echo.
    echo WARNING: Not running as Administrator
    echo Some features may not work correctly.
    echo.
    echo Right-click this file and select "Run as Administrator"
    echo.
    pause
    echo Continuing anyway...
    echo.
)

REM Install required packages
echo Installing required packages...
pip install pywin32 requests >nul 2>&1

REM Run the installer
echo Launching installer GUI...
echo.
python windows_installer.py

if errorlevel 1 (
    echo.
    echo ERROR: Installer failed to start
    echo.
    echo Troubleshooting:
    echo 1. Make sure you have Python 3.7 or newer
    echo 2. Try: pip install tkinter pywin32 requests
    echo 3. Right-click and "Run as Administrator"
    echo 4. See WINDOWS_SETUP.md for detailed help
    echo.
    pause
    exit /b 1
)

echo.
echo Installer closed.
pause
