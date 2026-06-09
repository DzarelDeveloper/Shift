# Icon Cache Cleanup Guide

If you notice that Shift is still displaying its old icon, your operating system may be caching the previous application assets. Follow the instructions below to reset the icon cache for your respective platform.

## Windows

1. Press `Win + R`, type `cmd`, and press `Ctrl + Shift + Enter` to open an Administrator Command Prompt.
2. Run the following commands to kill the explorer process, delete the icon cache, and restart the explorer:

```bat
ie4uinit.exe -show
taskkill /IM explorer.exe /F
DEL /A /Q "%localappdata%\IconCache.db"
DEL /A /F /Q "%localappdata%\Microsoft\Windows\Explorer\iconcache*"
shutdown /r /f /t 00
```
*(Note: The last command will restart your computer.)*

## macOS

1. Open the **Terminal** app.
2. Run the following commands to flush the icon cache:

```bash
sudo rm -rf /Library/Caches/com.apple.iconservices.store
sudo find /private/var/folders/ \( -name com.apple.dock.iconcache -or -name com.apple.iconservices \) -exec rm -rf {} \;
killall Dock
killall Finder
```

## Linux

1. Open a terminal.
2. Run the following commands to update the system icon cache and desktop database:

```bash
gtk-update-icon-cache -f -t /usr/share/icons/hicolor
update-desktop-database ~/.local/share/applications
update-desktop-database /usr/share/applications
```
If you still see the old icon, you can try logging out and logging back in, or running:
```bash
rm -rf ~/.cache/icon-cache.kcache
```
(for KDE Plasma) or restarting GNOME Shell (`Alt + F2`, type `r`, press Enter).
