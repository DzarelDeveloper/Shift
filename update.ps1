# Shift Updater Script for Windows
# Restore your workflow in seconds.
# Author: Muhamad Dzarel Alghifari
# GitHub: https://github.com/DzarelDeveloper/Shift

$ErrorActionPreference = "Stop"

Write-Host "Running Shift Updater..." -ForegroundColor Blue

# Re-run the installer (it now downloads the latest release automatically)
Invoke-Expression (Invoke-WebRequest -Uri "https://raw.githubusercontent.com/DzarelDeveloper/Shift/main/install.ps1" -UseBasicParsing).Content
