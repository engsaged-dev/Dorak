@echo off
cd /d "%~dp0"
node backup.js
if "%1"=="" pause
