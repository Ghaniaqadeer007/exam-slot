@echo off
title Virtual University LMS Portal
echo ========================================================
echo   Virtual University LMS - Production Full-Stack Server
echo ========================================================
set "PATH=%~dp0node_bin\node-v20.18.0-win-x64;%PATH%"
echo Starting server on http://localhost:5000 ...
start http://localhost:5000
node server\index.js
pause
