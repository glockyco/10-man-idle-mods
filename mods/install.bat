@echo off
setlocal enabledelayedexpansion

REM Install 10-Man Idle mods into the game directory.
REM Usage: install.bat "E:\SteamLibrary\steamapps\common\10-Man Idle"

if "%~1"=="" (
    echo Usage: install.bat "path\to\10-Man Idle"
    echo.
    echo Example: install.bat "E:\SteamLibrary\steamapps\common\10-Man Idle"
    exit /b 1
)

set "GAMEDIR=%~1"
set "SCRIPTDIR=%~dp0"

if not exist "%GAMEDIR%\10ManIdle.exe" (
    echo Error: 10ManIdle.exe not found in "%GAMEDIR%"
    exit /b 1
)

echo Installing mods to: %GAMEDIR%
echo.

REM Build mods
echo Building mods...
dotnet build "%SCRIPTDIR%10ManIdle-Mods.sln" -c Release -p:GameDir="%GAMEDIR%" >nul 2>&1
if errorlevel 1 (
    echo Error: Build failed. Make sure .NET 8 SDK is installed.
    exit /b 1
)

REM Backup runtimeconfig.json
set "CONFIG=%GAMEDIR%\10ManIdle.runtimeconfig.json"
if not exist "%CONFIG%.bak" (
    echo Backing up runtimeconfig.json...
    copy "%CONFIG%" "%CONFIG%.bak" >nul
)

REM Copy ModLoader and Harmony to game root
echo Copying ModLoader...
copy "%SCRIPTDIR%src\ModLoader\bin\Release\net8.0\ModLoader.dll" "%GAMEDIR%\" >nul
copy "%SCRIPTDIR%src\SpeedMod\bin\Release\net8.0\0Harmony.dll" "%GAMEDIR%\" >nul

REM Create mod directories
if not exist "%GAMEDIR%\Mods\plugins" mkdir "%GAMEDIR%\Mods\plugins"
if not exist "%GAMEDIR%\Mods\config" mkdir "%GAMEDIR%\Mods\config"

REM Copy mod plugins
echo Copying SpeedMod...
copy "%SCRIPTDIR%src\SpeedMod\bin\Release\net8.0\SpeedMod.dll" "%GAMEDIR%\Mods\plugins\" >nul

echo Copying DataExporter...
copy "%SCRIPTDIR%src\DataExporter\bin\Release\net8.0\DataExporter.dll" "%GAMEDIR%\Mods\plugins\" >nul
copy "%SCRIPTDIR%src\DataExporter\bin\Release\net8.0\Microsoft.Data.Sqlite.dll" "%GAMEDIR%\Mods\plugins\" >nul
copy "%SCRIPTDIR%src\DataExporter\bin\Release\net8.0\SQLitePCLRaw.core.dll" "%GAMEDIR%\Mods\plugins\" >nul
copy "%SCRIPTDIR%src\DataExporter\bin\Release\net8.0\SQLitePCLRaw.batteries_v2.dll" "%GAMEDIR%\Mods\plugins\" >nul
copy "%SCRIPTDIR%src\DataExporter\bin\Release\net8.0\SQLitePCLRaw.provider.e_sqlite3.dll" "%GAMEDIR%\Mods\plugins\" >nul
if exist "%SCRIPTDIR%src\DataExporter\bin\Release\net8.0\runtimes" (
    xcopy /s /y /q "%SCRIPTDIR%src\DataExporter\bin\Release\net8.0\runtimes" "%GAMEDIR%\Mods\plugins\runtimes\" >nul
)

REM Copy default config (don't overwrite existing)
if not exist "%GAMEDIR%\Mods\config\SpeedMod.json" (
    copy "%SCRIPTDIR%config\SpeedMod.json" "%GAMEDIR%\Mods\config\" >nul
)

REM Patch runtimeconfig.json
set "LOADER=%GAMEDIR%\ModLoader.dll"
findstr /c:"DOTNET_STARTUP_HOOKS" "%CONFIG%" >nul 2>&1
if errorlevel 1 (
    echo Patching runtimeconfig.json...

    REM Build the escaped loader path for JSON
    set "ESCAPED_LOADER=!LOADER:\=\\!"

    REM Use PowerShell to patch the JSON properly
    powershell -NoProfile -Command ^
        "$c = Get-Content '%CONFIG%' -Raw; " ^
        "$j = $c | ConvertFrom-Json; " ^
        "$j.runtimeOptions.configProperties | Add-Member -NotePropertyName 'DOTNET_STARTUP_HOOKS' -NotePropertyValue '%LOADER%' -Force; " ^
        "$j | ConvertTo-Json -Depth 10 | Set-Content '%CONFIG%' -Encoding UTF8"
) else (
    echo runtimeconfig.json already patched.
)

echo.
echo Installation complete! Launch the game normally through Steam.
echo Press F1 in-game to cycle speed: 1x / 2x / 5x / 10x
