#!/bin/bash

# Shift Uninstaller Script
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
INSTALL_DIR="$HOME/.local/share/shift"
BIN_DIR="$HOME/.local/bin"

print_divider() {
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
}

print_banner() {
    print_divider
    echo -e "${RED}"
    echo " ███████╗██╗  ██╗██╗███████╗████████╗    ██╗   ██╗███╗   ██╗██╗███╗   ██╗███████╗████████╗ █████╗ ██╗     ██╗ "
    echo " ██╔════╝██║  ██║██║██╔════╝╚══██╔══╝    ██║   ██║████╗  ██║██║████╗  ██║██╔════╝╚══██╔══╝██╔══██╗██║     ██║ "
    echo " ███████╗███████║██║█████╗     ██║       ██║   ██║██╔██╗ ██║██║██╔██╗ ██║███████╗   ██║   ███████║██║     ██║ "
    echo " ╚════██║██╔══██║██║██╔══╝     ██║       ██║   ██║██║╚██╗██║██║██║╚██╗██║╚════██║   ██║   ██╔══██║██║     ██║ "
    echo " ███████║██║  ██║██║██║        ██║       ╚██████╔╝██║ ╚████║██║██║ ╚████║███████║   ██║   ██║  ██║███████╗███████╗ "
    echo " ╚══════╝╚═╝  ╚═╝╚═╝╚═╝        ╚═╝        ╚═════╝ ╚═╝  ╚═══╝╚═╝╚═╝  ╚═══╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝╚══════╝ "
    echo -e "${NC}"
    echo -e "Version: ${GREEN}${APP_VERSION}${NC}"
    echo -e "Author: ${BLUE}${AUTHOR}${NC}"
    echo -e "GitHub: ${CYAN}${GITHUB_URL}${NC}"
    print_divider
}

print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }

print_banner
echo ""

print_warning "This will completely remove Shift from your system!"
echo ""

# Check for non-interactive flag
NON_INTERACTIVE=0
for arg in "$@"; do
    if [ "$arg" = "--non-interactive" ] || [ "$arg" = "-y" ]; then
        NON_INTERACTIVE=1
    fi
done
# Check for purge-data flag
PURGE_DATA=0
for arg in "$@"; do
    if [ "$arg" = "--purge-data" ]; then
        PURGE_DATA=1
    fi
done

if [ $NON_INTERACTIVE -eq 1 ]; then
    print_info "Non-interactive mode: proceeding with uninstallation..."
else
    if [ -t 0 ]; then
        echo -ne "${BLUE}Are you sure you want to continue? (y/N):${NC} "
        read -r REPLY
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Uninstallation cancelled."
            exit 0
        fi
    else
        print_info "Non-interactive mode (no tty): proceeding with uninstallation..."
    fi
fi
echo ""

print_info "Stopping Shift if running..."
pkill -f "shift" 2>/dev/null || true
print_success "Check complete!"

# Preserve user data directories; only remove binary and desktop entries
declare -a SHIFT_FILES=(
    "$BIN_DIR/shift"
    "$HOME/Desktop/shift.desktop"
    "$HOME/.local/share/applications/shift.desktop"
)

# Remove files (binary and shortcuts)
for file in "${SHIFT_FILES[@]}"; do
    if [ -f "$file" ] || [ -L "$file" ]; then
        print_info "Removing file: $file"
        rm -f "$file"
        print_success "File removed!"
    fi
done


# Remove files
for file in "${SHIFT_FILES[@]}"; do
    if [ -f "$file" ] || [ -L "$file" ]; then
        print_info "Removing file: $file"
        rm -f "$file"
        print_success "File removed!"
    fi
done

echo ""
print_divider
echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  Shift uninstalled successfully!                            ║"
echo "║                                                            ║"
echo "║  All related files and folders have been removed.          ║"
echo "║  We're sorry to see you go! If you have feedback, please    ║"
echo "║  open an issue on GitHub: ${GITHUB_URL}                     ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
