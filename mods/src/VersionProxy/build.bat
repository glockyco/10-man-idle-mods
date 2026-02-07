@echo off
REM Build version.dll proxy using MSVC (cl.exe)
REM Run from a Visual Studio Developer Command Prompt

cl /LD /O2 /W4 version.c /Fe:version.dll /link kernel32.lib user32.lib
