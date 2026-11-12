@echo off
rem Runs backup.js every day at 11:00 PM (Windows Task Scheduler). Run this file once.
schtasks /Create /F /SC DAILY /ST 23:00 /TN "Dorak daily backup" /TR "\"%~dp0backup.bat\" auto"
echo.
echo Done: Dorak backup will run every day at 11:00 PM (the computer must be on).
pause
