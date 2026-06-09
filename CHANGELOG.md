# Shift Changelog

## v0.5.7 (2026-06-10)

### New Features
- Complete production release process implemented
- Version centralization with single source of truth (src/config/app.ts)
- AppInfo hook (useAppInfo) to get live Tauri version
- VersionBadge reusable component for UI

### Improvements
- Installed app detection now properly includes `id` field in Rust backend
- Added detailed debug logging for app detection and versioning
- Export utilities now use centralized version config
- Fixed duplicate `get_default_launcher_shortcut` function in main.rs

### Bug Fixes
- Installed apps not appearing in launcher (missing id field fixed)
- Fixed potential duplicate window issues
- Improved Linux .desktop file parsing

### Architecture Changes
- Centralized app metadata in src/config/app.ts
- Added src/components/VersionBadge.tsx and src/hooks/useAppInfo.ts
- Updated workspaceUtils to use APP_CONFIG for export version

### Known Issues
- ESLint warnings still present (formatting issues)
- Clippy warnings in Rust code (minor)
