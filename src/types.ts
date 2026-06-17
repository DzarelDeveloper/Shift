/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AppConfig {
  name: string;
  path: string; // executable path like "C:/Program Files/Microsoft VS Code/Code.exe"
  icon?: string;
}

export interface WebsiteConfig {
  name: string;
  url: string; // URL like "https://github.com"
}

export interface FolderConfig {
  name: string;
  path: string; // folder path like "D:/Projects"
}

export interface InstalledApp {
  id: string;
  name: string;
  path: string;
  icon?: string;
}

export interface Workspace {
  id: string;
  name: string;
  description: string;
  applications: AppConfig[];
  websites: WebsiteConfig[];
  folders: FolderConfig[];
  shortcut?: string; // custom activation shortcut
  createdAt: string;
}

export type LauncherItem =
  | { type: 'workspace'; data: Workspace }
  | { type: 'app'; data: InstalledApp };

export interface ShiftExportData {
  version: string;
  exportedAt: string;
  workspaces: Workspace[];
  preferences?: {
    launchAtStartup?: boolean;
    minimizeToTray?: boolean;
    shortcutKey?: string;
    dashboardShortcutKey?: string;
    autoBypassPreview?: boolean;
  };
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeConfig {
  mode: ThemeMode;
  accentColor: string;
}

export type PlatformType = 'windows' | 'macos' | 'linux';

export interface LauncherState {
  isOpen: boolean;
  searchQuery: string;
  selectedIndex: number;
}

export interface SystemInfo {
  platform: string;
  os_version: string;
  arch: string;
}

export interface RawInstalledApp {
  name: string;
  path: string;
  icon?: string;
}

export interface RawSystemInfo {
  platform: string;
  os_version: string;
  arch: string;
}

export interface PackageInfo {
  name: string;
  version: string | null;
  installed: boolean;
  install_path: string | null;
  install_date: string | null;
  has_update: boolean;
}
