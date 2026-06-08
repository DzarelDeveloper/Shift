# Shift Uninstaller Script for Windows
# Restore your workflow in seconds.
# Version: 0.5.0
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

# Remove install directory
if (Test-Path $INSTALL_DIR) {
    Write-Host "Removing Shift installation directory..." -ForegroundColor Yellow
    Remove-Item -Path $INSTALL_DIR -Recurse -Force
}

# Remove from PATH
Write-Host "Removing from PATH..." -ForegroundColor Yellow
$Path = [Environment]::GetEnvironmentVariable("Path", "User")
$NewPath = ($Path -split ';' | Where-Object { $_ -ne $INSTALL_DIR }) -join ';'
[Environment]::SetEnvironmentVariable("Path", $NewPath, "User")

# Remove shortcuts
Write-Host "Removing shortcuts..." -ForegroundColor Yellow
$DesktopShortcut = "$env:USERPROFILE\Desktop\Shift.lnk"
if (Test-Path $DesktopShortcut) { Remove-Item -Path $DesktopShortcut -Force }

$StartMenuDir = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs"
$StartMenuShortcut = "$StartMenuDir\Shift.lnk"
if (Test-Path $StartMenuShortcut) { Remove-Item -Path $StartMenuShortcut -Force }

Write-Host "Shift uninstalled successfully!" -ForegroundColor Green
