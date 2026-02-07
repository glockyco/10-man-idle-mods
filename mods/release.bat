@echo off
setlocal

REM Build a release ZIP containing all mod files ready for distribution.

set "SCRIPTDIR=%~dp0"
set "OUTDIR=%SCRIPTDIR%out"

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

REM Build release
echo Building release...
dotnet build "%SCRIPTDIR%10ManIdle-Mods.sln" -c Release -p:GameDir="%GAMEDIR%"
if errorlevel 1 (
    echo Build failed!
    exit /b 1
)

REM Stage release files
if exist "%OUTDIR%" rd /s /q "%OUTDIR%"
mkdir "%OUTDIR%"
mkdir "%OUTDIR%\Mods\plugins"
mkdir "%OUTDIR%\Mods\config"

copy "%SCRIPTDIR%src\ModLoader\bin\Release\net8.0\ModLoader.dll" "%OUTDIR%\" >nul
copy "%SCRIPTDIR%src\SpeedMod\bin\Release\net8.0\0Harmony.dll" "%OUTDIR%\" >nul
copy "%SCRIPTDIR%src\SpeedMod\bin\Release\net8.0\SpeedMod.dll" "%OUTDIR%\Mods\plugins\" >nul
copy "%SCRIPTDIR%config\SpeedMod.json" "%OUTDIR%\Mods\config\" >nul
copy "%SCRIPTDIR%install.bat" "%OUTDIR%\" >nul
copy "%SCRIPTDIR%uninstall.bat" "%OUTDIR%\" >nul

REM Create ZIP
echo.
echo Creating release archive...
set "ZIPNAME=10ManIdle-Mods.zip"
if exist "%SCRIPTDIR%%ZIPNAME%" del "%SCRIPTDIR%%ZIPNAME%"
powershell -NoProfile -Command "Compress-Archive -Path '%OUTDIR%\*' -DestinationPath '%SCRIPTDIR%%ZIPNAME%'"

echo.
echo Release built: %SCRIPTDIR%%ZIPNAME%
echo.
echo Contents:
echo   ModLoader.dll          - Mod loader (copy to game root)
echo   0Harmony.dll           - Harmony library (copy to game root)
echo   Mods\plugins\SpeedMod.dll - Speed mod plugin
echo   Mods\config\SpeedMod.json - Default config
echo   install.bat            - Installer script
echo   uninstall.bat          - Uninstaller script

REM Cleanup staging
rd /s /q "%OUTDIR%"
