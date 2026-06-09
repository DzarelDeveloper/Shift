#!/bin/bash

# Shift Updater Script for Linux
# Restore your workflow in seconds.
# Author: Muhamad Dzarel Alghifari
# GitHub: https://github.com/DzarelDeveloper/Shift

set -e  # Exit on error

# Colors for output
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}[INFO]${NC} Running Shift Updater..."

# Re-run the installer (it now downloads the latest release automatically)
if command -v curl &> /dev/null; then
    curl -fsSL https://raw.githubusercontent.com/DzarelDeveloper/Shift/main/install.sh | bash
elif command -v wget &> /dev/null; then
    wget -qO- https://raw.githubusercontent.com/DzarelDeveloper/Shift/main/install.sh | bash
else
    echo "Neither curl nor wget is installed. Please install one of them."
    exit 1
fi
