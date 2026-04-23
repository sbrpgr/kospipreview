@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\publish_youtube_news.ps1" %*
exit /b %ERRORLEVEL%
