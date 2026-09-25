@echo off
title PSLE Primary 6 Chinese Flashcard Video Studio
cls
echo =========================================================================
echo   PSLE Primary 6 Chinese Flashcard Video Studio
echo   新加坡教育部 (MOE) 小六华文闪卡短视频生成系统
echo =========================================================================
echo.
echo [1] Starting server for Web Browser and Mobile Phone...
echo [2] PC Access URL:      http://localhost:5173
echo [3] Mobile Access URL:  http://192.168.1.227:5173
echo.
echo Launching your browser now...
echo.

start http://localhost:5173
npm run dev -- --host
pause
