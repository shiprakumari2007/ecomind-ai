@echo off
echo ========================================================
echo   🌿 Starting EcoMind AI - Full Stack Platform
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/2] Starting Backend Server (FastAPI on Port 8000)...
start "EcoMind AI - Backend" cmd /k "python start_backend.py"

echo [2/2] Starting Frontend Dev Server (Vite React on Port 5173)...
start "EcoMind AI - Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Waiting for servers to initialize...
timeout /t 4 >nul

echo Opening EcoMind AI in your browser...
start http://localhost:5173

echo.
echo ========================================================
echo   EcoMind AI is now running!
echo   Frontend: http://localhost:5173
echo   Backend:  http://127.0.0.1:8000
echo   API Docs: http://127.0.0.1:8000/docs
echo ========================================================
pause
