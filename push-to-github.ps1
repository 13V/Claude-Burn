# Claude Burn GitHub Push Script
# This script initializes and pushes ONLY the relevant bot and web folders.

# 1. Create a clean .gitignore for the root
$gitignoreContent = @"
node_modules/
.env
*.db
*.log
.next/
dist/
build/
out/
.DS_Store
"@
Set-Content -Path .gitignore -Value $gitignoreContent

# 2. Initialize Git
git init
git remote add origin https://github.com/13V/Claude-Burn.git

# 3. Add files (Bot and Web only)
git add claude-burn-bot/ claudeburn-web/ .gitignore

# 4. Commit
git commit -m "Initial commit: Claude Burn Bot & Web Dashboard"

# 5. Push (This will prompt you for your GitHub credentials)
git branch -M main
Write-Host "`nReady to push! GitHub will now ask for your credentials (Username/Token)." -ForegroundColor Cyan
git push -u origin main
