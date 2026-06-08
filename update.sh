#!/bin/bash

# Shift Updater Script
# Restore your workflow in seconds.
# Version: 0.5.0
# Author: Muhamad Dzarel Alghifari
# GitHub: https://github.com/DzarelDeveloper/Shift

set -e
set -o pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'

APP_VERSION="0.5.0"
AUTHOR="Muhamad Dzarel Alghifari"
GITHUB_URL="https://github.com/DzarelDeveloper/Shift"

print_divider() {
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
}

print_banner() {
    print_divider
    echo -e "${PURPLE}"
    echo " ███████╗██╗  ██╗██╗███████╗████████╗    ██╗   ██╗██████╗ ██████╗  █████╗ ████████╗███████╗ "
    echo " ██╔════╝██║  ██║██║██╔════╝╚══██╔══╝    ██║   ██║██╔══██╗██╔══██╗██╔══██╗╚══██╔══╝██╔════╝ "
    echo " ███████╗███████║██║█████╗     ██║       ██║   ██║██████╔╝██║  ██║███████║   ██║   █████╗ "
    echo " ╚════██║██╔══██║██║██╔══╝     ██║       ██║   ██║██╔═══╝ ██║  ██║██╔══██║   ██║   ██╔══╝ "
    echo " ███████║██║  ██║██║██║        ██║       ╚██████╔╝██║     ██████╔╝██║  ██║   ██║   ███████╗ "
    echo " ╚══════╝╚═╝  ╚═╝╚═╝╚═╝        ╚═╝        ╚═════╝ ╚═╝     ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚══════╝ "
    echo -e "${NC}"
    echo -e "Current Version: ${GREEN}${APP_VERSION}${NC}"
    echo -e "Author: ${BLUE}${AUTHOR}${NC}"
    echo -e "GitHub: ${CYAN}${GITHUB_URL}${NC}"
    print_divider
}

print_step() { local step_num=$1; local step_desc=$2; echo -e "${PURPLE}[${step_num}]${NC} ${step_desc}"; }
print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

print_banner
echo ""

print_info "Updating Shift..."
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

# Step 1: Uninstall old version
print_step "2" "Removing old version..."
if [ -f "$WORK_DIR/uninstall.sh" ]; then
    bash "$WORK_DIR/uninstall.sh" --non-interactive 2>/dev/null || true
    print_success "Old version removed!"
else
    print_warning "uninstall.sh not found, trying to remove common files manually..."
    # Manual cleanup if uninstall.sh not available
    declare -a SHIFT_DIRS=(
        "$HOME/.local/share/shift"
        "$HOME/.config/shift"
        "$HOME/.cache/shift"
        "$XDG_CONFIG_HOME/shift"
        "$XDG_DATA_HOME/shift"
        "$XDG_CACHE_HOME/shift"
    )
    declare -a SHIFT_FILES=(
        "$HOME/.local/bin/shift"
        "$HOME/Desktop/shift.desktop"
        "$HOME/.local/share/applications/shift.desktop"
    )
    for dir in "${SHIFT_DIRS[@]}"; do rm -rf "$dir" 2>/dev/null; done
    for file in "${SHIFT_FILES[@]}"; do rm -f "$file" 2>/dev/null; done
    pkill -f "shift" 2>/dev/null || true
fi

# Step 2: Install new version
print_step "3" "Installing new version..."
if [ -f "$WORK_DIR/install.sh" ]; then
    cd "$WORK_DIR"
    bash ./install.sh
else
    print_error "install.sh not found! Cannot proceed with update."
    exit 1
fi

echo ""
print_divider
echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  Shift updated successfully!                                ║"
echo "║                                                            ║"
echo "║  Shift is now available in your application menu!          ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
