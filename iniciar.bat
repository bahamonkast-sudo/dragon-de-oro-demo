@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

set "PY="
where python >nul 2>&1 && set "PY=python"
if not defined PY where py >nul 2>&1 && set "PY=py -3"
if not defined PY (
  echo [ERROR] No se encontro Python en el PATH.
  pause
  exit /b 1
)

set "PORT=3000"

for /f "tokens=5" %%p in ('netstat -ano ^| findstr "LISTENING" ^| findstr ":%PORT% "') do (
  echo Liberando puerto %PORT% ^(PID %%p^)...
  taskkill /PID %%p /F >nul 2>&1
)
timeout /t 1 /nobreak >nul

echo Iniciando servidor estatico de Dragon de Oro en el puerto %PORT%...
start "Dragon de Oro - servidor local" %PY% serve.py --port %PORT%
timeout /t 2 /nobreak >nul

start "" "http://localhost:%PORT%/public/inicio.html"

echo.
echo   Landing  : http://localhost:%PORT%/public/inicio.html
echo   Aula     : http://localhost:%PORT%/public/curso.html
echo   LMS      : http://localhost:%PORT%/public/index.html
echo   Patrones : http://localhost:%PORT%/public/patrones/hub.html
echo.
echo Para detener el servidor, cierra la ventana "Dragon de Oro - servidor local".
echo.