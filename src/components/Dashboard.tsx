/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Trash2,
  Edit,
  Terminal,
  Globe,
  Folder,
  Save,
  X,
  Copy,
  Play,
  Command,
  Sliders,
  ChevronRight,
  CheckCircle2,
  ChevronDown,
  Settings,
  Search,
  AppWindow,
  Heart,
  Cpu,
  Chrome,
  Compass,
  MessageSquare,
  Music,
  RefreshCw,
  Code,
  Slack,
  Keyboard,
  Brush,
  BookOpen,
  ShieldAlert,
  Upload,
  Download,
  Palette,
  Info,
  HardDrive,
  Calculator,
  Image,
  FileText,
  Mail,
  Calendar,
  Video,
  Wifi,
  Printer,
} from 'lucide-react';
import {
  Workspace,
  AppConfig,
  WebsiteConfig,
  FolderConfig,
  PlatformType,
  ThemeConfig,
  RawInstalledApp,
  RawSystemInfo,
  InstalledApp,
} from '../types';
import {
  generateWindowsPowershell,
  generateMacosScript,
  generateLinuxScript,
  downloadScript,
} from '../utils/scriptGenerator';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../App';
import logoUrl from '../assets/logo.png';
import { VersionBadge } from './VersionBadge';
import { AppInfoCard } from './AppInfoCard';
import { useAppInfo } from '../hooks/useAppInfo';

interface DashboardProps {
  workspaces: Workspace[];
  setWorkspaces: React.Dispatch<React.SetStateAction<Workspace[]>>;
  onLaunchWorkspace: (workspace: Workspace) => void;
  launchAtStartup: boolean;
  setLaunchAtStartup: (val: boolean) => void;
  minimizeToTray: boolean;
  setMinimizeToTray: (val: boolean) => void;
  shortcutKey: string;
  setShortcutKey: (val: string) => void;
  autoBypassPreview: boolean;
  setAutoBypassPreview: (val: boolean) => void;
  isMinimized: boolean;
  setIsMinimized: (val: boolean) => void;
  triggerToast: (
    title: string,
    desc: string,
    type?: 'success' | 'info'
  ) => void;
}

export default function Dashboard({
  workspaces,
  setWorkspaces,
  onLaunchWorkspace,
  launchAtStartup,
  setLaunchAtStartup,
  minimizeToTray,
  setMinimizeToTray,
  shortcutKey,
  setShortcutKey,
  autoBypassPreview,
  setAutoBypassPreview,
  isMinimized,
  setIsMinimized,
  triggerToast,
}: DashboardProps) {
  const { theme, setTheme, exportWorkspaces, importWorkspaces, apps, setApps } =
    useAppContext();
  const [appsLoading] = useState(false);
  const { version: appVersion } = useAppInfo();

  // Simple desktop tabs: "home" | "workspaces" | "applications" | "settings" | "about"
  const [activeTab, setActiveTab] = useState<
    'home' | 'workspaces' | 'applications' | 'settings' | 'about'
  >('home');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // State untuk sistem info
  const [systemInfo, setSystemInfo] = useState<RawSystemInfo | null>(null);

  // Initialize autostart
  useEffect(() => {
    const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;
    if (isTauri) {
      import('@tauri-apps/api/core')
        .then(async (core) => {
          const { invoke } = core;
          const isEnabled = await invoke('plugin:autostart|is_enabled');
          setLaunchAtStartup(isEnabled as boolean);
        })
        .catch((e) => console.error('Failed to initialize autostart:', e));
    }
  }, []);

  // Handle autostart change
  const handleAutostartChange = async (enabled: boolean) => {
    setLaunchAtStartup(enabled);
    const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;
    if (isTauri) {
      const core = await import('@tauri-apps/api/core');
      const { invoke } = core;
      if (enabled) {
        await invoke('plugin:autostart|enable');
      } else {
        await invoke('plugin:autostart|disable');
      }
      triggerToast(
        'Setting Updated',
        `Launch at startup is now ${enabled ? 'enabled' : 'disabled'}`,
        'info'
      );
    }
  };

  // Track recently launched workspaces (up to 3 unique IDs)
  const [recentLaunchIds, setRecentLaunchIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('shift_recent_launches');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [copiedId, setCopiedId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [osAppSearchQuery, setOsAppSearchQuery] = useState('');
  const [activeAppDropdown, setActiveAppDropdown] = useState<string | null>(
    null
  );

  const [workspaceHealth, setWorkspaceHealth] = useState<{
    healthy: boolean;
    brokenPaths: string[];
  } | null>(null);
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);

  // Helper: Dapatkan OS saat ini secara otomatis
  const getCurrentPlatform = (): PlatformType => {
    if (typeof window !== 'undefined') {
      const userAgent = window.navigator.userAgent.toLowerCase();
      if (userAgent.includes('win')) return 'windows';
      if (userAgent.includes('mac')) return 'macos';
      return 'linux';
    }
    return 'linux';
  };

  const currentPlatform = getCurrentPlatform();

  // Fetch apps and system info on mount and listen to open-settings event
  useEffect(() => {
    console.log('Dashboard mounted!');
    console.log('typeof window:', typeof window);

    // Coba langsung import @tauri-apps/api/core tanpa cek __TAURI__ terlebih dahulu
    Promise.all([
      import('@tauri-apps/api/core'),
      import('@tauri-apps/api/event'),
    ])
      .then(async ([core, event]) => {
        console.log('Successfully imported core and event!');
        const { invoke } = core;
        const { listen } = event;
        console.log('Calling get_installed_apps... NOW!');
        // Fetch apps directly from Dashboard to test!
        try {
          const installedApps = await invoke('get_installed_apps');
          console.log('Successfully got get_installed_apps:');
          console.log('apps:', installedApps);
          console.log('apps.length:', (installedApps as any[]).length);

          // Now set it to the context!
          setApps(installedApps as InstalledApp[]);
        } catch (e) {
          console.error('get_installed_apps ERROR:', e);
        }
        console.log('Calling get_system_info...');
        // Fetch system info
        invoke('get_system_info')
          .then((info) => {
            console.log('Got system info:', info);
            setSystemInfo(info as RawSystemInfo);
          })
          .catch((e) => console.error('get_system_info error:', e));
        // Listen to open-settings event
        listen('open-settings', () => {
          setActiveTab('settings');
        });
      })
      .catch((e) => {
        console.log(
          'Error importing Tauri modules (probably not in Tauri environment):',
          e
        );
        // No fallback, just set empty state
      });

    const handleSwitchTab = (e: any) => {
      setActiveTab(e.detail);
    };
    window.addEventListener('switch-tab', handleSwitchTab);
    return () => window.removeEventListener('switch-tab', handleSwitchTab);
  }, [setApps]); // Add setApps as dependency!

  const handleManualFetchApps = async () => {
    console.log('handleManualFetchApps clicked!');
    if (typeof window !== 'undefined' && '__TAURI__' in window) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        console.log('Calling get_installed_apps MANUALLY!');
        const installedApps = await invoke('get_installed_apps');
        console.log('MANUAL get_installed_apps result:');
        console.log('apps:', installedApps);
        console.log('apps.length:', (installedApps as any[]).length);
        // Save to context!
        setApps(installedApps as InstalledApp[]);
      } catch (e) {
        console.error('MANUAL fetch error:', e);
      }
    }
  };

  // Selected workspace in detailed workspaces configurations view
  const [selectedExportWorkspace, setSelectedExportWorkspace] =
    useState<string>(workspaces[0]?.id || '');

  useEffect(() => {
    const exportWsObj =
      workspaces.find((w) => w.id === selectedExportWorkspace) || workspaces[0];
    if (exportWsObj) {
      setCheckingHealth(true);
      import('../utils/workspaceUtils').then(({ checkWorkspaceHealth }) => {
        checkWorkspaceHealth(exportWsObj).then((health) => {
          setWorkspaceHealth(health);
          setCheckingHealth(false);
        });
      });
    }
  }, [selectedExportWorkspace, workspaces]);

  const handleCheckUpdates = async () => {
    setIsCheckingUpdate(true);
    try {
      const { check } = await import('@tauri-apps/plugin-updater');
      const update = await check();
      if (update) {
        triggerToast(
          'Update Found',
          `Downloading update ${update.version}...`,
          'info'
        );
        await update.downloadAndInstall();
        triggerToast(
          'Update Complete',
          'Please restart Shift to apply the update.',
          'success'
        );
      } else {
        triggerToast('Up to Date', 'You are on the latest version.', 'info');
      }
    } catch (err) {
      console.error('Failed to check for updates:', err);
      triggerToast(
        'Update Check Failed',
        'Could not check for updates right now.',
        'info'
      );
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  // Edit / Create Form state
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(
    null
  );
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Form input field state
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formApps, setFormApps] = useState<AppConfig[]>([]);
  const [formLinks, setFormLinks] = useState<WebsiteConfig[]>([]);
  const [formFolders, setFormFolders] = useState<FolderConfig[]>([]);

  // Sub-item drafts
  const [newAppName, setNewAppName] = useState('');
  const [newAppPath, setNewAppPath] = useState('');
  const [newLinkName, setNewLinkName] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderPath, setNewFolderPath] = useState('');

  // Start creating brand-new workspace
  const handleStartCreate = () => {
    setFormName('');
    setFormDesc('');
    setFormApps([]);
    setFormLinks([]);
    setFormFolders([]);
    setNewAppName('');
    setNewAppPath('');
    setNewLinkName('');
    setNewLinkUrl('');
    setNewFolderName('');
    setNewFolderPath('');
    setIsCreatingNew(true);
    setEditingWorkspace(null);
  };

  // Start editing existing workspace
  const handleStartEdit = (ws: Workspace) => {
    setEditingWorkspace(ws);
    setFormName(ws.name);
    setFormDesc(ws.description);
    setFormApps([...ws.applications]);
    setFormLinks([...ws.websites]);
    setFormFolders([...ws.folders]);
    setNewAppName('');
    setNewAppPath('');
    setNewLinkName('');
    setNewLinkUrl('');
    setNewFolderName('');
    setNewFolderPath('');
    setIsCreatingNew(false);
  };

  // Save changes/creation
  const handleSaveWorkspaceForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('Please provide a name for your workspace profile.');
      return;
    }

    const modifiedWorkspaceBase = {
      name: formName.trim(),
      description:
        formDesc.trim() || `Workspace channels for ${formName.trim()}`,
      applications: formApps,
      websites: formLinks,
      folders: formFolders,
    };

    if (isCreatingNew) {
      const newWs: Workspace = {
        id: `ws-${Date.now()}`,
        ...modifiedWorkspaceBase,
        createdAt: new Date().toISOString(),
      };
      const updated = [newWs, ...workspaces];
      setWorkspaces(updated);
      setSelectedExportWorkspace(newWs.id);
    } else if (editingWorkspace) {
      const updated = workspaces.map((w) => {
        if (w.id === editingWorkspace.id) {
          return {
            ...w,
            ...modifiedWorkspaceBase,
          };
        }
        return w;
      });
      setWorkspaces(updated);
    }

    // Reset modals
    setEditingWorkspace(null);
    setIsCreatingNew(false);
  };

  // Delete workspace
  const handleDeleteWorkspace = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const ws = workspaces.find((w) => w.id === id);
    if (ws && confirm(`Are you sure you want to delete "${ws.name}"?`)) {
      const remaining = workspaces.filter((w) => w.id !== id);
      setWorkspaces(remaining);
      if (selectedExportWorkspace === id && remaining.length > 0) {
        setSelectedExportWorkspace(remaining[0].id);
      }
    }
  };

  const handleLaunchWithTelemetry = (ws: Workspace) => {
    // Record recent launch
    const updated = [
      ws.id,
      ...recentLaunchIds.filter((id) => id !== ws.id),
    ].slice(0, 3);
    setRecentLaunchIds(updated);
    try {
      localStorage.setItem('shift_recent_launches', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    onLaunchWorkspace(ws);
  };

  // Copy helper
  const handleCopyScriptText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(label);
    setTimeout(() => setCopiedId(''), 2000);
  };

  // Direct app insertion helper
  const handleAddAppDirectToWorkspace = (
    appName: string,
    appPath: string,
    workspaceId: string
  ) => {
    setWorkspaces((prev) =>
      prev.map((ws) => {
        if (ws.id === workspaceId) {
          if (ws.applications.some((a) => a.name === appName)) {
            triggerToast(
              'In Workspace',
              `${appName} is already part of ${ws.name}!`,
              'info'
            );
            return ws;
          }
          const updated = [
            ...ws.applications,
            { name: appName, path: appPath },
          ];
          triggerToast(
            'Added to Workflow',
            `Integrated ${appName} into ${ws.name} successfully.`,
            'success'
          );
          return { ...ws, applications: updated };
        }
        return ws;
      })
    );
  };

  // Filtered lists based on search
  const filteredWorkspaces = workspaces.filter((ws) => {
    return (
      ws.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ws.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const exportWsObj =
    workspaces.find((w) => w.id === selectedExportWorkspace) || workspaces[0];

  return (
    <div
      className='w-full h-full min-h-screen flex font-sans select-none overflow-x-hidden antialiased'
      style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
    >
      {/* ========================================================= */}
      {/* SIDEBAR: HOME | WORKSPACES | APPLICATIONS | SETTINGS      */}
      {/* ========================================================= */}
      <aside
        className='w-[220px] border-r flex-shrink-0 flex flex-col justify-between h-screen sticky top-0'
        style={{
          borderColor: 'var(--border-color)',
          backgroundColor:
            'color-mix(in srgb, var(--bg-color) 95%, transparent)',
        }}
      >
        <div className='p-5 space-y-6'>
          {/* Rebranded Desk Emblem */}
          <div className='flex items-center gap-1'>
            <div
              className='w-7 h-7 rounded-lg flex items-center justify-center shadow-inner overflow-hidden flex-shrink-0'
              style={{ backgroundColor: 'var(--card-bg)' }}
            >
              <img
                src={logoUrl}
                alt='Shift Logo'
                className='w-full h-full object-cover'
              />
            </div>
            <AppInfoCard compact />
          </div>

          {/* New Workspace Direct Action */}
          <button
            onClick={handleStartCreate}
            className='w-full py-2 px-3 hover:opacity-90 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm'
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border-color)',
              borderWidth: '1px',
              color: 'var(--text-color)',
            }}
          >
            <Plus
              className='w-3.5 h-3.5 stroke-[2]'
              style={{ color: 'var(--text-color)', opacity: 0.7 }}
            />
            <span>New Workspace</span>
          </button>

          {/* Navigation Items (Home, Workspaces, Applications, Settings) */}
          <div className='space-y-1'>
            <span className='text-[9px] font-mono text-zinc-500 dark:text-zinc-650 tracking-wider pl-2 block mb-1 uppercase font-semibold'>
              Workspace
            </span>

            <button
              onClick={() => {
                setActiveTab('home');
                setSearchQuery('');
              }}
              className='w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-all'
              style={{
                backgroundColor:
                  activeTab === 'home' ? 'var(--card-bg)' : 'transparent',
                color: 'var(--text-color)',
              }}
            >
              <div className='flex items-center gap-2'>
                <AppWindow
                  className='w-3.5 h-3.5'
                  style={{ color: 'var(--text-color)', opacity: 0.6 }}
                />
                <span>Home</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('workspaces')}
              className='w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-all'
              style={{
                backgroundColor:
                  activeTab === 'workspaces' ? 'var(--card-bg)' : 'transparent',
                color: 'var(--text-color)',
              }}
            >
              <div className='flex items-center gap-2'>
                <Sliders
                  className='w-3.5 h-3.5'
                  style={{ color: 'var(--text-color)', opacity: 0.6 }}
                />
                <span>Workspaces</span>
              </div>
              <span
                className='text-[10px] px-1.5 py-0.5 rounded font-medium font-mono'
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--border-color)',
                  borderWidth: '1px',
                  color: 'var(--text-color)',
                  opacity: 0.8,
                }}
              >
                {workspaces.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('applications')}
              className='w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-all'
              style={{
                backgroundColor:
                  activeTab === 'applications'
                    ? 'var(--card-bg)'
                    : 'transparent',
                color: 'var(--text-color)',
              }}
            >
              <div className='flex items-center gap-2'>
                <Terminal
                  className='w-3.5 h-3.5'
                  style={{ color: 'var(--text-color)', opacity: 0.6 }}
                />
                <span>Applications</span>
              </div>
              <span
                className='text-[10px] px-1.5 py-0.5 rounded font-medium font-mono'
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--border-color)',
                  borderWidth: '1px',
                  color: 'var(--text-color)',
                  opacity: 0.8,
                }}
              >
                {apps.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className='w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-all'
              style={{
                backgroundColor:
                  activeTab === 'settings' ? 'var(--card-bg)' : 'transparent',
                color: 'var(--text-color)',
              }}
            >
              <div className='flex items-center gap-2'>
                <Settings
                  className='w-3.5 h-3.5'
                  style={{ color: 'var(--text-color)', opacity: 0.6 }}
                />
                <span>Settings</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('about')}
              className='w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-all'
              style={{
                backgroundColor:
                  activeTab === 'about' ? 'var(--card-bg)' : 'transparent',
                color: 'var(--text-color)',
              }}
            >
              <div className='flex items-center gap-2'>
                <Info
                  className='w-3.5 h-3.5'
                  style={{ color: 'var(--text-color)', opacity: 0.6 }}
                />
                <span>About</span>
              </div>
            </button>
          </div>
        </div>

        {/* Small version marker */}
        <div
          className='p-4 text-center border-t'
          style={{
            borderColor:
              'color-mix(in srgb, var(--border-color) 60%, transparent)',
          }}
        >
          <VersionBadge
            className='text-[9px] block'
            style={{ color: 'var(--text-color)', opacity: 0.6 }}
          />
        </div>
      </aside>

      {/* ========================================================= */}
      {/* MAIN LAYOUT ACCORDING TO VIEWPORT                         */}
      {/* ========================================================= */}
      <main
        className='flex-1 flex flex-col min-w-0'
        style={{
          backgroundColor:
            'color-mix(in srgb, var(--bg-color) 70%, transparent)',
        }}
      >
        <div className='flex-1 overflow-y-auto'>
          {/* 1. HOME TAB */}
          {activeTab === 'home' && (
            <div className='max-w-2xl mx-auto w-full px-6 py-12 space-y-8 flex-1 flex flex-col justify-start'>
              {/* BRANDING TITLE HEADER */}
              <div className='space-y-1 block text-center sm:text-left'>
                <h1
                  className='text-3xl font-extrabold tracking-tight flex items-center gap-2 justify-center sm:justify-start'
                  style={{ color: 'var(--text-color)' }}
                >
                  <img
                    src={logoUrl}
                    alt='Shift Logo'
                    className='w-8 h-8 rounded-lg shadow-sm'
                  />
                  <span>hift</span>
                </h1>
                <p
                  className='text-sm font-sans pl-1 transition-colors'
                  style={{ color: 'var(--text-color)', opacity: 0.7 }}
                >
                  Restore your workflow in seconds.
                </p>
              </div>

              {/* TOP: Modern Search Bar and Global hotkey hint */}
              <div className='space-y-4'>
                <div className='relative'>
                  <Search
                    className='absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5'
                    style={{ color: 'var(--text-color)', opacity: 0.5 }}
                  />
                  <input
                    type='text'
                    placeholder='Search workspaces or applications...'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className='w-full pl-12 pr-5 py-4 text-base rounded-2xl focus:outline-none transition-all font-sans'
                    style={{
                      backgroundColor: 'var(--card-bg)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-color)',
                    }}
                    autoFocus
                  />
                </div>

                <div className='flex items-center justify-between text-[11px] font-mono px-1'>
                  <span style={{ color: 'var(--text-color)', opacity: 0.6 }}>
                    Type to filter instantly
                  </span>
                  <div
                    className='flex items-center gap-2 px-3 py-1.5 rounded-xl border'
                    style={{
                      backgroundColor: 'var(--bg-color)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-color)',
                      opacity: 0.8,
                    }}
                  >
                    <span style={{ color: 'var(--text-color)', opacity: 0.6 }}>
                      Global Shortcut:
                    </span>
                    <kbd className='font-semibold'>
                      {shortcutKey || 'Ctrl+Alt+Space'}
                    </kbd>
                  </div>
                </div>
              </div>

              {/* RECENT WORKSPACES PANEL */}
              {recentLaunchIds.length > 0 && searchQuery === '' && (
                <div className='space-y-2.5 pt-1'>
                  <h3
                    className='text-[10px] font-mono font-bold uppercase tracking-widest flex items-center gap-1.5'
                    style={{ color: 'var(--text-color)', opacity: 0.6 }}
                  >
                    <span
                      className='w-1 h-3 inline-block rounded-sm'
                      style={{
                        backgroundColor: 'var(--text-color)',
                        opacity: 0.4,
                      }}
                    ></span>
                    <span>Recent Workspaces</span>
                  </h3>
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-2.5'>
                    {workspaces
                      .filter((ws) => recentLaunchIds.includes(ws.id))
                      .sort(
                        (a, b) =>
                          recentLaunchIds.indexOf(a.id) -
                          recentLaunchIds.indexOf(b.id)
                      )
                      .map((ws) => {
                        const iconHtml = (() => {
                          const lowerName = ws.name.toLowerCase();
                          if (
                            lowerName.includes('code') ||
                            lowerName.includes('coding')
                          )
                            return (
                              <Code className='w-3.5 h-3.5 text-blue-400' />
                            );
                          if (
                            lowerName.includes('design') ||
                            lowerName.includes('art')
                          )
                            return (
                              <Brush className='w-3.5 h-3.5 text-pink-400' />
                            );
                          if (
                            lowerName.includes('study') ||
                            lowerName.includes('learn') ||
                            lowerName.includes('school')
                          )
                            return (
                              <BookOpen className='w-3.5 h-3.5 text-emerald-400' />
                            );
                          if (
                            lowerName.includes('cyber') ||
                            lowerName.includes('security') ||
                            lowerName.includes('hack')
                          )
                            return (
                              <ShieldAlert className='w-3.5 h-3.5 text-red-400' />
                            );
                          return (
                            <Sliders className='w-3.5 h-3.5 text-amber-400' />
                          );
                        })();

                        return (
                          <div
                            key={`recent-${ws.id}`}
                            className='flex items-center justify-between p-3.5 rounded-xl transition-all select-none group hover:opacity-90'
                            style={{
                              backgroundColor:
                                'color-mix(in srgb, var(--card-bg) 30%, transparent)',
                              borderColor: 'var(--border-color)',
                              borderWidth: '1px',
                            }}
                          >
                            <div className='min-w-0 pr-3 flex items-center gap-2.5'>
                              <span
                                className='p-1.5 rounded-lg'
                                style={{
                                  backgroundColor: 'var(--bg-color)',
                                  borderColor: 'var(--border-color)',
                                  borderWidth: '1px',
                                }}
                              >
                                {iconHtml}
                              </span>
                              <div className='min-w-0'>
                                <span
                                  className='text-xs font-bold block truncate group-hover:text-accent transition-colors'
                                  style={{ color: 'var(--text-color)' }}
                                >
                                  {ws.name}
                                </span>
                                <span
                                  className='text-[9px] font-mono block'
                                  style={{
                                    color: 'var(--text-color)',
                                    opacity: 0.6,
                                  }}
                                >
                                  Environment ready
                                </span>
                              </div>
                            </div>
                            <button
                              type='button'
                              onClick={() => handleLaunchWithTelemetry(ws)}
                              className='p-1 px-3 rounded text-[10px] font-semibold transition-all flex items-center gap-1 cursor-pointer'
                              style={{
                                backgroundColor: 'var(--card-bg)',
                                borderColor: 'var(--border-color)',
                                borderWidth: '1px',
                                color: 'var(--text-color)',
                              }}
                            >
                              <Play className='w-2.5 h-2.5 fill-current' />
                              <span>Launch</span>
                            </button>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* CENTER: Clean & Modern Workspace Cards */}
              <div className='space-y-4'>
                <h3
                  className='text-[11px] font-mono font-bold uppercase tracking-widest flex items-center gap-2'
                  style={{ color: 'var(--text-color)', opacity: 0.6 }}
                >
                  <span
                    className='w-1.5 h-4 inline-block rounded'
                    style={{ backgroundColor: 'var(--accent-color)' }}
                  ></span>
                  <span>Workspaces ({filteredWorkspaces.length})</span>
                </h3>

                {filteredWorkspaces.length === 0 ? (
                  <div
                    className='text-center py-16 border-2 border-dashed rounded-2xl text-sm font-sans'
                    style={{
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-color)',
                      opacity: 0.5,
                    }}
                  >
                    <p className='font-medium mb-2'>No workspaces yet</p>
                    <p className='text-xs'>
                      Create your first workspace to get started
                    </p>
                  </div>
                ) : (
                  <div className='grid gap-3'>
                    {filteredWorkspaces.map((ws) => {
                      const cardIcon = (() => {
                        const lowerName = ws.name.toLowerCase();
                        if (
                          lowerName.includes('code') ||
                          lowerName.includes('coding')
                        )
                          return (
                            <Code
                              className='w-5 h-5'
                              style={{ color: 'var(--accent-color)' }}
                            />
                          );
                        if (
                          lowerName.includes('design') ||
                          lowerName.includes('art')
                        )
                          return <Brush className='w-5 h-5 text-pink-500' />;
                        if (
                          lowerName.includes('study') ||
                          lowerName.includes('learn') ||
                          lowerName.includes('school')
                        )
                          return (
                            <BookOpen className='w-5 h-5 text-emerald-500' />
                          );
                        if (
                          lowerName.includes('cyber') ||
                          lowerName.includes('security') ||
                          lowerName.includes('hack')
                        )
                          return (
                            <ShieldAlert className='w-5 h-5 text-red-500' />
                          );
                        return <Sliders className='w-5 h-5 text-amber-500' />;
                      })();

                      return (
                        <div
                          key={ws.id}
                          className='group flex items-center justify-between p-5 rounded-2xl transition-all duration-200 hover:shadow-lg'
                          style={{
                            backgroundColor: 'var(--card-bg)',
                            border: '1px solid var(--border-color)',
                          }}
                        >
                          <div className='min-w-0 pr-4 flex items-start gap-4'>
                            <div
                              className='p-3 rounded-xl flex items-center justify-center'
                              style={{
                                backgroundColor:
                                  'color-mix(in srgb, var(--accent-color) 10%, transparent)',
                                border:
                                  '1px solid color-mix(in srgb, var(--accent-color) 20%, transparent)',
                              }}
                            >
                              {cardIcon}
                            </div>

                            <div className='min-w-0 space-y-1'>
                              <div className='flex items-center gap-3'>
                                <h4
                                  className='font-bold text-base group-hover:text-accent transition-colors'
                                  style={{ color: 'var(--text-color)' }}
                                >
                                  {ws.name}
                                </h4>
                                {ws.shortcut && (
                                  <span
                                    className='text-[10px] font-mono px-2 py-1 rounded-lg border'
                                    style={{
                                      backgroundColor: 'var(--bg-color)',
                                      borderColor: 'var(--border-color)',
                                      color: 'var(--text-color)',
                                      opacity: 0.7,
                                    }}
                                  >
                                    {ws.shortcut}
                                  </span>
                                )}
                              </div>

                              <p
                                className='text-sm truncate leading-relaxed'
                                style={{
                                  color: 'var(--text-color)',
                                  opacity: 0.7,
                                }}
                              >
                                {ws.description ||
                                  'Restore this workspace environment.'}
                              </p>

                              <div
                                className='flex items-center gap-4 text-[11px] pt-1'
                                style={{
                                  color: 'var(--text-color)',
                                  opacity: 0.6,
                                }}
                              >
                                <span className='flex items-center gap-1.5'>
                                  <Terminal className='w-3.5 h-3.5' />
                                  <span className='font-medium'>
                                    {ws.applications.length} Apps
                                  </span>
                                </span>
                                <span className='flex items-center gap-1.5'>
                                  <Globe className='w-3.5 h-3.5' />
                                  <span className='font-medium'>
                                    {ws.websites.length} Sites
                                  </span>
                                </span>
                                <span className='flex items-center gap-1.5'>
                                  <Folder className='w-3.5 h-3.5' />
                                  <span className='font-medium'>
                                    {ws.folders.length} Folders
                                  </span>
                                </span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleLaunchWithTelemetry(ws)}
                            className='py-2 px-4 bg-accent hover:opacity-90 text-white text-sm font-semibold rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer hover:scale-[1.02]'
                          >
                            <Play className='w-4 h-4 fill-current' />
                            <span>Launch</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <button
                onClick={handleManualFetchApps}
                className='w-full py-4 border-2 border-dashed rounded-2xl flex items-center justify-center gap-3 text-sm font-semibold transition-all group cursor-pointer hover:opacity-90 hover:border-accent'
                style={{
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-color)',
                }}
              >
                <RefreshCw className='w-5 h-5 group-hover:text-accent transition-colors' />
                <span>MANUALLY FETCH INSTALLED APPS</span>
              </button>
              {/* BOTTOM: Create Workspace Button */}
              <button
                onClick={handleStartCreate}
                className='w-full py-4 border-2 border-dashed rounded-2xl flex items-center justify-center gap-3 text-sm font-semibold transition-all group cursor-pointer hover:opacity-90 hover:border-accent'
                style={{
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-color)',
                }}
              >
                <Plus className='w-5 h-5 group-hover:text-accent transition-colors' />
                <span>Create New Workspace</span>
              </button>
            </div>
          )}

          {/* 2. WORKSPACES MANAGER TAB */}
          {activeTab === 'workspaces' && (
            <div className='max-w-4xl mx-auto w-full px-6 py-12 space-y-6'>
              <div
                className='flex items-center justify-between pb-4 border-b'
                style={{ borderColor: 'var(--border-color)' }}
              >
                <div>
                  <h2
                    className='text-lg font-semibold font-sans'
                    style={{ color: 'var(--text-color)' }}
                  >
                    Workspace Settings
                  </h2>
                  <p
                    className='text-xs'
                    style={{ color: 'var(--text-color)', opacity: 0.6 }}
                  >
                    Configure parameters, bound applications, hyperpaths, and
                    local shell script wrappers.
                  </p>
                </div>

                <button
                  onClick={handleStartCreate}
                  className='py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all hover:opacity-90'
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    borderColor: 'var(--border-color)',
                    borderWidth: '1px',
                    color: 'var(--text-color)',
                  }}
                >
                  <Plus className='w-3.5 h-3.5' />
                  <span>New Setup</span>
                </button>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                {/* WORKSPACES SELECT / LIST ON LEFT */}
                <div className='space-y-2'>
                  <span
                    className='text-[10px] uppercase font-mono font-bold tracking-wider px-1'
                    style={{ color: 'var(--text-color)', opacity: 0.6 }}
                  >
                    Select Profile
                  </span>

                  <div className='space-y-1.5'>
                    {workspaces.map((ws) => (
                      <button
                        key={ws.id}
                        onClick={() => setSelectedExportWorkspace(ws.id)}
                        className='w-full text-left p-3 rounded-lg border text-xs flex justify-between items-center transition-all hover:opacity-90'
                        style={{
                          backgroundColor:
                            selectedExportWorkspace === ws.id
                              ? 'var(--card-bg)'
                              : 'transparent',
                          borderColor:
                            selectedExportWorkspace === ws.id
                              ? 'var(--border-color)'
                              : 'transparent',
                          color: 'var(--text-color)',
                        }}
                      >
                        <div className='min-w-0 pr-2'>
                          <p className='truncate font-medium'>{ws.name}</p>
                          <p
                            className='text-[10px] mt-0.5 truncate font-sans'
                            style={{ opacity: 0.6 }}
                          >
                            {ws.description}
                          </p>
                        </div>
                        {selectedExportWorkspace === ws.id && (
                          <ChevronRight
                            className='w-3.5 h-3.5 shrink-0'
                            style={{ opacity: 0.7 }}
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* WORKSPACE DETAILED CONTROL ON RIGHT */}
                <div
                  className='md:col-span-2 space-y-5 p-5 rounded-lg border'
                  style={{
                    backgroundColor: 'var(--bg-color)',
                    borderColor: 'var(--border-color)',
                  }}
                >
                  {exportWsObj ? (
                    <div className='space-y-5'>
                      <div
                        className='flex items-center justify-between pb-3 border-b'
                        style={{ borderColor: 'var(--border-color)' }}
                      >
                        <div>
                          <h3
                            className='text-sm font-semibold'
                            style={{ color: 'var(--text-color)' }}
                          >
                            {exportWsObj.name}
                          </h3>
                          <p
                            className='text-xs'
                            style={{ color: 'var(--text-color)', opacity: 0.6 }}
                          >
                            {exportWsObj.description}
                          </p>
                        </div>

                        <div className='flex items-center gap-1.5'>
                          <button
                            onClick={() => handleStartEdit(exportWsObj)}
                            className='p-1.5 rounded text-[11px] font-medium flex items-center gap-1 border hover:opacity-90'
                            style={{
                              borderColor: 'var(--border-color)',
                              color: 'var(--text-color)',
                            }}
                            title='Edit Configuration'
                          >
                            <Edit className='w-3.5 h-3.5' />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={(e) =>
                              handleDeleteWorkspace(exportWsObj.id, e)
                            }
                            className='p-1.5 rounded text-[11px] font-medium flex items-center gap-1 border hover:opacity-90'
                            style={{
                              borderColor: 'var(--border-color)',
                              color: 'var(--text-color)',
                            }}
                            title='Delete Workspace'
                          >
                            <Trash2 className='w-3.5 h-3.5' />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>

                      {/* Bound Targets list preview */}
                      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                        <div className='space-y-1.5'>
                          <span
                            className='text-[10px] uppercase font-mono font-bold tracking-wider flex items-center gap-2'
                            style={{ color: 'var(--text-color)', opacity: 0.6 }}
                          >
                            Apps & Commands
                            {checkingHealth && (
                              <RefreshCw className='w-2.5 h-2.5 animate-spin' />
                            )}
                          </span>
                          <div
                            className='rounded border p-2.5 space-y-1.5 text-xs'
                            style={{
                              backgroundColor:
                                'color-mix(in srgb, var(--card-bg) 10%, transparent)',
                              borderColor: 'var(--border-color)',
                              color: 'var(--text-color)',
                              opacity: 0.8,
                            }}
                          >
                            {exportWsObj.applications.length > 0 ? (
                              exportWsObj.applications.map((app, appIdx) => {
                                const isBroken =
                                  workspaceHealth &&
                                  workspaceHealth.brokenPaths.includes(
                                    app.path
                                  );
                                return (
                                  <div
                                    key={appIdx}
                                    className='flex items-center gap-1.5 truncate'
                                  >
                                    <Terminal
                                      className='w-3 h-3 flex-shrink-0'
                                      style={{ opacity: 0.6 }}
                                    />
                                    <span
                                      className={`font-medium truncate ${isBroken ? 'text-red-500 line-through opacity-70' : ''}`}
                                      title={isBroken ? 'Path not found' : ''}
                                    >
                                      {app.name}
                                    </span>
                                    {isBroken && (
                                      <ShieldAlert
                                        className='w-3 h-3 text-red-500'
                                        title='Executable not found'
                                      />
                                    )}
                                  </div>
                                );
                              })
                            ) : (
                              <p
                                className='text-[11px] italic'
                                style={{ opacity: 0.5 }}
                              >
                                No apps configured
                              </p>
                            )}
                          </div>
                        </div>

                        <div className='space-y-1.5'>
                          <span
                            className='text-[10px] uppercase font-mono font-bold tracking-wider flex items-center gap-2'
                            style={{ color: 'var(--text-color)', opacity: 0.6 }}
                          >
                            Mount Directories
                            {checkingHealth && (
                              <RefreshCw className='w-2.5 h-2.5 animate-spin' />
                            )}
                          </span>
                          <div
                            className='rounded border p-2.5 space-y-1.5 text-xs'
                            style={{
                              backgroundColor:
                                'color-mix(in srgb, var(--card-bg) 10%, transparent)',
                              borderColor: 'var(--border-color)',
                              color: 'var(--text-color)',
                              opacity: 0.8,
                            }}
                          >
                            {exportWsObj.folders.length > 0 ? (
                              exportWsObj.folders.map((f, fIdx) => {
                                const isBroken =
                                  workspaceHealth &&
                                  workspaceHealth.brokenPaths.includes(f.path);
                                return (
                                  <div
                                    key={fIdx}
                                    className='flex items-center gap-1.5 truncate'
                                  >
                                    <Folder
                                      className='w-3 h-3 flex-shrink-0'
                                      style={{ opacity: 0.6 }}
                                    />
                                    <span
                                      className={`font-medium truncate ${isBroken ? 'text-red-500 line-through opacity-70' : ''}`}
                                      title={isBroken ? 'Path not found' : ''}
                                    >
                                      {f.name}
                                    </span>
                                    {isBroken && (
                                      <ShieldAlert
                                        className='w-3 h-3 text-red-500'
                                        title='Directory not found'
                                      />
                                    )}
                                  </div>
                                );
                              })
                            ) : (
                              <p
                                className='text-[11px] italic'
                                style={{ opacity: 0.5 }}
                              >
                                No folders configured
                              </p>
                            )}
                          </div>
                        </div>

                        <div className='space-y-1.5 sm:col-span-2'>
                          <span
                            className='text-[10px] uppercase font-mono font-bold tracking-wider'
                            style={{ color: 'var(--text-color)', opacity: 0.6 }}
                          >
                            Hyperlinks
                          </span>
                          <div
                            className='rounded border p-2.5 space-y-1.5 text-xs'
                            style={{
                              backgroundColor:
                                'color-mix(in srgb, var(--card-bg) 10%, transparent)',
                              borderColor: 'var(--border-color)',
                              color: 'var(--text-color)',
                              opacity: 0.8,
                            }}
                          >
                            {exportWsObj.websites.length > 0 ? (
                              exportWsObj.websites.map((w, wIdx) => (
                                <div
                                  key={wIdx}
                                  className='flex items-center gap-1.5 truncate'
                                >
                                  <Globe
                                    className='w-3 h-3 flex-shrink-0'
                                    style={{ opacity: 0.6 }}
                                  />
                                  <span className='font-medium truncate'>
                                    {w.name}
                                  </span>
                                  <span
                                    className='text-[10px] font-mono truncate'
                                    style={{ opacity: 0.7 }}
                                  >
                                    ({w.url})
                                  </span>
                                </div>
                              ))
                            ) : (
                              <p
                                className='text-[11px] italic'
                                style={{ opacity: 0.5 }}
                              >
                                No URLs configured
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* SCRIPT EXPORTER wrapper inline */}
                      <div
                        className='pt-4 border-t space-y-3'
                        style={{ borderColor: 'var(--border-color)' }}
                      >
                        <div className='flex items-center justify-between'>
                          <span
                            className='text-[10px] uppercase font-mono font-bold tracking-wider'
                            style={{ color: 'var(--text-color)', opacity: 0.6 }}
                          >
                            Local Script wrappers
                          </span>
                          <span
                            className='text-[10px] font-mono uppercase px-2 py-0.5 rounded border'
                            style={{
                              backgroundColor: 'var(--card-bg)',
                              borderColor: 'var(--border-color)',
                              color: 'var(--text-color)',
                              opacity: 0.8,
                            }}
                          >
                            {currentPlatform}
                          </span>
                        </div>

                        <div
                          className='rounded-lg p-3 font-mono text-[10px] max-h-32 overflow-y-auto leading-relaxed border'
                          style={{
                            backgroundColor: 'var(--card-bg)',
                            borderColor: 'var(--border-color)',
                            color: 'var(--text-color)',
                            opacity: 0.9,
                          }}
                        >
                          <pre className='whitespace-pre'>
                            {currentPlatform === 'windows'
                              ? generateWindowsPowershell(exportWsObj)
                              : currentPlatform === 'macos'
                                ? generateMacosScript(exportWsObj)
                                : generateLinuxScript(exportWsObj)}
                          </pre>
                        </div>

                        <div className='flex gap-2'>
                          <button
                            onClick={() => {
                              const ext =
                                currentPlatform === 'windows' ? 'ps1' : 'sh';
                              const codeStr =
                                currentPlatform === 'windows'
                                  ? generateWindowsPowershell(exportWsObj)
                                  : currentPlatform === 'macos'
                                    ? generateMacosScript(exportWsObj)
                                    : generateLinuxScript(exportWsObj);
                              downloadScript(
                                codeStr,
                                `${exportWsObj.name.toLowerCase().replace(/\s+/g, '_')}.${ext}`
                              );
                              triggerToast(
                                'Script Downloaded',
                                'Workspace script saved to your downloads folder.',
                                'success'
                              );
                            }}
                            className='flex-1 py-1.5 rounded text-xs flex items-center justify-center gap-1 transition-all cursor-pointer hover:opacity-90'
                            style={{
                              backgroundColor: 'var(--card-bg)',
                              borderColor: 'var(--border-color)',
                              borderWidth: '1px',
                              color: 'var(--text-color)',
                            }}
                          >
                            <Download className='w-3.5 h-3.5' />
                            <span>Download Script</span>
                          </button>

                          <button
                            onClick={() => {
                              const codeStr =
                                currentPlatform === 'windows'
                                  ? generateWindowsPowershell(exportWsObj)
                                  : currentPlatform === 'macos'
                                    ? generateMacosScript(exportWsObj)
                                    : generateLinuxScript(exportWsObj);
                              handleCopyScriptText(
                                codeStr,
                                'copy-script-action'
                              );
                            }}
                            className='py-1.5 px-4 rounded text-xs flex items-center justify-center gap-1 hover:opacity-90'
                            style={{
                              backgroundColor: 'var(--card-bg)',
                              borderColor: 'var(--border-color)',
                              borderWidth: '1px',
                              color: 'var(--text-color)',
                            }}
                          >
                            {copiedId === 'copy-script-action' ? (
                              <span style={{ color: 'var(--accent-color)' }}>
                                Copied!
                              </span>
                            ) : (
                              <span>Copy Source</span>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p
                      className='text-xs text-center py-12'
                      style={{ color: 'var(--text-color)', opacity: 0.6 }}
                    >
                      No workspaces. Create one of your own to get started.
                    </p>
                  )}
                </div>
              </div>

              {/* Import/Export Workspaces */}
              <div
                className='p-6 rounded-2xl space-y-5 backdrop-blur-sm border'
                style={{
                  backgroundColor:
                    'color-mix(in srgb, var(--card-bg) 20%, transparent)',
                  borderColor: 'var(--border-color)',
                }}
              >
                <div className='flex items-center gap-3'>
                  <div
                    className='p-2.5 rounded-xl border'
                    style={{
                      backgroundColor: 'var(--card-bg)',
                      borderColor: 'var(--border-color)',
                    }}
                  >
                    <Download className='w-4 h-4 text-cyan-400' />
                  </div>
                  <div>
                    <h3
                      className='font-bold text-sm uppercase tracking-wider font-mono'
                      style={{ color: 'var(--text-color)' }}
                    >
                      Workspace Import/Export
                    </h3>
                    <p
                      className='text-[11px] mt-0.5'
                      style={{ color: 'var(--text-color)', opacity: 0.6 }}
                    >
                      Backup or share your workspace configurations.
                    </p>
                  </div>
                </div>

                <div
                  className='pt-4 border-t flex items-center gap-3'
                  style={{
                    borderColor:
                      'color-mix(in srgb, var(--border-color) 60%, transparent)',
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type='file'
                    accept='.shift,application/json'
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        importWorkspaces(file);
                        if (fileInputRef.current)
                          fileInputRef.current.value = '';
                      }
                    }}
                    className='hidden'
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className='flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90 border'
                    style={{
                      backgroundColor: 'var(--card-bg)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-color)',
                    }}
                  >
                    <Upload className='w-3.5 h-3.5' />
                    Import Workspaces
                  </button>
                  <button
                    onClick={exportWorkspaces}
                    className='flex-1 py-2.5 bg-accent hover:opacity-90 text-white border border-accent rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all'
                  >
                    <Download className='w-3.5 h-3.5' />
                    Export Workspaces
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* APPLICATIONS TAB */}
          {activeTab === 'applications' && (
            <div className='max-w-4xl mx-auto w-full px-6 py-12 space-y-6'>
              <div
                className='flex items-center justify-between pb-4 border-b'
                style={{ borderColor: 'var(--border-color)' }}
              >
                <div>
                  <h2
                    className='text-sm font-extrabold uppercase tracking-widest font-mono'
                    style={{ color: 'var(--text-color)', opacity: 0.6 }}
                  >
                    &gt;_ Installed Applications
                  </h2>
                  <p
                    className='text-xs mt-1'
                    style={{ color: 'var(--text-color)', opacity: 0.6 }}
                  >
                    Shift lists automatically detected applications from
                    standard system directories. Select any program to bind it
                    directly to workspaces.
                  </p>
                </div>
                <div className='flex items-center gap-3'>
                  <span
                    className='text-xs px-2 py-1 rounded border font-mono'
                    style={{
                      backgroundColor: 'var(--card-bg)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-color)',
                      opacity: 0.8,
                    }}
                  >
                    Applications Found: {apps.length}
                  </span>
                  <button
                    type='button'
                    onClick={() => {
                      console.log(
                        '[Apps] Loaded from context — count:',
                        apps.length
                      );
                    }}
                    className='px-3 py-1.5 rounded text-xs flex items-center gap-1 transition-all cursor-pointer hover:opacity-90'
                    style={{
                      backgroundColor: 'var(--card-bg)',
                      borderColor: 'var(--border-color)',
                      borderWidth: '1px',
                      color: 'var(--text-color)',
                    }}
                  >
                    {appsLoading ? (
                      <div
                        className='w-3 h-3 border rounded-full animate-spin'
                        style={{
                          borderColor: 'var(--border-color)',
                          borderTopColor: 'var(--accent-color)',
                        }}
                      />
                    ) : (
                      <RefreshCw className='w-3 h-3' />
                    )}
                    Refresh
                  </button>
                </div>
              </div>

              {/* SEARCH APP BAR */}
              <div className='relative'>
                <input
                  type='text'
                  placeholder='Search auto-detected applications...'
                  value={osAppSearchQuery}
                  onChange={(e) => setOsAppSearchQuery(e.target.value)}
                  className='w-full pl-10 pr-4 py-2.5 text-sm rounded-lg transition-all font-sans focus:outline-none'
                  style={{
                    backgroundColor:
                      'color-mix(in srgb, var(--card-bg) 40%, transparent)',
                    borderColor: 'var(--border-color)',
                    borderWidth: '1px',
                    color: 'var(--text-color)',
                  }}
                />
                <Search
                  className='absolute left-3.5 top-3.5 w-4 h-4'
                  style={{ color: 'var(--text-color)', opacity: 0.6 }}
                />
              </div>

              {/* Loading State */}
              {appsLoading && (
                <div
                  className='flex items-center justify-center py-12 text-center'
                  style={{ color: 'var(--text-color)', opacity: 0.6 }}
                >
                  <div className='flex flex-col items-center gap-2'>
                    <div
                      className='w-8 h-8 border-2 rounded-full animate-spin'
                      style={{
                        borderColor: 'var(--border-color)',
                        borderTopColor: 'var(--accent-color)',
                      }}
                    />
                    <span className='text-xs font-mono'>
                      Mencari aplikasi terinstal...
                    </span>
                  </div>
                </div>
              )}

              {/* APPLICATIONS LIST GRID */}
              {!appsLoading && (
                <>
                  {apps.filter((item) =>
                    item.name
                      .toLowerCase()
                      .includes(osAppSearchQuery.toLowerCase())
                  ).length === 0 ? (
                    <div
                      className='flex items-center justify-center py-16 text-center'
                      style={{ color: 'var(--text-color)', opacity: 0.6 }}
                    >
                      <div className='flex flex-col items-center gap-3'>
                        <div
                          className='p-4 rounded-full border'
                          style={{
                            backgroundColor:
                              'color-mix(in srgb, var(--card-bg) 50%, transparent)',
                            borderColor: 'var(--border-color)',
                          }}
                        >
                          <AppWindow
                            className='w-8 h-8'
                            style={{ opacity: 0.7 }}
                          />
                        </div>
                        <div>
                          <p
                            className='text-sm font-medium'
                            style={{ color: 'var(--text-color)', opacity: 0.7 }}
                          >
                            No applications detected
                          </p>
                          <p
                            className='text-xs'
                            style={{ color: 'var(--text-color)', opacity: 0.6 }}
                          >
                            Refresh to scan again or check your system's app
                            directories.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      {apps
                        .filter((item) =>
                          item.name
                            .toLowerCase()
                            .includes(osAppSearchQuery.toLowerCase())
                        )
                        .map((app) => {
                          const isDropdownOpen = activeAppDropdown === app.name;

                          // Komponen kecil untuk handle icon loading dan fallback
                          const AppIcon = ({
                            app,
                          }: {
                            app: (typeof apps)[0];
                          }) => {
                            const [iconLoaded, setIconLoaded] = useState(false);
                            const [iconError, setIconError] = useState(false);

                            const getFallbackIcon = () => {
                              const nameLower = app.name.toLowerCase();
                              if (
                                nameLower.includes('code') ||
                                nameLower.includes('vscode')
                              )
                                return (
                                  <Code className='w-5 h-5 text-blue-400' />
                                );
                              if (nameLower.includes('chrome'))
                                return (
                                  <Chrome className='w-5 h-5 text-yellow-400' />
                                );
                              if (nameLower.includes('firefox'))
                                return (
                                  <Compass className='w-5 h-5 text-orange-500' />
                                );
                              if (nameLower.includes('discord'))
                                return (
                                  <MessageSquare className='w-5 h-5 text-indigo-500' />
                                );
                              if (nameLower.includes('spotify'))
                                return (
                                  <Music className='w-5 h-5 text-emerald-500' />
                                );
                              if (
                                nameLower.includes('terminal') ||
                                nameLower.includes('cmd') ||
                                nameLower.includes('powershell')
                              )
                                return (
                                  <Terminal className='w-5 h-5 text-zinc-400' />
                                );
                              if (nameLower.includes('slack'))
                                return (
                                  <Slack className='w-5 h-5 text-pink-400' />
                                );
                              if (
                                nameLower.includes('nautilus') ||
                                nameLower.includes('files')
                              )
                                return (
                                  <Folder className='w-5 h-5 text-blue-300' />
                                );
                              if (
                                nameLower.includes('settings') ||
                                nameLower.includes('preferences')
                              )
                                return (
                                  <Settings className='w-5 h-5 text-gray-400' />
                                );
                              if (
                                nameLower.includes('disk') ||
                                nameLower.includes('storage')
                              )
                                return (
                                  <HardDrive className='w-5 h-5 text-cyan-400' />
                                );
                              if (nameLower.includes('calculator'))
                                return (
                                  <Calculator className='w-5 h-5 text-green-400' />
                                );
                              if (
                                nameLower.includes('image') ||
                                nameLower.includes('photo')
                              )
                                return (
                                  <Image className='w-5 h-5 text-purple-400' />
                                );
                              if (
                                nameLower.includes('text') ||
                                nameLower.includes('editor')
                              )
                                return (
                                  <FileText className='w-5 h-5 text-orange-300' />
                                );
                              if (
                                nameLower.includes('browser') ||
                                nameLower.includes('web')
                              )
                                return (
                                  <Globe className='w-5 h-5 text-blue-500' />
                                );
                              if (
                                nameLower.includes('mail') ||
                                nameLower.includes('email')
                              )
                                return (
                                  <Mail className='w-5 h-5 text-red-400' />
                                );
                              if (nameLower.includes('calendar'))
                                return (
                                  <Calendar className='w-5 h-5 text-blue-600' />
                                );
                              if (
                                nameLower.includes('music') ||
                                nameLower.includes('sound')
                              )
                                return (
                                  <Music className='w-5 h-5 text-pink-500' />
                                );
                              if (
                                nameLower.includes('video') ||
                                nameLower.includes('movie')
                              )
                                return (
                                  <Video className='w-5 h-5 text-red-500' />
                                );
                              if (nameLower.includes('download'))
                                return (
                                  <Download className='w-5 h-5 text-green-500' />
                                );
                              if (
                                nameLower.includes('trash') ||
                                nameLower.includes('recycle')
                              )
                                return (
                                  <Trash2 className='w-5 h-5 text-gray-500' />
                                );
                              if (
                                nameLower.includes('network') ||
                                nameLower.includes('wifi')
                              )
                                return (
                                  <Wifi className='w-5 h-5 text-blue-400' />
                                );
                              if (nameLower.includes('print'))
                                return (
                                  <Printer className='w-5 h-5 text-gray-300' />
                                );
                              if (nameLower.includes('update'))
                                return (
                                  <RefreshCw className='w-5 h-5 text-cyan-500' />
                                );
                              if (nameLower.includes('terminal'))
                                return (
                                  <Terminal className='w-5 h-5 text-green-400' />
                                );
                              return (
                                <AppWindow className='w-5 h-5 text-zinc-500' />
                              );
                            };

                            if (!app.icon || iconError) {
                              return getFallbackIcon();
                            }

                            const isTauri =
                              typeof window !== 'undefined' &&
                              '__TAURI__' in window;
                            if (!isTauri) {
                              return getFallbackIcon();
                            }

                            try {
                              const {
                                convertFileSrc,
                              } = require('@tauri-apps/api/core');
                              const iconUrl = convertFileSrc(app.icon, 'fs');
                              return (
                                <div className='relative w-5 h-5 flex items-center justify-center'>
                                  <img
                                    src={iconUrl}
                                    alt={app.name}
                                    className='w-5 h-5 object-contain'
                                    onLoad={() => setIconLoaded(true)}
                                    onError={() => setIconError(true)}
                                    style={{
                                      display: iconLoaded ? 'block' : 'none',
                                    }}
                                  />
                                  {!iconLoaded && !iconError && (
                                    <div
                                      className='w-4 h-4 border border-zinc-600 rounded-full animate-spin'
                                      style={{
                                        borderTopColor: 'var(--accent-color)',
                                      }}
                                    />
                                  )}
                                </div>
                              );
                            } catch {
                              return getFallbackIcon();
                            }
                          };

                          return (
                            <div
                              key={app.name + app.path}
                              className='p-4 rounded-xl flex items-center justify-between hover:opacity-90 transition-all group relative'
                              style={{
                                backgroundColor:
                                  'color-mix(in srgb, var(--card-bg) 40%, transparent)',
                                borderColor: 'var(--border-color)',
                                borderWidth: '1px',
                              }}
                            >
                              <div className='flex items-center gap-3.5 min-w-0'>
                                <span
                                  className='p-2 rounded-xl border flex-shrink-0 flex items-center justify-center'
                                  style={{
                                    backgroundColor: 'var(--bg-color)',
                                    borderColor: 'var(--border-color)',
                                  }}
                                >
                                  <AppIcon app={app} />
                                </span>
                                <div className='min-w-0'>
                                  <h4
                                    className='font-bold text-sm truncate group-hover:text-accent transition-colors'
                                    style={{ color: 'var(--text-color)' }}
                                  >
                                    {app.name}
                                  </h4>
                                </div>
                              </div>

                              {/* Add directly to Workspace trigger drop menu */}
                              <div className='relative'>
                                <button
                                  type='button'
                                  onClick={() =>
                                    setActiveAppDropdown(
                                      isDropdownOpen ? null : app.name
                                    )
                                  }
                                  className='p-1.5 rounded-lg border transition-all hover:opacity-90'
                                  style={{
                                    borderColor: 'var(--border-color)',
                                    color: 'var(--text-color)',
                                  }}
                                >
                                  <Plus className='w-4 h-4' />
                                </button>

                                {/* Dropdown menu */}
                                <AnimatePresence>
                                  {isDropdownOpen && (
                                    <motion.div
                                      initial={{
                                        opacity: 0,
                                        y: -10,
                                        scale: 0.95,
                                      }}
                                      animate={{ opacity: 1, y: 0, scale: 1 }}
                                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                      className='absolute right-0 top-10 w-56 rounded-xl shadow-2xl z-50 overflow-hidden border'
                                      style={{
                                        backgroundColor: 'var(--bg-color)',
                                        borderColor: 'var(--border-color)',
                                      }}
                                    >
                                      <div
                                        className='p-2 border-b'
                                        style={{
                                          borderColor: 'var(--border-color)',
                                        }}
                                      >
                                        <span
                                          className='text-[10px] uppercase font-mono font-bold tracking-wider px-2'
                                          style={{
                                            color: 'var(--text-color)',
                                            opacity: 0.6,
                                          }}
                                        >
                                          Add to Workspace
                                        </span>
                                      </div>
                                      <div className='max-h-48 overflow-y-auto'>
                                        {workspaces.length === 0 ? (
                                          <div
                                            className='p-3 text-xs text-center'
                                            style={{
                                              color: 'var(--text-color)',
                                              opacity: 0.6,
                                            }}
                                          >
                                            No workspaces yet. Create one first!
                                          </div>
                                        ) : (
                                          workspaces.map((ws) => (
                                            <button
                                              key={ws.id}
                                              onClick={() => {
                                                handleAddAppDirectToWorkspace(
                                                  app.name,
                                                  app.path,
                                                  ws.id
                                                );
                                                setActiveAppDropdown(null);
                                              }}
                                              className='w-full text-left px-3 py-2 text-xs hover:opacity-90 transition-colors flex items-center gap-2'
                                              style={{
                                                color: 'var(--text-color)',
                                                backgroundColor:
                                                  'var(--card-bg)',
                                              }}
                                            >
                                              <div
                                                className='w-1 h-1 rounded-full'
                                                style={{
                                                  backgroundColor:
                                                    'var(--text-color)',
                                                  opacity: 0.5,
                                                }}
                                              />
                                              {ws.name}
                                            </button>
                                          ))
                                        )}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* 3. SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className='max-w-3xl mx-auto w-full px-6 py-12 space-y-8'>
              <div>
                <h2
                  className='text-sm font-extrabold uppercase tracking-widest font-mono'
                  style={{ color: 'var(--text-color)', opacity: 0.6 }}
                >
                  &gt;_ Settings & Preferences
                </h2>
                <h3
                  className='text-xl font-bold font-sans mt-1'
                  style={{ color: 'var(--text-color)' }}
                >
                  Desktop Orchestrator Preferences
                </h3>
                <p
                  className='text-xs mt-1'
                  style={{ color: 'var(--text-color)', opacity: 0.6 }}
                >
                  Configure global trigger bindings, daemon background hooks,
                  and launch sequence settings.
                </p>
              </div>

              <div className='space-y-6'>
                {/* 1. Launch & Tray Behavior Card */}
                <div
                  className='p-6 rounded-2xl space-y-5 backdrop-blur-sm border'
                  style={{
                    backgroundColor:
                      'color-mix(in srgb, var(--card-bg) 20%, transparent)',
                    borderColor: 'var(--border-color)',
                  }}
                >
                  <div className='flex items-center gap-3'>
                    <div
                      className='p-2.5 rounded-xl border'
                      style={{
                        backgroundColor: 'var(--card-bg)',
                        borderColor: 'var(--border-color)',
                      }}
                    >
                      <Sliders className='w-4 h-4 text-accent' />
                    </div>
                    <div>
                      <h3
                        className='font-bold text-sm uppercase tracking-wider font-mono'
                        style={{ color: 'var(--text-color)' }}
                      >
                        Launch & Background Daemon Settings
                      </h3>
                      <p
                        className='text-[11px] mt-0.5'
                        style={{ color: 'var(--text-color)', opacity: 0.6 }}
                      >
                        Configure how Shift behaves when your system starts and
                        closes.
                      </p>
                    </div>
                  </div>

                  <div
                    className='space-y-5 pt-3 border-t'
                    style={{
                      borderColor:
                        'color-mix(in srgb, var(--border-color) 60%, transparent)',
                    }}
                  >
                    {/* Startup Toggle */}
                    <div className='flex items-center justify-between text-xs'>
                      <div className='space-y-1 pr-8'>
                        <span
                          className='font-bold block text-sm'
                          style={{ color: 'var(--text-color)' }}
                        >
                          Launch at Startup
                        </span>
                        <span
                          className='text-[11px] block leading-relaxed'
                          style={{ color: 'var(--text-color)', opacity: 0.6 }}
                        >
                          Automatically execute background orchestrator daemon
                          when your operating system starts up.
                        </span>
                      </div>
                      <label className='relative inline-flex items-center cursor-pointer'>
                        <input
                          type='checkbox'
                          checked={launchAtStartup}
                          onChange={(e) =>
                            handleAutostartChange(e.target.checked)
                          }
                          className='sr-only peer'
                        />
                        <div
                          className='w-11 h-6 rounded-full transition-all'
                          style={{
                            backgroundColor: launchAtStartup
                              ? 'var(--accent-color)'
                              : 'color-mix(in srgb, var(--card-bg) 100%, transparent)',
                          }}
                        >
                          <div
                            className='absolute top-[5px] left-[5px] w-4 h-4 rounded-full transition-all'
                            style={{
                              backgroundColor: 'var(--bg-color)',
                              transform: launchAtStartup
                                ? 'translateX(20px)'
                                : 'translateX(0)',
                            }}
                          ></div>
                        </div>
                      </label>
                    </div>

                    {/* Minimize on Close Toggle */}
                    <div
                      className='flex items-center justify-between text-xs pt-4 border-t'
                      style={{
                        borderColor:
                          'color-mix(in srgb, var(--border-color) 50%, transparent)',
                      }}
                    >
                      <div className='space-y-1 pr-8'>
                        <span
                          className='font-bold block text-sm'
                          style={{ color: 'var(--text-color)' }}
                        >
                          Minimize to Tray on Close
                        </span>
                        <span
                          className='text-[11px] block leading-relaxed'
                          style={{ color: 'var(--text-color)', opacity: 0.6 }}
                        >
                          Clicking the top right [X] close button will securely
                          dock the app to your system tray.
                        </span>
                      </div>
                      <label className='relative inline-flex items-center cursor-pointer'>
                        <input
                          type='checkbox'
                          checked={minimizeToTray}
                          onChange={(e) => {
                            setMinimizeToTray(e.target.checked);
                            // Update Tauri backend setting
                            const isTauri =
                              typeof window !== 'undefined' &&
                              '__TAURI__' in window;
                            if (isTauri) {
                              import('@tauri-apps/api/core')
                                .then(({ invoke }) => {
                                  invoke('set_minimize_to_tray', {
                                    value: e.target.checked,
                                  });
                                })
                                .catch(console.error);
                            }
                            triggerToast(
                              'Setting Updated',
                              `Minimize to tray is now ${e.target.checked ? 'enabled' : 'disabled'}`,
                              'info'
                            );
                          }}
                          className='sr-only peer'
                        />
                        <div
                          className='w-11 h-6 rounded-full transition-all'
                          style={{
                            backgroundColor: minimizeToTray
                              ? 'var(--accent-color)'
                              : 'color-mix(in srgb, var(--card-bg) 100%, transparent)',
                          }}
                        >
                          <div
                            className='absolute top-[5px] left-[5px] w-4 h-4 rounded-full transition-all'
                            style={{
                              backgroundColor: 'var(--bg-color)',
                              transform: minimizeToTray
                                ? 'translateX(20px)'
                                : 'translateX(0)',
                            }}
                          ></div>
                        </div>
                      </label>
                    </div>

                    {/* Launch Preview Configuration Toggle */}
                    <div
                      className='flex items-center justify-between text-xs pt-4 border-t'
                      style={{
                        borderColor:
                          'color-mix(in srgb, var(--border-color) 50%, transparent)',
                      }}
                    >
                      <div className='space-y-1 pr-8'>
                        <span
                          className='font-bold block text-sm'
                          style={{ color: 'var(--text-color)' }}
                        >
                          Display Launch Preview Overlay
                        </span>
                        <span
                          className='text-[11px] block leading-relaxed'
                          style={{ color: 'var(--text-color)', opacity: 0.6 }}
                        >
                          Show a checklist summary preview of apps, URLs, and
                          directory folders with a countdown before launching.
                        </span>
                      </div>
                      <label className='relative inline-flex items-center cursor-pointer'>
                        <input
                          type='checkbox'
                          checked={!autoBypassPreview}
                          onChange={(e) => {
                            setAutoBypassPreview(!e.target.checked);
                            triggerToast(
                              'Setting Updated',
                              `Launch Preview is now ${e.target.checked ? 'enabled' : 'disabled'}`,
                              'info'
                            );
                          }}
                          className='sr-only peer'
                        />
                        <div
                          className='w-11 h-6 rounded-full transition-all'
                          style={{
                            backgroundColor: !autoBypassPreview
                              ? 'var(--accent-color)'
                              : 'color-mix(in srgb, var(--card-bg) 100%, transparent)',
                          }}
                        >
                          <div
                            className='absolute top-[5px] left-[5px] w-4 h-4 rounded-full transition-all'
                            style={{
                              backgroundColor: 'var(--bg-color)',
                              transform: !autoBypassPreview
                                ? 'translateX(20px)'
                                : 'translateX(0)',
                            }}
                          ></div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* 2. Global Shortcut Configurator Area */}
                <div
                  className='p-6 rounded-2xl space-y-5 backdrop-blur-sm border'
                  style={{
                    backgroundColor:
                      'color-mix(in srgb, var(--card-bg) 20%, transparent)',
                    borderColor: 'var(--border-color)',
                  }}
                >
                  <div className='flex items-center gap-3'>
                    <div
                      className='p-2.5 rounded-xl border'
                      style={{
                        backgroundColor: 'var(--card-bg)',
                        borderColor: 'var(--border-color)',
                      }}
                    >
                      <Command className='w-4 h-4 text-emerald-400' />
                    </div>
                    <div>
                      <h3
                        className='font-bold text-sm uppercase tracking-wider font-mono'
                        style={{ color: 'var(--text-color)' }}
                      >
                        Global Hotkey Summon Options
                      </h3>
                      <p
                        className='text-[11px] mt-0.5'
                        style={{ color: 'var(--text-color)', opacity: 0.6 }}
                      >
                        Customize how you summon the Shift console instantly.
                      </p>
                    </div>
                  </div>

                  <div
                    className='pt-4 border-t space-y-5'
                    style={{
                      borderColor:
                        'color-mix(in srgb, var(--border-color) 60%, transparent)',
                    }}
                  >
                    <p
                      className='text-[11px] font-sans leading-relaxed'
                      style={{ color: 'var(--text-color)', opacity: 0.6 }}
                    >
                      Select your preferred desktop global keyboard key
                      combination. The background daemon handles monitoring this
                      combo.
                    </p>

                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs font-sans'>
                      <div className='space-y-2'>
                        <span
                          className='text-[10px] uppercase font-mono font-bold tracking-wider mb-2 block'
                          style={{ color: 'var(--text-color)', opacity: 0.6 }}
                        >
                          Summon combination type
                        </span>
                        <div className='relative'>
                          <Keyboard
                            className='absolute left-3 top-2.5 w-4 h-4'
                            style={{ color: 'var(--text-color)', opacity: 0.6 }}
                          />
                          <select
                            value={shortcutKey}
                            onChange={(e) => {
                              setShortcutKey(e.target.value);
                              triggerToast(
                                'Hotkey set',
                                `Summon hotkey bound to ${e.target.value || 'Platform Default'}`,
                                'info'
                              );
                            }}
                            className='w-full px-3.5 py-2.5 pl-10 rounded-xl font-mono text-xs focus:outline-none transition-all border'
                            style={{
                              backgroundColor: 'var(--bg-color)',
                              borderColor: 'var(--border-color)',
                              color: 'var(--text-color)',
                            }}
                          >
                            <option value=''>
                              Platform Default (Alt+Space / Cmd+Opt+Space)
                            </option>
                            <option value='Ctrl+K'>
                              Ctrl + K (Vim / Slack style)
                            </option>
                            <option value='Alt+P'>
                              Alt + P / Cmd+Option+P
                            </option>
                            <option value='Alt+Z'>Alt + Z (Super Quick)</option>
                          </select>
                        </div>
                      </div>

                      <div
                        className='p-4 rounded-xl border'
                        style={{
                          backgroundColor: 'var(--bg-color)',
                          borderColor: 'var(--border-color)',
                        }}
                      >
                        <span
                          className='text-[9px] uppercase font-mono font-bold block mb-3'
                          style={{ color: 'var(--text-color)', opacity: 0.6 }}
                        >
                          Current OS shortcuts
                        </span>
                        <div
                          className='space-y-2 font-mono text-[10px]'
                          style={{ color: 'var(--text-color)', opacity: 0.7 }}
                        >
                          <div
                            className='flex justify-between items-center px-2 py-1.5 rounded-lg'
                            style={{
                              backgroundColor:
                                'color-mix(in srgb, var(--card-bg) 50%, transparent)',
                            }}
                          >
                            <span
                              style={{
                                color: 'var(--text-color)',
                                opacity: 0.6,
                              }}
                            >
                              Windows / Linux:
                            </span>
                            <span
                              className='font-semibold px-2 py-0.5 rounded border'
                              style={{
                                backgroundColor: 'var(--card-bg)',
                                borderColor: 'var(--border-color)',
                                color: 'var(--text-color)',
                              }}
                            >
                              {shortcutKey || 'Alt+Space'}
                            </span>
                          </div>
                          <div
                            className='flex justify-between items-center px-2 py-1.5 rounded-lg'
                            style={{
                              backgroundColor:
                                'color-mix(in srgb, var(--card-bg) 50%, transparent)',
                            }}
                          >
                            <span
                              style={{
                                color: 'var(--text-color)',
                                opacity: 0.6,
                              }}
                            >
                              macOS:
                            </span>
                            <span
                              className='font-semibold px-2 py-0.5 rounded border'
                              style={{
                                backgroundColor: 'var(--card-bg)',
                                borderColor: 'var(--border-color)',
                                color: 'var(--text-color)',
                              }}
                            >
                              {shortcutKey
                                ? `Cmd + Option + ${shortcutKey.slice(-1)}`
                                : 'Cmd+Opt+Space'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Theme Customization */}
                <div
                  className='p-6 rounded-2xl space-y-5 backdrop-blur-sm border'
                  style={{
                    backgroundColor:
                      'color-mix(in srgb, var(--card-bg) 20%, transparent)',
                    borderColor: 'var(--border-color)',
                  }}
                >
                  <div className='flex items-center gap-3'>
                    <div
                      className='p-2.5 rounded-xl border'
                      style={{
                        backgroundColor: 'var(--card-bg)',
                        borderColor: 'var(--border-color)',
                      }}
                    >
                      <Palette className='w-4 h-4 text-purple-400' />
                    </div>
                    <div>
                      <h3
                        className='font-bold text-sm uppercase tracking-wider font-mono'
                        style={{ color: 'var(--text-color)' }}
                      >
                        Theme Customization
                      </h3>
                      <p
                        className='text-[11px] mt-0.5'
                        style={{ color: 'var(--text-color)', opacity: 0.6 }}
                      >
                        Personalize Shift's look and feel.
                      </p>
                    </div>
                  </div>

                  <div
                    className='pt-4 border-t space-y-5'
                    style={{
                      borderColor:
                        'color-mix(in srgb, var(--border-color) 60%, transparent)',
                    }}
                  >
                    {/* Theme Mode */}
                    <div className='space-y-3'>
                      <span
                        className='text-[10px] uppercase font-mono font-bold tracking-wider block'
                        style={{ color: 'var(--text-color)', opacity: 0.6 }}
                      >
                        Theme Mode
                      </span>
                      <div className='grid grid-cols-3 gap-3'>
                        {[
                          { mode: 'light' as const, label: 'Light' },
                          { mode: 'dark' as const, label: 'Dark' },
                          { mode: 'system' as const, label: 'System' },
                        ].map((option) => (
                          <button
                            key={option.mode}
                            onClick={() => {
                              console.log(
                                'Setting theme mode to:',
                                option.mode
                              );
                              setTheme((prev) => ({
                                ...prev,
                                mode: option.mode,
                              }));
                              triggerToast(
                                'Theme Updated',
                                `Theme mode set to ${option.label}`,
                                'info'
                              );
                            }}
                            className='p-3 rounded-xl border text-xs font-semibold transition-all hover:opacity-90'
                            style={{
                              backgroundColor:
                                theme.mode === option.mode
                                  ? 'var(--accent-color)'
                                  : 'var(--card-bg)',
                              borderColor:
                                theme.mode === option.mode
                                  ? 'var(--accent-color)'
                                  : 'var(--border-color)',
                              color:
                                theme.mode === option.mode
                                  ? '#ffffff'
                                  : 'var(--text-color)',
                            }}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Accent Color */}
                    <div className='space-y-3'>
                      <span
                        className='text-[10px] uppercase font-mono font-bold tracking-wider block'
                        style={{ color: 'var(--text-color)', opacity: 0.6 }}
                      >
                        Accent Color
                      </span>
                      <div className='flex items-center gap-3'>
                        {[
                          '#6366f1', // Indigo
                          '#8b5cf6', // Violet
                          '#a855f7', // Purple
                          '#d946ef', // Fuchsia
                          '#ec4899', // Pink
                          '#f43f5e', // Rose
                          '#ef4444', // Red
                          '#f97316', // Orange
                          '#eab308', // Yellow
                          '#84cc16', // Lime
                          '#22c55e', // Green
                          '#14b8a6', // Teal
                          '#06b6d4', // Cyan
                          '#0ea5e9', // Sky
                          '#3b82f6', // Blue
                        ].map((color) => (
                          <button
                            key={color}
                            onClick={() => {
                              setTheme((prev) => ({
                                ...prev,
                                accentColor: color,
                              }));
                              triggerToast(
                                'Accent Updated',
                                'Accent color changed successfully',
                                'info'
                              );
                            }}
                            className='w-8 h-8 rounded-full border-2 transition-transform hover:scale-110'
                            style={{
                              backgroundColor: color,
                              borderColor:
                                theme.accentColor === color
                                  ? 'var(--text-color)'
                                  : 'transparent',
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Software Updates */}
                <div
                  className='p-6 rounded-2xl space-y-5 backdrop-blur-sm border'
                  style={{
                    backgroundColor:
                      'color-mix(in srgb, var(--card-bg) 20%, transparent)',
                    borderColor: 'var(--border-color)',
                  }}
                >
                  <div className='flex items-center gap-3'>
                    <div
                      className='p-2.5 rounded-xl border'
                      style={{
                        backgroundColor: 'var(--card-bg)',
                        borderColor: 'var(--border-color)',
                      }}
                    >
                      <Download className='w-4 h-4 text-blue-400' />
                    </div>
                    <div>
                      <h3
                        className='font-bold text-sm uppercase tracking-wider font-mono'
                        style={{ color: 'var(--text-color)' }}
                      >
                        Software Updates
                      </h3>
                      <p
                        className='text-[11px] mt-0.5'
                        style={{ color: 'var(--text-color)', opacity: 0.6 }}
                      >
                        Check for new versions of Shift.
                      </p>
                    </div>
                  </div>

                  <div
                    className='pt-4 border-t'
                    style={{
                      borderColor:
                        'color-mix(in srgb, var(--border-color) 60%, transparent)',
                    }}
                  >
                    <div className='flex items-center justify-between text-xs'>
                      <div className='space-y-1 pr-8'>
                        <span
                          className='font-bold block text-sm'
                          style={{ color: 'var(--text-color)' }}
                        >
                          Over-the-Air Updates
                        </span>
                        <span
                          className='text-[11px] block leading-relaxed'
                          style={{ color: 'var(--text-color)', opacity: 0.6 }}
                        >
                          Keep Shift updated to receive new features,
                          improvements, and bug fixes automatically.
                        </span>
                      </div>
                      <button
                        onClick={handleCheckUpdates}
                        disabled={isCheckingUpdate}
                        className='py-2 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all min-w-[140px]'
                        style={{
                          backgroundColor: 'var(--accent-color)',
                          color: '#fff',
                          opacity: isCheckingUpdate ? 0.7 : 1,
                        }}
                      >
                        {isCheckingUpdate ? (
                          <>
                            <RefreshCw className='w-4 h-4 animate-spin' />
                            <span>Checking...</span>
                          </>
                        ) : (
                          <>
                            <RefreshCw className='w-4 h-4' />
                            <span>Check for Updates</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. ABOUT TAB */}
          {activeTab === 'about' && (
            <div className='max-w-3xl mx-auto w-full px-6 py-12 space-y-8'>
              <div>
                <h2
                  className='text-sm font-extrabold uppercase tracking-widest font-mono'
                  style={{ color: 'var(--text-color)', opacity: 0.6 }}
                >
                  &gt;_ About Shift
                </h2>
                <h3
                  className='text-xl font-bold font-sans mt-1'
                  style={{ color: 'var(--text-color)' }}
                >
                  Application & System Details
                </h3>
                <p
                  className='text-xs mt-1'
                  style={{ color: 'var(--text-color)', opacity: 0.6 }}
                >
                  Learn about the application, creator, and your system
                  configuration.
                </p>
              </div>

              <div className='space-y-6'>
                {/* System Information */}
                <div
                  className='p-6 rounded-2xl space-y-5 backdrop-blur-sm border'
                  style={{
                    backgroundColor:
                      'color-mix(in srgb, var(--card-bg) 20%, transparent)',
                    borderColor: 'var(--border-color)',
                  }}
                >
                  <div className='flex items-center gap-3'>
                    <div
                      className='p-2.5 rounded-xl border'
                      style={{
                        backgroundColor: 'var(--card-bg)',
                        borderColor: 'var(--border-color)',
                      }}
                    >
                      <Cpu className='w-4 h-4 text-amber-400' />
                    </div>
                    <div>
                      <h3
                        className='font-bold text-sm uppercase tracking-wider font-mono'
                        style={{ color: 'var(--text-color)' }}
                      >
                        System Information
                      </h3>
                      <p
                        className='text-[11px] mt-0.5'
                        style={{ color: 'var(--text-color)', opacity: 0.6 }}
                      >
                        Detected OS, architecture, and app status.
                      </p>
                    </div>
                  </div>

                  <div
                    className='pt-4 border-t grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs'
                    style={{
                      borderColor:
                        'color-mix(in srgb, var(--border-color) 60%, transparent)',
                    }}
                  >
                    <div
                      className='p-3 rounded-xl border'
                      style={{
                        backgroundColor: 'var(--bg-color)',
                        borderColor:
                          'color-mix(in srgb, var(--border-color) 60%, transparent)',
                      }}
                    >
                      <span
                        className='block font-mono text-[10px] mb-1'
                        style={{ color: 'var(--text-color)', opacity: 0.6 }}
                      >
                        PLATFORM
                      </span>
                      <span
                        className='font-semibold text-sm'
                        style={{ color: 'var(--text-color)' }}
                      >
                        {systemInfo?.platform || 'Detecting...'}
                      </span>
                    </div>
                    <div
                      className='p-3 rounded-xl border'
                      style={{
                        backgroundColor: 'var(--bg-color)',
                        borderColor:
                          'color-mix(in srgb, var(--border-color) 60%, transparent)',
                      }}
                    >
                      <span
                        className='block font-mono text-[10px] mb-1'
                        style={{ color: 'var(--text-color)', opacity: 0.6 }}
                      >
                        ARCHITECTURE
                      </span>
                      <span
                        className='font-semibold text-sm'
                        style={{ color: 'var(--text-color)' }}
                      >
                        {systemInfo?.arch || 'Detecting...'}
                      </span>
                    </div>
                    <div
                      className='p-3 rounded-xl border'
                      style={{
                        backgroundColor: 'var(--bg-color)',
                        borderColor:
                          'color-mix(in srgb, var(--border-color) 60%, transparent)',
                      }}
                    >
                      <span
                        className='block font-mono text-[10px] mb-1'
                        style={{ color: 'var(--text-color)', opacity: 0.6 }}
                      >
                        VERSION
                      </span>
                      <span
                        className='font-semibold text-sm'
                        style={{ color: 'var(--text-color)' }}
                      >
                        {appVersion}
                      </span>
                    </div>
                    <div
                      className='p-3 rounded-xl border'
                      style={{
                        backgroundColor: 'var(--bg-color)',
                        borderColor:
                          'color-mix(in srgb, var(--border-color) 60%, transparent)',
                      }}
                    >
                      <span
                        className='block font-mono text-[10px] mb-1'
                        style={{ color: 'var(--text-color)', opacity: 0.6 }}
                      >
                        STARTUP STATUS
                      </span>
                      <span
                        className='text-sm font-semibold'
                        style={{
                          color: launchAtStartup
                            ? '#22c55e'
                            : 'var(--text-color)',
                          opacity: launchAtStartup ? 1 : 0.7,
                        }}
                      >
                        {launchAtStartup ? 'ENABLED' : 'DISABLED'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Application Information */}
                <div
                  className='p-6 rounded-2xl space-y-5 backdrop-blur-sm border'
                  style={{
                    backgroundColor:
                      'color-mix(in srgb, var(--card-bg) 20%, transparent)',
                    borderColor: 'var(--border-color)',
                  }}
                >
                  <div className='flex items-center gap-3'>
                    <div
                      className='p-2.5 rounded-xl border'
                      style={{
                        backgroundColor: 'var(--card-bg)',
                        borderColor: 'var(--border-color)',
                      }}
                    >
                      <Heart className='w-4 h-4 text-rose-400' />
                    </div>
                    <div>
                      <h3
                        className='font-bold text-sm uppercase tracking-wider font-mono'
                        style={{ color: 'var(--text-color)' }}
                      >
                        Application Information
                      </h3>
                      <p
                        className='text-[11px] mt-0.5'
                        style={{ color: 'var(--text-color)', opacity: 0.6 }}
                      >
                        Learn about the application and its creator.
                      </p>
                    </div>
                  </div>

                  <div
                    className='pt-4 border-t space-y-4 text-xs'
                    style={{
                      borderColor:
                        'color-mix(in srgb, var(--border-color) 60%, transparent)',
                    }}
                  >
                    <AppInfoCard />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Minimal Footer */}
        <footer
          className='border-t py-4 px-8 mt-auto'
          style={{
            borderColor:
              'color-mix(in srgb, var(--border-color) 60%, transparent)',
            backgroundColor:
              'color-mix(in srgb, var(--card-bg) 40%, transparent)',
          }}
        ></footer>
      </main>

      {/* ========================================================= */}
      {/* DIALOG: WORKSPACE CREATOR / EDITING MODAL BACKDROP         */}
      {/* ========================================================= */}
      <AnimatePresence>
        {(isCreatingNew || editingWorkspace) && (
          <div className='fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto'>
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className='bg-zinc-950 border border-zinc-900 rounded-xl max-w-2xl w-full text-zinc-100 overflow-hidden shadow-[0_24px_50px_rgba(0,0,0,0.85)] my-8'
              onClick={(e) => e.stopPropagation()}
            >
              {/* Form Title */}
              <div className='bg-zinc-900/40 px-6 py-4 border-b border-zinc-900 flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Sliders className='w-4 h-4 text-zinc-400' />
                  <span className='font-bold text-sm tracking-tight text-zinc-100 font-sans'>
                    {isCreatingNew
                      ? 'Create Workspace Profile'
                      : `Modify Workspace: ${editingWorkspace?.name}`}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setIsCreatingNew(false);
                    setEditingWorkspace(null);
                  }}
                  className='p-1 px-2.5 rounded bg-zinc-900 border border-zinc-805 text-zinc-400 hover:text-white transition-all text-xs font-medium'
                >
                  Discard Setup
                </button>
              </div>

              {/* Form Scroll wrapper */}
              <form
                onSubmit={handleSaveWorkspaceForm}
                className='p-6 space-y-5 max-h-[75vh] overflow-y-auto'
              >
                {/* Name */}
                <div className='grid grid-cols-1 gap-4'>
                  <div>
                    <label className='block text-[10px] font-mono uppercase font-bold tracking-wider text-zinc-550 mb-1.5'>
                      Workspace Profile Name
                    </label>
                    <input
                      type='text'
                      className='w-full bg-zinc-900/50 border border-zinc-900 text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-zinc-800 text-zinc-100 font-sans'
                      placeholder='e.g. Coding Mode'
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className='block text-[10px] font-mono uppercase font-bold tracking-wider text-zinc-550 mb-1.5'>
                    Launch Description
                  </label>
                  <textarea
                    className='w-full bg-zinc-900/50 border border-zinc-900 text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-zinc-800 h-16 resize-none text-[#b1b5bc] font-sans'
                    placeholder='e.g. Set up direct terminal connections, editor configurations, and search directories.'
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                  />
                </div>

                {/* ITEM A: APPLICATIONS IN WORKSPACE */}
                <div className='p-4 rounded-lg bg-zinc-900/10 border border-zinc-900 space-y-3'>
                  <div className='flex items-center justify-between border-b border-zinc-900/60 pb-1.5'>
                    <span className='text-xs font-bold text-zinc-400 flex items-center gap-1.5'>
                      <Terminal className='w-3.5 h-3.5 text-zinc-500' />
                      <span>Desktop Applications ({formApps.length})</span>
                    </span>
                    <span className='text-[10px] text-zinc-600 font-mono'>
                      Executable paths
                    </span>
                  </div>

                  {/* List of Apps */}
                  <div className='space-y-1.5'>
                    {formApps.map((app, appIdx) => (
                      <div
                        key={appIdx}
                        className='flex justify-between items-center text-xs bg-zinc-900/20 p-2 rounded-lg border border-zinc-900'
                      >
                        <div className='min-w-0 pr-2'>
                          <span className='font-semibold text-zinc-200'>
                            {app.name}
                          </span>
                          <span className='font-mono text-[9px] text-zinc-550 block truncate'>
                            ({app.path})
                          </span>
                        </div>
                        <button
                          type='button'
                          onClick={() =>
                            setFormApps((prev) =>
                              prev.filter((_, idx) => idx !== appIdx)
                            )
                          }
                          className='text-red-400 hover:text-red-350 text-xs font-bold'
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    {formApps.length === 0 && (
                      <p className='text-[11px] text-zinc-600 italic'>
                        No apps configured in this profile yet.
                      </p>
                    )}
                  </div>

                  {/* Auto-Detected OS Applications selector */}
                  <div className='p-4 bg-zinc-900/30 border border-zinc-900 rounded-xl space-y-4'>
                    <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-900 pb-2.5'>
                      <div>
                        <span className='text-[10px] uppercase font-mono font-bold text-zinc-400 block tracking-wider'>
                          🎯 OS Installed Application Registry
                        </span>
                        <span className='text-[11px] text-zinc-550 block font-normal text-zinc-500'>
                          Automatically detected applications from your system (
                          {currentPlatform}).
                        </span>
                      </div>
                    </div>

                    {/* Integrated Search Bar inside form registry */}
                    <div className='relative'>
                      <Search className='w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-600' />
                      <input
                        type='text'
                        placeholder='Search detected installed applications...'
                        value={osAppSearchQuery}
                        onChange={(e) => setOsAppSearchQuery(e.target.value)}
                        className='w-full bg-zinc-950 border border-zinc-900 pl-8 pr-3 py-1.5 rounded-lg text-xs text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-zinc-800'
                      />
                      {osAppSearchQuery && (
                        <button
                          type='button'
                          onClick={() => setOsAppSearchQuery('')}
                          className='absolute right-3 top-2 text-[10px] text-zinc-500 hover:text-zinc-350'
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    {/* Autodetected layout Grid */}
                    <div className='grid grid-cols-2 sm:grid-cols-4 gap-2'>
                      {apps
                        .filter((item) =>
                          item.name
                            .toLowerCase()
                            .includes(osAppSearchQuery.toLowerCase())
                        )
                        .map((app, index) => {
                          const isSelected = formApps.some(
                            (fa) =>
                              fa.name.toLowerCase() === app.name.toLowerCase()
                          );

                          return (
                            <button
                              key={index}
                              type='button'
                              onClick={() => {
                                if (isSelected) {
                                  setFormApps((prev) =>
                                    prev.filter(
                                      (fa) =>
                                        fa.name.toLowerCase() !==
                                        app.name.toLowerCase()
                                    )
                                  );
                                  triggerToast(
                                    'Application removed',
                                    `Deselected ${app.name} from profile.`,
                                    'info'
                                  );
                                } else {
                                  setFormApps((prev) => [
                                    ...prev,
                                    { name: app.name, path: app.path },
                                  ]);
                                  triggerToast(
                                    'Application selected',
                                    `Added detected launcher for ${app.name}.`,
                                    'success'
                                  );
                                }
                              }}
                              className={`p-2.5 rounded-lg border text-left flex flex-col justify-between h-20 transition-all ${
                                isSelected
                                  ? 'bg-zinc-900/80 border-zinc-700 text-zinc-105'
                                  : 'bg-zinc-950/40 border-[#18181b] hover:border-zinc-805 text-zinc-400 hover:text-zinc-200'
                              }`}
                            >
                              <div className='flex items-center justify-between w-full'>
                                <span className='p-1 rounded bg-zinc-950 border border-zinc-900/60 text-zinc-400'>
                                  <AppWindow className='w-4 h-4' />
                                </span>
                                {isSelected ? (
                                  <span className='text-[8px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase font-mono font-bold leading-none'>
                                    ✓ Bound
                                  </span>
                                ) : (
                                  <span className='text-[8px] text-zinc-600 uppercase font-mono'>
                                    Detected
                                  </span>
                                )}
                              </div>

                              <div className='truncate'>
                                <span className='text-xs font-bold font-sans block'>
                                  {app.name}
                                </span>
                                <span
                                  className='text-[8px] font-mono block text-zinc-550 truncate'
                                  title={app.path}
                                >
                                  {app.path}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                    </div>

                    {/* Manual binding container */}
                    <div className='pt-2 border-t border-zinc-900/50 space-y-2'>
                      <span className='text-[10px] uppercase font-mono font-bold text-zinc-500 block'>
                        Custom Executable Path (Advanced developers)
                      </span>
                      <div className='grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-sans'>
                        <div>
                          <input
                            type='text'
                            className='w-full bg-zinc-950 border border-zinc-900 px-3 py-1.5 rounded-lg text-xs text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-zinc-800'
                            placeholder='Custom application label (e.g. Photoshop)'
                            value={newAppName}
                            onChange={(e) => setNewAppName(e.target.value)}
                          />
                        </div>
                        <div className='flex gap-2'>
                          <input
                            type='text'
                            className='w-full bg-zinc-950 border border-zinc-900 px-3 py-1.5 rounded-lg text-xs font-mono text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-zinc-800 flex-1'
                            placeholder='C:\Program Files\App\Photoshop.exe'
                            value={newAppPath}
                            onChange={(e) => setNewAppPath(e.target.value)}
                          />
                          <button
                            type='button'
                            onClick={() => {
                              if (!newAppName.trim() || !newAppPath.trim()) {
                                triggerToast(
                                  'Incomplete parameters',
                                  'Provide both name and target file path.',
                                  'info'
                                );
                                return;
                              }
                              setFormApps((prev) => [
                                ...prev,
                                {
                                  name: newAppName.trim(),
                                  path: newAppPath.trim(),
                                },
                              ]);
                              setNewAppName('');
                              setNewAppPath('');
                              triggerToast(
                                'Added custom execute file',
                                'Manual application registered successfully.',
                                'success'
                              );
                            }}
                            className='bg-zinc-100 hover:bg-white text-zinc-950 font-bold px-3 py-1.5 rounded-lg text-xs select-none transition-colors'
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ITEM B: HYPERLINKS IN WORKSPACE */}
                <div className='p-4 rounded-lg bg-zinc-900/10 border border-zinc-900 space-y-3'>
                  <div className='flex items-center justify-between border-b border-zinc-900/60 pb-1.5'>
                    <span className='text-xs font-bold text-zinc-400 flex items-center gap-1.5'>
                      <Globe className='w-3.5 h-3.5 text-zinc-500' />
                      <span>Websites & Links ({formLinks.length})</span>
                    </span>
                    <span className='text-[10px] text-zinc-650 font-mono'>
                      Launch URL tabs
                    </span>
                  </div>

                  {/* List of Links */}
                  <div className='space-y-1.5'>
                    {formLinks.map((link, linkIdx) => (
                      <div
                        key={linkIdx}
                        className='flex justify-between items-center text-xs bg-zinc-900/20 p-2 rounded-lg border border-zinc-900'
                      >
                        <div className='min-w-0 pr-2'>
                          <span className='font-semibold text-zinc-200'>
                            {link.name}
                          </span>
                          <span className='font-mono text-[9px] text-zinc-550 block truncate'>
                            ({link.url})
                          </span>
                        </div>
                        <button
                          type='button'
                          onClick={() =>
                            setFormLinks((prev) =>
                              prev.filter((_, idx) => idx !== linkIdx)
                            )
                          }
                          className='text-red-400 hover:text-red-350 text-xs font-bold'
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    {formLinks.length === 0 && (
                      <p className='text-[11px] text-zinc-650 italic'>
                        No hyperlinks configured yet.
                      </p>
                    )}
                  </div>

                  {/* Add link draft */}
                  <div className='p-3 bg-zinc-900/30 border border-dashed border-zinc-900 rounded-lg space-y-2 text-xs font-sans'>
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
                      <div>
                        <span className='text-[10px] text-zinc-500 mb-1 block'>
                          Link Title:
                        </span>
                        <input
                          type='text'
                          className='w-full bg-zinc-900/70 border border-zinc-900 px-2 py-1.5 rounded-lg text-xs text-zinc-100 placeholder-zinc-700'
                          placeholder='GitHub Desktop Repo'
                          value={newLinkName}
                          onChange={(e) => setNewLinkName(e.target.value)}
                        />
                      </div>
                      <div>
                        <span className='text-[10px] text-zinc-500 mb-1 block'>
                          Redirection URL:
                        </span>
                        <input
                          type='text'
                          className='w-full bg-zinc-900/70 border border-zinc-900 px-2 py-1.5 rounded-lg text-xs font-mono text-zinc-100 placeholder-zinc-700'
                          placeholder='https://github.com'
                          value={newLinkUrl}
                          onChange={(e) => setNewLinkUrl(e.target.value)}
                        />
                      </div>
                    </div>

                    <button
                      type='button'
                      onClick={() => {
                        if (!newLinkName.trim() || !newLinkUrl.trim()) return;
                        let finalUrl = newLinkUrl.trim();
                        if (!/^https?:\/\//i.test(finalUrl)) {
                          finalUrl = `https://${finalUrl}`;
                        }
                        setFormLinks((prev) => [
                          ...prev,
                          { name: newLinkName.trim(), url: finalUrl },
                        ]);
                        setNewLinkName('');
                        setNewLinkUrl('');
                      }}
                      className='w-full py-1.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 text-[10px] font-bold rounded-lg border border-zinc-800'
                    >
                      Add Link
                    </button>
                  </div>
                </div>

                {/* ITEM C: DIRECTORY FOLDERS */}
                <div className='p-4 rounded-lg bg-zinc-900/10 border border-zinc-900 space-y-3'>
                  <div className='flex items-center justify-between border-b border-zinc-900/60 pb-1.5'>
                    <span className='text-xs font-bold text-zinc-400 flex items-center gap-1.5'>
                      <Folder className='w-3.5 h-3.5 text-zinc-500' />
                      <span>Drive Folders ({formFolders.length})</span>
                    </span>
                    <span className='text-[10px] text-zinc-650 font-mono'>
                      Binds folder paths
                    </span>
                  </div>

                  {/* List of Directories */}
                  <div className='space-y-1.5'>
                    {formFolders.map((folder, fIdx) => (
                      <div
                        key={fIdx}
                        className='flex justify-between items-center text-xs bg-zinc-900/20 p-2 rounded-lg border border-zinc-900'
                      >
                        <div className='min-w-0 pr-2'>
                          <span className='font-semibold text-zinc-200'>
                            {folder.name}
                          </span>
                          <span className='font-mono text-[9px] text-zinc-550 block truncate'>
                            ({folder.path})
                          </span>
                        </div>
                        <button
                          type='button'
                          onClick={() =>
                            setFormFolders((prev) =>
                              prev.filter((_, idx) => idx !== fIdx)
                            )
                          }
                          className='text-red-400 hover:text-red-350 text-xs font-bold'
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    {formFolders.length === 0 && (
                      <p className='text-[11px] text-zinc-650 italic'>
                        No folder paths defined yet.
                      </p>
                    )}
                  </div>

                  {/* Add folder draft */}
                  <div className='p-3 bg-zinc-900/30 border border-dashed border-zinc-900 rounded-lg space-y-2 text-xs font-sans'>
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
                      <div>
                        <span className='text-[10px] text-zinc-500 mb-1 block'>
                          Folder Nickname:
                        </span>
                        <input
                          type='text'
                          className='w-full bg-zinc-900/70 border border-zinc-900 px-2 py-1.5 rounded-lg text-xs text-zinc-100 placeholder-zinc-700'
                          placeholder='Projects Directory'
                          value={newFolderName}
                          onChange={(e) => setNewFolderName(e.target.value)}
                        />
                      </div>
                      <div>
                        <span className='text-[10px] text-zinc-500 mb-1 block'>
                          Absolute Drive Path:
                        </span>
                        <input
                          type='text'
                          className='w-full bg-zinc-900/70 border border-zinc-900 px-2 py-1.5 rounded-lg text-xs font-mono text-zinc-100 placeholder-zinc-700'
                          placeholder='D:/Projects'
                          value={newFolderPath}
                          onChange={(e) => setNewFolderPath(e.target.value)}
                        />
                      </div>
                    </div>

                    <button
                      type='button'
                      onClick={() => {
                        if (!newFolderName.trim() || !newFolderPath.trim())
                          return;
                        setFormFolders((prev) => [
                          ...prev,
                          {
                            name: newFolderName.trim(),
                            path: newFolderPath.trim(),
                          },
                        ]);
                        setNewFolderName('');
                        setNewFolderPath('');
                      }}
                      className='w-full py-1.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 text-[10px] font-bold rounded-lg border border-zinc-800'
                    >
                      Hold Directory Path
                    </button>
                  </div>
                </div>

                {/* Submit Actions */}
                <div className='pt-4 border-t border-zinc-900 gap-2.5 flex items-center justify-end font-sans'>
                  <button
                    type='button'
                    onClick={() => {
                      setIsCreatingNew(false);
                      setEditingWorkspace(null);
                    }}
                    className='px-4 py-1.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 rounded-lg text-xs font-semibold text-zinc-350 cursor-pointer'
                  >
                    Cancel Action
                  </button>
                  <button
                    type='submit'
                    className='px-5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-bold rounded-lg text-xs shadow-sm cursor-pointer'
                  >
                    Save & Compile Template
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
