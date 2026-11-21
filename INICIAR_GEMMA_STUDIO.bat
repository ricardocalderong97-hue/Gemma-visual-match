@echo off
title Iniciar Gemma Agent Studio

echo =====================================
echo       GEMMA AGENT STUDIO
echo =====================================
echo.

set "FRONTEND=%~dp0"
set "BACKEND=%FRONTEND%..\Agentes-Gemma-MercadoLibre-FAQ"
if not exist "%BACKEND%\api.py" set "BACKEND=%FRONTEND%..\Agentes_Gemma_MercadoLibre"

if not exist "%BACKEND%\api.py" (
    echo ERROR: No se encontro el backend.
    pause
    exit /b 1
)

if not exist "%FRONTEND%\package.json" (
    echo ERROR: No se encontro el frontend.
    pause
    exit /b 1
)

echo Comprobando Ollama...
ollama list >nul 2>&1

if errorlevel 1 (
    echo Iniciando Ollama...
    start "Ollama" /min cmd /k "ollama serve"
    timeout /t 5 /nobreak >nul
)

echo Iniciando backend FastAPI...
start "Gemma - Backend" cmd /k "cd /d ""%BACKEND%"" && call .venv\Scripts\activate.bat && python -m uvicorn api:app --host 127.0.0.1 --port 8000"

echo Iniciando interfaz Lovable...
start "Gemma - Frontend" cmd /k "cd /d ""%FRONTEND%"" && npm run dev"

echo.
echo Servicios iniciados.
echo Abre http://localhost:8080/
echo.
pause