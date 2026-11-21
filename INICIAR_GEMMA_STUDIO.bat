@echo off
setlocal
chcp 65001 >nul
TITLE Gemma Agent Studio - Inicio conjunto

REM Se puede colocar junto a las dos carpetas clonadas, o dentro de pixel-perfect-match.
set "ROOT=%~dp0"
if exist "%ROOT%pixel-perfect-match\package.json" (
    set "FRONTEND=%ROOT%pixel-perfect-match"
    set "BACKEND=%ROOT%Agentes-Gemma-MercadoLibre-FAQ"
    if not exist "%ROOT%Agentes-Gemma-MercadoLibre-FAQ\api.py" set "BACKEND=%ROOT%Agentes_Gemma_MercadoLibre"
) else (
    set "FRONTEND=%ROOT%"
    set "BACKEND=%ROOT%..\Agentes-Gemma-MercadoLibre-FAQ"
    if not exist "%ROOT%..\Agentes-Gemma-MercadoLibre-FAQ\api.py" set "BACKEND=%ROOT%..\Agentes_Gemma_MercadoLibre"
)

if not exist "%BACKEND%\api.py" (
    echo ERROR: No se encontro api.py en el backend.
    echo Coloque ambos repositorios en carpetas vecinas.
    pause
    exit /b 1
)
if not exist "%BACKEND%\.venv\Scripts\activate.bat" (
    echo ERROR: Falta el entorno virtual del backend. Siga el README de instalacion.
    pause
    exit /b 1
)
if not exist "%FRONTEND%\package.json" (
    echo ERROR: No se encontro package.json del frontend.
    pause
    exit /b 1
)
if not exist "%FRONTEND%\node_modules" (
    echo ERROR: Falta instalar el frontend. Ejecute npm ci en su carpeta.
    pause
    exit /b 1
)
where ollama >nul 2>&1
if errorlevel 1 (
    echo ERROR: Ollama no esta instalado o no esta en PATH.
    pause
    exit /b 1
)
ollama list >nul 2>&1
if errorlevel 1 (
    echo Iniciando servicio Ollama...
    start "Ollama" /min cmd /k "ollama serve"
    timeout /t 5 /nobreak >nul
)
echo Iniciando FastAPI...
start "Gemma - Backend" cmd /k "cd /d ""%BACKEND%"" && call .venv\Scripts\activate.bat && python -m uvicorn api:app --host 127.0.0.1 --port 8000"
echo Iniciando interfaz...
start "Gemma - Frontend" cmd /k "cd /d ""%FRONTEND%"" && npm run dev"
echo Abriendo navegador...
timeout /t 8 /nobreak >nul
start "" "http://localhost:8080/"
echo.
echo Mantenga abiertas las ventanas de FastAPI y Vite para utilizar Gemma Agent Studio.
pause
