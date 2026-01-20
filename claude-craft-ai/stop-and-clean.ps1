# stop-and-clean.ps1
# Simple robust reset script

Write-Host "🛑 Stopping processes..." -ForegroundColor Yellow
taskkill /F /IM java.exe /T 2>$null
taskkill /F /IM ts-node.exe /T 2>$null
Start-Sleep -Seconds 2

Write-Host "🧹 Deleting world..." -ForegroundColor Yellow
$world = "..\\minecraft-server\\world"
if (Test-Path $world) {
    Remove-Item -Path $world -Recurse -Force
    Write-Host "✅ Deleted." -ForegroundColor Green
}
else {
    Write-Host "ℹ️ Already clean."
}

Write-Host "🚀 Reset complete."
