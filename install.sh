#!/bin/bash

# Shift Installer Script for Linux
# Restore your workflow in seconds.
# Author: Muhamad Dzarel Alghifari
# GitHub: https://github.com/DzarelDeveloper/Shift

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

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
    echo -e "Installer: ${WHITE}Downloading Latest Release${NC}"
    echo -e "Author: ${BLUE}Muhamad Dzarel Alghifari${NC}"
    print_divider
}

print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }
print_step() { echo -e "${PURPLE}[$1]${NC} $2"; }

print_banner
echo ""

# Check for curl or wget
if command -v curl &> /dev/null; then
    API_CMD="curl -s"
elif command -v wget &> /dev/null; then
    API_CMD="wget -qO-"
else
    print_error "Neither curl nor wget is installed. Please install one of them."
    exit 1
fi

print_step "1" "Fetching latest release information..."
RELEASE_DATA=$($API_CMD "https://api.github.com/repos/DzarelDeveloper/Shift/releases/latest")

if [ -z "$RELEASE_DATA" ]; then
    print_error "Failed to fetch release data from GitHub API."
    exit 1
fi

VERSION=$(echo "$RELEASE_DATA" | grep '"tag_name":' | cut -d '"' -f 4)
if [ -z "$VERSION" ]; then
    print_error "Could not parse version from GitHub API response."
    exit 1
fi
print_success "Found version: $VERSION"

print_step "2" "Detecting OS and package manager..."

if command -v apt-get &> /dev/null; then
    PKG_TYPE="deb"
    INSTALL_CMD="sudo apt-get install -y"
elif command -v dnf &> /dev/null || command -v yum &> /dev/null || command -v rpm &> /dev/null; then
    PKG_TYPE="rpm"
    INSTALL_CMD="sudo rpm -i"
else
    PKG_TYPE="AppImage"
    INSTALL_CMD=""
fi

print_info "Detected package type: $PKG_TYPE"

print_step "3" "Locating $PKG_TYPE asset..."
ASSET_URL=$(echo "$RELEASE_DATA" | grep '"browser_download_url":' | grep "\.$PKG_TYPE" | head -n 1 | cut -d '"' -f 4)

if [ -z "$ASSET_URL" ]; then
    print_error "Could not find a .$PKG_TYPE installer for version $VERSION."
    exit 1
fi

print_info "Download URL: $ASSET_URL"

print_step "4" "Downloading Shift..."
TEMP_DIR="$(mktemp -d)"
FILE_NAME="shift-$VERSION.$PKG_TYPE"
DOWNLOAD_PATH="$TEMP_DIR/$FILE_NAME"

if command -v curl &> /dev/null; then
    curl -L "$ASSET_URL" -o "$DOWNLOAD_PATH"
else
    wget "$ASSET_URL" -O "$DOWNLOAD_PATH"
fi

print_success "Download complete."

print_step "5" "Installing Shift..."
if [ "$PKG_TYPE" = "AppImage" ]; then
    INSTALL_DIR="$HOME/.local/bin"
    mkdir -p "$INSTALL_DIR"
    cp "$DOWNLOAD_PATH" "$INSTALL_DIR/shift.AppImage"
    chmod +x "$INSTALL_DIR/shift.AppImage"
    
    # Create symlink
    ln -sf "$INSTALL_DIR/shift.AppImage" "$INSTALL_DIR/shift"
    
    # Create desktop shortcut
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
    print_success "AppImage installed to $INSTALL_DIR"
else
    print_info "Administrator privileges (sudo) are required to install .$PKG_TYPE packages."
    $INSTALL_CMD "$DOWNLOAD_PATH"
    print_success "Package installed."
fi

# Clean up
rm -rf "$TEMP_DIR"

echo ""
print_divider
echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  Shift installed successfully!                              ║"
echo "║                                                            ║"
echo "║  Shift is now available in your application menu!          ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
