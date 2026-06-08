#!/bin/bash
# Script: fix-shift-icons.sh
# Fungsi: Memperbaiki icon aplikasi yang tidak ditemukan oleh Shift dengan symlink ke icon GNOME/Ubuntu standard
# Penggunaan: chmod +x fix-shift-icons.sh && ./fix-shift-icons.sh

# -------------------------- KONFIGURASI --------------------------
LOCAL_ICONS_DIR="$HOME/.local/share/icons/hicolor/scalable/apps"
SYSTEM_ICONS_DIR="/usr/share/icons/hicolor/scalable/apps"

# Daftar mapping icon yang hilang ke icon GNOME standard
declare -A ICON_MAPPING=(
    # [nama-icon-yang-hilang]="path-icon-alternatif"
    ["preferences-system-network"]="org.gnome.Settings.svg"
    ["multimedia-volume-control"]="org.gnome.Settings-sound.svg"
    ["preferences-system"]="org.gnome.Settings.svg"
    ["application-x-executable"]="org.gnome.Nautilus.svg"
    ["mark-location-symbolic"]="org.gnome.Maps.svg"
    ["applications-system-symbolic"]="org.gnome.Terminal.svg"
    ["input-keyboard"]="org.gnome.Settings-keyboard.svg"
    ["document-print-preview"]="org.gnome.Evince.svg"
    ["drive-removable-media"]="org.gnome.DiskUtility.svg"
    ["network-wireless-symbolic"]="org.gnome.Settings-wifi.svg"
    ["dialog-information"]="org.gnome.Software.svg"
    ["preferences-ubuntu-panel"]="org.gnome.Settings.svg"
    ["system-software-update"]="org.gnome.Software.svg"
)

# -------------------------- EKSEKUSI --------------------------
echo "=== Memulai perbaikan icon Shift ==="
echo ""

# 1. Buat direktori icon lokal jika belum ada
echo "1. Membuat direktori icon lokal..."
mkdir -p "$LOCAL_ICONS_DIR"
echo "   ✅ Direktori siap: $LOCAL_ICONS_DIR"
echo ""

# 2. Loop setiap mapping dan buat symlink
echo "2. Membuat symbolic link untuk icon yang hilang..."
for icon_name in "${!ICON_MAPPING[@]}"; do
    target_icon="${ICON_MAPPING[$icon_name]}"
    source_path="$SYSTEM_ICONS_DIR/$target_icon"
    dest_path="$LOCAL_ICONS_DIR/$icon_name.svg"
    
    # Cek apakah icon sumber ada
    if [ ! -f "$source_path" ]; then
        echo "   ⚠️  Icon sumber tidak ditemukan: $source_path. Melewatkan..."
        continue
    fi
    
    # Hapus symlink lama jika ada
    if [ -L "$dest_path" ]; then
        rm "$dest_path"
    fi
    
    # Buat symlink
    ln -s "$source_path" "$dest_path"
    echo "   ✅ Berhasil symlink: $icon_name.svg -> $target_icon"
done
echo ""

# 3. Update icon cache
echo "3. Memperbarui icon cache..."
gtk-update-icon-cache -f -t "$HOME/.local/share/icons/hicolor"
echo "   ✅ Icon cache berhasil diperbarui!"
echo ""

echo "=== Selesai! Silakan klik 'Refresh' di aplikasi Shift untuk melihat perubahan! ==="
