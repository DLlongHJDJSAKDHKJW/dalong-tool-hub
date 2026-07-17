@echo off
setlocal
cd /d "%~dp0"
node scripts\build-installer.js
set EXIT_CODE=%ERRORLEVEL%
if not defined CODEX_NO_PAUSE pause
exit /b %EXIT_CODE%
