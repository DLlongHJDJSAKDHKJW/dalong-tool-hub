@echo off
setlocal
cd /d "%~dp0"

where npm >nul 2>nul
if errorlevel 1 (
  echo [错误] 未检测到 npm，请先安装 Node.js。
  if not defined CODEX_NO_PAUSE pause
  exit /b 1
)

if not exist "node_modules\electron" (
  echo [错误] 未检测到项目依赖，请先在当前目录执行 npm install。
  if not defined CODEX_NO_PAUSE pause
  exit /b 1
)

npm start
set EXIT_CODE=%ERRORLEVEL%

if not defined CODEX_NO_PAUSE pause
exit /b %EXIT_CODE%
