@echo off
setlocal

REM Dev launcher: builds mods and runs the game with DOTNET_STARTUP_HOOKS
REM set directly via environment variable (no install/proxy needed).

set "SCRIPTDIR=%~dp0"

REM Read GameDir from Directory.Build.props.user or fall back to env var
set "GAMEDIR="
if exist "%SCRIPTDIR%..\Directory.Build.props.user" (
    for /f "tokens=2 delims=<>" %%a in ('findstr /i "GameDir" "%SCRIPTDIR%..\Directory.Build.props.user"') do (
        set "GAMEDIR=%%a"
    )
)
if "%GAMEDIR%"=="" set "GAMEDIR=%TENMAN_GAME_DIR%"

if "%GAMEDIR%"=="" (
    echo Error: GameDir not configured.
    echo Set it in Directory.Build.props.user or TENMAN_GAME_DIR env var.
    exit /b 1
)

echo Game directory: %GAMEDIR%
echo.

REM Build
echo Building mods...
dotnet build "%SCRIPTDIR%10ManIdle-Mods.sln" -c Debug -p:GameDir="%GAMEDIR%"
if errorlevel 1 (
    echo Build failed!
    exit /b 1
)

REM Copy files to game directory for testing
echo.
echo Copying files...
copy "%SCRIPTDIR%src\ModLoader\bin\Debug\net8.0\ModLoader.dll" "%GAMEDIR%\" >nul
copy "%SCRIPTDIR%src\SpeedMod\bin\Debug\net8.0\0Harmony.dll" "%GAMEDIR%\" >nul
if not exist "%GAMEDIR%\Mods\plugins" mkdir "%GAMEDIR%\Mods\plugins"
if not exist "%GAMEDIR%\Mods\config" mkdir "%GAMEDIR%\Mods\config"
copy "%SCRIPTDIR%src\SpeedMod\bin\Debug\net8.0\SpeedMod.dll" "%GAMEDIR%\Mods\plugins\" >nul
if not exist "%GAMEDIR%\Mods\config\SpeedMod.json" (
    copy "%SCRIPTDIR%config\SpeedMod.json" "%GAMEDIR%\Mods\config\" >nul
)

REM Launch with startup hook
echo.
echo Launching game with mods...
set "DOTNET_STARTUP_HOOKS=%GAMEDIR%\ModLoader.dll"
start "" "%GAMEDIR%\10ManIdle.exe"
