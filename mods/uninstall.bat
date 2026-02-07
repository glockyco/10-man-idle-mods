@echo off
setlocal

REM Uninstall 10-Man Idle mods from the game directory.
REM Usage: uninstall.bat "E:\SteamLibrary\steamapps\common\10-Man Idle"

if "%~1"=="" (
    echo Usage: uninstall.bat "path\to\10-Man Idle"
    exit /b 1
)

set "GAMEDIR=%~1"

echo Uninstalling mods from: %GAMEDIR%
echo.

REM Restore runtimeconfig.json backup
set "CONFIG=%GAMEDIR%\10ManIdle.runtimeconfig.json"
if exist "%CONFIG%.bak" (
    echo Restoring runtimeconfig.json...
    copy "%CONFIG%.bak" "%CONFIG%" >nul
    del "%CONFIG%.bak"
)

REM Remove mod files
echo Removing mod files...
if exist "%GAMEDIR%\ModLoader.dll" del "%GAMEDIR%\ModLoader.dll"
if exist "%GAMEDIR%\0Harmony.dll" del "%GAMEDIR%\0Harmony.dll"
if exist "%GAMEDIR%\version.dll" del "%GAMEDIR%\version.dll"
if exist "%GAMEDIR%\Mods\plugins" rd /s /q "%GAMEDIR%\Mods\plugins"
if exist "%GAMEDIR%\Mods\modloader.log" del "%GAMEDIR%\Mods\modloader.log"
if exist "%GAMEDIR%\Mods\modloader-error.log" del "%GAMEDIR%\Mods\modloader-error.log"

REM Preserve config directory for user settings
if exist "%GAMEDIR%\Mods\config" (
    echo Note: Mods\config\ preserved for your settings.
    echo       Delete it manually if you want a clean removal.
)

echo.
echo Uninstallation complete.
