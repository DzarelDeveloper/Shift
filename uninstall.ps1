# Shift Uninstaller Script for Windows
# Restore your workflow in seconds.
# Author: Muhamad Dzarel Alghifari
# GitHub: https://github.com/DzarelDeveloper/Shift

$ErrorActionPreference = "Stop"
$INSTALL_DIR = "$env:LOCALAPPDATA\Shift"

Write-Host "Running Shift Uninstaller..." -ForegroundColor Red

# Stop Shift if it's running
try {
    $Process = Get-Process -Name "Shift" -ErrorAction SilentlyContinue
    if ($Process) {
        Write-Host "Stopping Shift process..." -ForegroundColor Yellow
        Stop-Process -Name "Shift" -Force
        Start-Sleep -Seconds 2
    }
} catch {
    Write-Host "Shift is not running" -ForegroundColor Blue
}

$UninstallerPath = "$INSTALL_DIR\Uninstall Shift.exe"

if (Test-Path $UninstallerPath) {
    Write-Host "Running official uninstaller..." -ForegroundColor Yellow
    # Run NSIS uninstaller silently
    Start-Process -FilePath $UninstallerPath -ArgumentList "/S" -Wait -NoNewWindow
    Write-Host "Shift uninstalled successfully!" -ForegroundColor Green
    exit 0
}

# Fallback manual removal
Write-Host "Official uninstaller not found, running manual cleanup..." -ForegroundColor Yellow

if (Test-Path $INSTALL_DIR) {
    Write-Host "Removing Shift installation directory..." -ForegroundColor Yellow
    Remove-Item -Path $INSTALL_DIR -Recurse -Force
}

# Remove shortcuts
Write-Host "Removing shortcuts..." -ForegroundColor Yellow
$DesktopShortcut = "$env:USERPROFILE\Desktop\Shift.lnk"
if (Test-Path $DesktopShortcut) { Remove-Item -Path $DesktopShortcut -Force }

$StartMenuDir = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs"
$StartMenuShortcut = "$StartMenuDir\Shift.lnk"
if (Test-Path $StartMenuShortcut) { Remove-Item -Path $StartMenuShortcut -Force }

Write-Host "Shift uninstalled successfully!" -ForegroundColor Green
