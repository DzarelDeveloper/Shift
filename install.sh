#!/bin/bash

# Shift Installer Script
# Restore your workflow in seconds.
# Version: 0.5.0
# Author: Muhamad Dzarel Alghifari
# GitHub: https://github.com/DzarelDeveloper/Shift

set -e  # Exit on error
set -o pipefail  # Exit if any command in a pipeline fails

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

APP_VERSION="0.5.0"
AUTHOR="Muhamad Dzarel Alghifari"
GITHUB_URL="https://github.com/DzarelDeveloper/Shift"
INSTALL_DIR="$HOME/.local/share/shift"
BIN_DIR="$HOME/.local/bin"

print_divider() {
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
}

print_banner() {
    print_divider
    echo -e "${PURPLE}"
    echo " ███████╗██╗  ██╗██╗███████╗████████╗    ██╗███╗   ██╗███████╗████████╗ █████╗ ██╗     ██╗ "
    echo " ██╔════╝██║  ██║██║██╔════╝╚══██╔══╝    ██║████╗  ██║██╔════╝╚══██╔══╝██╔══██╗██║     ██║ "
    echo " ███████╗███████║██║█████╗     ██║       ██║██╔██╗ ██║███████╗   ██║   ███████║██║     ██║ "
    echo " ╚════██║██╔══██║██║██╔══╝     ██║       ██║██║╚██╗██║╚════██║   ██║   ██╔══██║██║     ██║ "
    echo " ███████║██║  ██║██║██║        ██║       ██║██║ ╚████║███████║   ██║   ██║  ██║███████╗███████╗ "
    echo " ╚══════╝╚═╝  ╚═╝╚═╝╚═╝        ╚═╝       ╚═╝╚═╝  ╚═══╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝╚══════╝ "
    echo -e "${NC}"
    echo -e "Version: ${GREEN}${APP_VERSION}${NC}"
    echo -e "Author: ${BLUE}${AUTHOR}${NC}"
    echo -e "GitHub: ${CYAN}${GITHUB_URL}${NC}"
    print_divider
}

print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }
print_step() { local step_num=$1; local step_desc=$2; echo -e "${PURPLE}[${step_num}]${NC} ${step_desc}"; }

print_banner
echo ""

# Function to clean up temp directory
cleanup() {
    if [ -n "$TEMP_DIR" ] && [ -d "$TEMP_DIR" ]; then
        print_info "Cleaning up temporary files..."
        rm -rf "$TEMP_DIR"
    fi
}
trap cleanup EXIT

# Check if we're in the repository directory
if [ -f "package.json" ] && [ -d "src-tauri" ]; then
    print_info "Running from repository directory..."
    WORK_DIR="$(pwd)"
else
    # Clone repository to temp directory
    print_step "1" "Cloning Shift repository..."
    TEMP_DIR="$(mktemp -d)"
    git clone --depth 1 "$GITHUB_URL" "$TEMP_DIR"
    WORK_DIR="$TEMP_DIR"
    cd "$WORK_DIR"
    print_success "Repository cloned!"
fi

# Create install directories
print_step "2" "Creating install directories..."
mkdir -p "$INSTALL_DIR"
mkdir -p "$BIN_DIR"
print_success "Directories created!"

print_step "3" "Installing dependencies..."
cd "$WORK_DIR"
npm install
print_success "Dependencies installed!"

print_step "4" "Building Shift with Tauri..."
# Try to build, allow bundling to fail as long as binary is created
npm run tauri build || true
# Check if binary exists even if bundling failed
if [ -f "$WORK_DIR/src-tauri/target/release/shift" ]; then
    print_success "Build complete!"
else
    print_error "Failed to build Shift!"
    exit 1
fi

print_step "5" "Installing Shift..."

# Copy the built binary
if [ -f "$WORK_DIR/src-tauri/target/release/shift" ]; then
    cp "$WORK_DIR/src-tauri/target/release/shift" "$INSTALL_DIR/"
    chmod +x "$INSTALL_DIR/shift"
    print_success "Binary copied to install directory!"
else
    print_error "Could not find built binary!"
    exit 1
fi

# Create symlink
if [ -f "$INSTALL_DIR/shift" ]; then
    ln -sf "$INSTALL_DIR/shift" "$BIN_DIR/shift"
    print_success "Symlink created at $BIN_DIR/shift"
fi

# Create desktop shortcut
print_step "6" "Creating desktop shortcut..."
DESKTOP_FILE="$HOME/.local/share/applications/shift.desktop"
mkdir -p "$(dirname "$DESKTOP_FILE")"
cat > "$DESKTOP_FILE" << EOL
[Desktop Entry]
Name=Shift
Comment=Restore your workflow in seconds
Exec="$INSTALL_DIR/shift"
Icon=utilities-terminal
Terminal=false
Type=Application
Categories=Utility;
EOL
chmod +x "$DESKTOP_FILE"
print_success "Desktop shortcut created!"

echo ""
print_divider
echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  Shift installed successfully!                              ║"
echo "║                                                            ║"
echo "║  Shift is now available in your application menu!          ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
