@echo off
echo 🛑 STOPPING ALL PROCESSES...
taskkill /F /IM java.exe /T 2>nul
taskkill /F /IM ts-node.exe /T 2>nul

echo 🛡️ CLEARING PORT 3000 (Viewer)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do taskkill /F /PID %%a 2>nul

echo 🛡️ CLEARING PORT 3001 (HUD)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001 ^| findstr LISTENING') do taskkill /F /PID %%a 2>nul

echo 🛡️ CLEARING PORT 25566 (Relay)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :25566 ^| findstr LISTENING') do taskkill /F /PID %%a 2>nul

timeout /t 2 /nobreak >nul

echo 🧹 DELETING WORLD...
if exist "..\minecraft-server\world" rd /s /q "..\minecraft-server\world"

echo ✅ ENVIRONMENT CLEANED.
