# Shift Installer Script for Windows
# Restore your workflow in seconds.
# Author: Muhamad Dzarel Alghifari
# GitHub: https://github.com/DzarelDeveloper/Shift

$ErrorActionPreference = "Stop"

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
    Write-ColorOutput $Colors.White "Installer: Downloading Latest Release"
    Write-ColorOutput $Colors.Blue "Author: Muhamad Dzarel Alghifari"
    Write-ColorOutput $Colors.Cyan "═══════════════════════════════════════════════════════════════"
}

Print-Banner
Write-Host ""

Write-ColorOutput $Colors.Purple "[1] Fetching latest release information..."
$ApiUrl = "https://api.github.com/repos/DzarelDeveloper/Shift/releases/latest"
try {
    $Release = Invoke-RestMethod -Uri $ApiUrl -UseBasicParsing
    $Version = $Release.tag_name
    Write-ColorOutput $Colors.Green "[SUCCESS] Found version: $Version"
} catch {
    Write-ColorOutput $Colors.Red "[ERROR] Failed to fetch release from GitHub API. Please check your internet connection."
    exit 1
}

Write-ColorOutput $Colors.Purple "[2] Locating Windows installer asset..."
$AssetUrl = $null
foreach ($asset in $Release.assets) {
    if ($asset.name -match ".*-setup\.exe$") {
        $AssetUrl = $asset.browser_download_url
        break
    }
}

if (-not $AssetUrl) {
    Write-ColorOutput $Colors.Red "[ERROR] Could not find the Windows installer (.exe) for version $Version."
    exit 1
}

$TempExe = "$env:TEMP\Shift-Installer-$Version.exe"

Write-ColorOutput $Colors.Purple "[3] Downloading installer..."
Write-ColorOutput $Colors.Blue "    Url: $AssetUrl"
try {
    Invoke-WebRequest -Uri $AssetUrl -OutFile $TempExe -UseBasicParsing
    Write-ColorOutput $Colors.Green "[SUCCESS] Download complete."
} catch {
    Write-ColorOutput $Colors.Red "[ERROR] Failed to download the installer."
    exit 1
}

Write-ColorOutput $Colors.Purple "[4] Installing Shift silently..."
try {
    # Run NSIS installer silently
    Start-Process -FilePath $TempExe -ArgumentList "/S" -Wait -NoNewWindow
    Write-ColorOutput $Colors.Green "[SUCCESS] Installation finished."
} catch {
    Write-ColorOutput $Colors.Red "[ERROR] Failed to run the installer."
    exit 1
}

# Clean up
if (Test-Path $TempExe) {
    Remove-Item -Path $TempExe -Force
}

Write-Host ""
Write-ColorOutput $Colors.Cyan "═══════════════════════════════════════════════════════════════"
Write-ColorOutput $Colors.Green "
╔════════════════════════════════════════════════════════════╗
║  Shift installed successfully!                              ║
║                                                            ║
║  Shift is now available in your Start Menu and Desktop!    ║
╚════════════════════════════════════════════════════════════╝
"
