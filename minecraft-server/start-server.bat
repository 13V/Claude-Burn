@echo off
echo Starting Minecraft Server for Claude Craft AI...
echo.
echo Server will be available at localhost:25565
echo Press Ctrl+C to stop the server
echo.
java -Xmx2G -Xms1G -jar server.jar nogui
pause
