@echo off
setlocal

REM Copy the exported SQLite database from the game's Mods/export/ to the
REM repo's data/ and website/public/ directories.
REM
REM Run this after launching the game with DataExporter mod installed.
REM The mod writes Mods/export/10man-idle.db on first frame.

set "SCRIPTDIR=%~dp0"

REM Read GameDir
set "GAMEDIR="
if exist "%SCRIPTDIR%..\Directory.Build.props.user" (
    for /f "tokens=2 delims=<>" %%a in ('findstr /i "GameDir" "%SCRIPTDIR%..\Directory.Build.props.user"') do (
        set "GAMEDIR=%%a"
    )
)
if "%GAMEDIR%"=="" set "GAMEDIR=%TENMAN_GAME_DIR%"

if "%GAMEDIR%"=="" (
    echo Error: GameDir not configured.
    exit /b 1
)

set "EXPORTDB=%GAMEDIR%\Mods\export\10man-idle.db"
set "DATADIR=%SCRIPTDIR%..\data"
set "PUBLICDIR=%SCRIPTDIR%..\website\public"

if not exist "%EXPORTDB%" (
    echo Error: %EXPORTDB% not found.
    echo Launch the game with mods to generate the export.
    exit /b 1
)

echo Copying exported database...

if not exist "%DATADIR%" mkdir "%DATADIR%"
copy "%EXPORTDB%" "%DATADIR%\10man-idle.db" >nul
echo   -> %DATADIR%\10man-idle.db

if not exist "%PUBLICDIR%" mkdir "%PUBLICDIR%"
copy "%EXPORTDB%" "%PUBLICDIR%\10man-idle.db" >nul
echo   -> %PUBLICDIR%\10man-idle.db

echo Done!
