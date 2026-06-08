# Shift Installer Script for Windows
# Restore your workflow in seconds.
# Version: 0.5.0
# Author: Muhamad Dzarel Alghifari
# GitHub: https://github.com/DzarelDeveloper/Shift

param(
    [switch]$Force
)

$ErrorActionPreference = "Stop"
$APP_VERSION = "0.5.0"
$AUTHOR = "Muhamad Dzarel Alghifari"
$GITHUB_URL = "https://github.com/DzarelDeveloper/Shift"
$INSTALL_DIR = "$env:LOCALAPPDATA\Shift"
$TEMP_DIR = "$env:TEMP\ShiftInstaller"

# Colors for output
$Colors = @{
    Red = [ConsoleColor]::Red
    Green = [ConsoleColor]::Green
    Yellow = [ConsoleColor]::Yellow
    Blue = [ConsoleColor]::Blue
    Cyan = [ConsoleColor]::Cyan
    Purple = [ConsoleColor]::Magenta
    White = [ConsoleColor]::White
}

function Write-ColorOutput($ForegroundColor, $Message) {
    Write-Host $Message -ForegroundColor $ForegroundColor
}

function Print-Banner() {
    Write-ColorOutput $Colors.Cyan "═══════════════════════════════════════════════════════════════"
    Write-ColorOutput $Colors.Purple "
 ███████╗██╗  ██╗██╗███████╗████████╗    ██╗███╗   ██╗███████╗████████╗ █████╗ ██╗     ██╗ 
 ██╔════╝██║  ██║██║██╔════╝╚══██╔══╝    ██║████╗  ██║██╔════╝╚══██╔══╝██╔══██╗██║     ██║ 
 ███████╗███████║██║█████╗     ██║       ██║██╔██╗ ██║███████╗   ██║   ███████║██║     ██║ 
 ╚════██║██╔══██║██║██╔══╝     ██║       ██║██║╚██╗██║╚════██║   ██║   ██╔══██║██║     ██║ 
 ███████║██║  ██║██║██║        ██║       ██║██║ ╚████║███████║   ██║   ██║  ██║███████╗███████╗ 
 ╚══════╝╚═╝  ╚═╝╚═╝╚═╝        ╚═╝       ╚═╝╚═╝  ╚═══╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝╚══════╝ 
"
    Write-ColorOutput $Colors.White "Version: $APP_VERSION"
    Write-ColorOutput $Colors.Blue "Author: $AUTHOR"
    Write-ColorOutput $Colors.Cyan "GitHub: $GITHUB_URL"
    Write-ColorOutput $Colors.Cyan "═══════════════════════════════════════════════════════════════"
}

function Cleanup() {
    if (Test-Path $TEMP_DIR) {
        Write-ColorOutput $Colors.Blue "[INFO] Cleaning up temporary files..."
        Remove-Item -Path $TEMP_DIR -Recurse -Force
    }
}

# Register cleanup on exit
Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action { Cleanup } | Out-Null

Print-Banner
Write-Host ""

# Check if running in repository directory
if ((Test-Path "package.json") -and (Test-Path "src-tauri")) {
    Write-ColorOutput $Colors.Blue "[INFO] Running from repository directory..."
    $WORK_DIR = Get-Location
} else {
    # Clone repository to temp directory
    Write-ColorOutput $Colors.Purple "[1] Cloning Shift repository..."
    New-Item -Path $TEMP_DIR -ItemType Directory -Force | Out-Null
    git clone --depth 1 $GITHUB_URL $TEMP_DIR
    $WORK_DIR = $TEMP_DIR
    Write-ColorOutput $Colors.Green "[SUCCESS] Repository cloned!"
}

# Create install directories
Write-ColorOutput $Colors.Purple "[2] Creating install directories..."
New-Item -Path $INSTALL_DIR -ItemType Directory -Force | Out-Null
Write-ColorOutput $Colors.Green "[SUCCESS] Directories created!"

# Install dependencies
Write-ColorOutput $Colors.Purple "[3] Installing dependencies..."
Set-Location $WORK_DIR
npm install
Write-ColorOutput $Colors.Green "[SUCCESS] Dependencies installed!"

# Build Shift
Write-ColorOutput $Colors.Purple "[4] Building Shift with Tauri..."
npm run tauri build
if (-not (Test-Path "$WORK_DIR\src-tauri\target\release\shift.exe")) {
    Write-ColorOutput $Colors.Red "[ERROR] Failed to build Shift!"
    exit 1
}
Write-ColorOutput $Colors.Green "[SUCCESS] Build complete!"

# Install the app
Write-ColorOutput $Colors.Purple "[5] Installing Shift..."
Copy-Item -Path "$WORK_DIR\src-tauri\target\release\shift.exe" -Destination "$INSTALL_DIR\Shift.exe" -Force

# Add to PATH (user)
$Path = [Environment]::GetEnvironmentVariable("Path", "User")
if ($Path -notlike "*$INSTALL_DIR*") {
    [Environment]::SetEnvironmentVariable("Path", "$Path;$INSTALL_DIR", "User")
    Write-ColorOutput $Colors.Green "[SUCCESS] Added to PATH!"
}

# Create desktop shortcut
Write-ColorOutput $Colors.Purple "[6] Creating desktop shortcut..."
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$env:USERPROFILE\Desktop\Shift.lnk")
$Shortcut.TargetPath = "$INSTALL_DIR\Shift.exe"
$Shortcut.WorkingDirectory = "$INSTALL_DIR"
$Shortcut.Save()

# Create start menu shortcut
$StartMenuDir = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs"
$StartMenuShortcut = $WshShell.CreateShortcut("$StartMenuDir\Shift.lnk")
$StartMenuShortcut.TargetPath = "$INSTALL_DIR\Shift.exe"
$StartMenuShortcut.WorkingDirectory = "$INSTALL_DIR"
$StartMenuShortcut.Save()

Write-ColorOutput $Colors.Green "[SUCCESS] Desktop and Start Menu shortcuts created!"

Write-Host ""
Write-ColorOutput $Colors.Cyan "═══════════════════════════════════════════════════════════════"
Write-ColorOutput $Colors.Green "
╔════════════════════════════════════════════════════════════╗
║  Shift installed successfully!                              ║
║                                                            ║
║  Shift is now available in your Start Menu and Desktop!    ║
╚════════════════════════════════════════════════════════════╝
"
