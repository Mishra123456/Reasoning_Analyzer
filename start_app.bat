@echo off
echo Starting Reasoning Insights App...

:: Start Backend in a new window
start "Reasoning Backend" cmd /k "uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

:: Start Frontend in a new window
start "Reasoning Frontend" cmd /k "npm run dev"

echo Servers are starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:8080 (or similar)
pause
