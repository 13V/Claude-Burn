@echo off
echo ==========================================
echo   WILDFIRE WEBSITE DEPLOYMENT LAUNCHER
echo ==========================================
echo.
echo Navigate to project...
cd wildfire-web

echo.
echo Starting Vercel Deployment...
echo [IMPORTANT] Press 'Y' if asked to set up/deploy.
echo [IMPORTANT] Press 'Enter' if asked to log in (browser will open).
echo.

call npx vercel --prod

echo.
echo ==========================================
echo   DEPLOYMENT FINISHED
echo ==========================================
pause
