@echo off
setlocal enabledelayedexpansion
:: =========================================================================
::  GUARDIAN VISIONARIOS - LANZADOR OFICIAL
:: =========================================================================

title Guardian Visionarios - Iniciando...
color 0E
cls

echo =========================================================================
echo  GUARDIAN VISIONARIOS - APP MAESTRA
echo =========================================================================
echo.
echo [PASO 1] Verificando entorno de ejecucion...

:: -------------------------------------------------------------------------
:: Detectar node.exe: primero bundleado en runtime\, luego el del sistema
:: -------------------------------------------------------------------------
set "NODE_EXE=%~dp0runtime\node.exe"

if exist "!NODE_EXE!" (
    echo [OK] Node.js portable detectado.
) else (
    where node >nul 2>nul
    if !errorlevel! neq 0 (
        color 0C
        echo.
        echo =========================================================================
        echo  ERROR: Node.js no encontrado en este equipo.
        echo  Instala Node.js LTS desde: https://nodejs.org/
        echo =========================================================================
        pause
        exit /b 1
    )
    set "NODE_EXE=node"
    echo [OK] Node.js del sistema detectado.
)

:: -------------------------------------------------------------------------
:: PASO 2: Detectar puerto libre automaticamente
:: -------------------------------------------------------------------------
echo [PASO 2] Buscando puerto disponible...

set VISIONARIOS_PORT=0
set PORT_LIST=8088 8089 8090 8091 8092 8093 8094 8095 8096 8097 8098

:: Si detectamos el archivo "installed.txt" generado por Inno Setup, usamos el rango 8100+
if exist "%~dp0installed.txt" (
    set PORT_LIST=8100 8101 8102 8103 8104 8105 8106 8107 8108 8109 8110
)

for %%P in (!PORT_LIST!) do (
    if !VISIONARIOS_PORT!==0 (
        netstat -ano | findstr LISTENING | findstr :%%P >nul 2>nul
        if !errorlevel! neq 0 (
            set VISIONARIOS_PORT=%%P
        )
    )
)

if !VISIONARIOS_PORT!==0 (
    color 0C
    echo.
    echo =========================================================================
    echo  ERROR: No hay puertos disponibles del 8088 al 8098.
    echo  Cierra otras aplicaciones e intenta de nuevo.
    echo =========================================================================
    pause
    exit /b 1
)

echo [OK] Puerto disponible: !VISIONARIOS_PORT!

:: -------------------------------------------------------------------------
:: PASO 3: Iniciar el servidor y abrir el navegador
:: -------------------------------------------------------------------------
echo [PASO 3] Iniciando servidor en puerto !VISIONARIOS_PORT!...
echo.
echo =========================================================================
echo  SERVIDOR ACTIVO: http://localhost:!VISIONARIOS_PORT!
echo  MANTEN ESTA VENTANA ABIERTA MIENTRAS OPERAS
echo  Para detener: presiona Ctrl + C o cierra esta ventana.
echo =========================================================================
echo.

:: Abrir el navegador (se llama a la subrutina directamente antes de que node bloquee la terminal)
:: Hacemos un ping local de 1 segundo para dar un ligero margen, o simplemente abrimos y luego levantamos node
call :OpenAppMode http://localhost:!VISIONARIOS_PORT!

:: Iniciar el servidor en la ventana principal (bloquea hasta que se cierre)
set PORT=!VISIONARIOS_PORT!
"!NODE_EXE!" "%~dp0server.js"

if !errorlevel! neq 0 (
    color 0C
    echo.
    echo =========================================================================
    echo  ERROR: El servidor se detuvo inesperadamente.
    echo =========================================================================
    echo.
    pause
)

endlocal
exit /b

:: =========================================================================
:: Subrutina: Abrir en modo aplicacion (sin barra de URL)
:: =========================================================================
:OpenAppMode
set "APP_URL=%~1"

:: Intentar Chrome primero
set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not exist "!CHROME!" set "CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not exist "!CHROME!" set "CHROME=%LocalAppData%\Google\Chrome\Application\chrome.exe"

if exist "!CHROME!" (
    start "" "!CHROME!" --app=!APP_URL! --window-size=1280,800
    exit /b
)

:: Intentar Microsoft Edge
set "EDGE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not exist "!EDGE!" set "EDGE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"

if exist "!EDGE!" (
    start "" "!EDGE!" --app=!APP_URL! --window-size=1280,800
    exit /b
)

:: Fallback: navegador predeterminado del sistema
start "" !APP_URL!
exit /b
