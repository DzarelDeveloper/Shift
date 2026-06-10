import React, {
  useState,
  useEffect,
  createContext,
  useContext,
  useCallback,
} from 'react';

import {
  Workspace,
  ThemeConfig,
  InstalledApp,
  ShiftExportData,
  RawInstalledApp,
} from './types';
import { DEFAULT_WORKSPACES } from './data/defaultWorkspaces';
import { useTheme } from './hooks/useTheme';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useDataStore } from './hooks/useDataStore';
import Dashboard from './components/Dashboard';
import OnboardingWizard from './components/OnboardingWizard';
import UpdateWizard from './components/UpdateWizard';
import LauncherPanel from './components/LauncherPanel';
import { LaunchEnvironmentPreviewModal } from './components/LaunchEnvironmentPreviewModal';
import { ExecutionOverlay } from './components/ExecutionOverlay';
import { ToastNotification } from './components/ToastNotification';
import { DockToTrayOverlay } from './components/DockToTrayOverlay';
import { createExportData, parseImportData } from './utils/workspaceUtils';
import { useWorkspaceLauncher } from './hooks/useWorkspaceLauncher';
import { useGlobalShortcut } from './hooks/useGlobalShortcut';
import { useAppInfo } from './hooks/useAppInfo';
import { APP_CONFIG } from './config/app';

const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;

if (isTauri) {
  import('@tauri-apps/plugin-log')
    .then(({ attachConsole }) => {
      attachConsole();
    })
    .catch(console.error);
}

interface AppContextType {
  workspaces: Workspace[];
  setWorkspaces: React.Dispatch<React.SetStateAction<Workspace[]>>;
  theme: ThemeConfig;
  setTheme: React.Dispatch<React.SetStateAction<ThemeConfig>>;
  exportWorkspaces: () => void;
  importWorkspaces: (file: File) => Promise<void>;
  apps: InstalledApp[];
  setApps: React.Dispatch<React.SetStateAction<InstalledApp[]>>;
  triggerToast: (
    title: string,
    desc: string,
    type?: 'success' | 'info'
  ) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

export default function App() {
  const { theme, setTheme } = useTheme();

  // null = not yet resolved; avoids running main-only hooks in the launcher window.
  const [windowLabel, setWindowLabel] = useState<string | null>(null);
  useEffect(() => {
    if (isTauri) {
      import('@tauri-apps/api/window').then(({ getCurrentWindow }) => {
        setWindowLabel(getCurrentWindow().label);
      });
    } else {
      // In browser dev-mode there is only one "window" – treat as main.
      setWindowLabel('main');
    }
  }, []);

  const isMainWindow = windowLabel === 'main';
  const isLauncherWindow = windowLabel === 'launcher';

  const { data: workspaces, setData: setWorkspaces, isLoaded: workspacesLoaded } = useDataStore<Workspace[]>(
    'workspaces.json',
    DEFAULT_WORKSPACES,
    { autoSave: true, parseRawApp: false }
  );

  useEffect(() => {
    if (workspacesLoaded) {
      console.log(`[Workspace Count]: ${workspaces.length}`);
    }
  }, [workspaces, workspacesLoaded]);

  const { data: launchAtStartup, setData: setLaunchAtStartup } = useDataStore('settings_startup.json', true);
  const { data: minimizeToTray, setData: setMinimizeToTray } = useDataStore('settings_tray.json', true);
  const { data: shortcutKey, setData: setShortcutKey } = useDataStore('settings_shortcut.json', '');
  const { data: autoBypassPreview, setData: setAutoBypassPreview } = useDataStore('settings_bypass.json', false);

  const [isMinimized, setIsMinimized] = useState(false);
  const [isLauncherOpen, setIsLauncherOpen] = useState(false);
  const [apps, setApps] = useState<InstalledApp[]>([]);

  // Log whenever apps state updates
  useEffect(() => {
    console.log("-----------------------------------------------------------");
    console.log("📊 Apps STATE UPDATE!");
    console.log("   📊 apps.length:", apps.length);
    if (apps.length > 0) {
      console.log("   📊 First 10 apps in state:");
      apps.slice(0,10).forEach((app, i) => console.log(`      #${i+1}`, app));
    }
    console.log("-----------------------------------------------------------");
  }, [apps]);

  // Version is read once from Tauri via useAppInfo (single source of truth).
  const { version: currentVersion } = useAppInfo();

  const [wizardState, setWizardState] = useState<
    'loading' | 'onboarding' | 'update' | 'none'
  >('loading');

  useEffect(() => {
    if (!currentVersion) return; // wait for Tauri to resolve
    const savedVersion = localStorage.getItem('shift_last_version');
    const hasCompletedOnboarding =
      localStorage.getItem('shift_onboarding_completed') === 'true';

    if (!hasCompletedOnboarding) {
      setWizardState('onboarding');
    } else if (savedVersion !== currentVersion) {
      setWizardState('update');
    } else {
      setWizardState('none');
    }
  }, [currentVersion]);

  useEffect(() => {
    console.log("----------------------------------------");
    console.log("📋 App.tsx: fetchApps useEffect RUNNING!");
    console.log("   🔹 windowLabel:", windowLabel);
    console.log("   🔹 isMainWindow:", windowLabel === "main");
    console.log("   🔹 __TAURI__ in window?", "__TAURI__" in window);
    console.log("----------------------------------------");
    
    async function fetchApps() {
      console.log("🚀 fetchApps() CALLED!");
      if (windowLabel !== "main") {
        console.log("❌ Not main window, SKIPPING fetch!");
        return;
      }
      console.log("✅ Main window confirmed, proceeding!");
      
      if (typeof window !== 'undefined' && '__TAURI__' in window) {
        try {
          console.log("📞 Calling Tauri's get_installed_apps()...");
          const { invoke } = await import('@tauri-apps/api/core');
          const installedAppsRaw = await invoke('get_installed_apps');
          console.log("✅ Tauri invoke SUCCESS!");
          console.log("   📦 Raw data type:", typeof installedAppsRaw);
          console.log("   📦 Raw data:", installedAppsRaw);
          
          const installedApps = installedAppsRaw as InstalledApp[];
          
          console.log("🔍 Installed apps type:", typeof installedApps);
          console.log("🔍 Is Array?", Array.isArray(installedApps));
          console.log("🔍 Apps length:", installedApps.length);
          
          if (Array.isArray(installedApps) && installedApps.length > 0) {
            console.log("📋 First 10 apps:");
            installedApps.slice(0, 10).forEach((app, i) => {
              console.log(`   #${i+1}:`, app);
            });
          }
          
          console.log("💾 Calling setApps with this data!");
          setApps(installedApps);
          
        } catch (e) {
          console.error("❌ Failed to fetch installed apps! Error:", e);
        }
      } else {
        console.log("❌ Not in Tauri environment, SKIPPING fetch!");
      }
    }
    fetchApps();
  }, [windowLabel]);

  const [previewingWorkspace, setPreviewingWorkspace] =
    useState<Workspace | null>(null);
  const [previewSecondsLeft, setPreviewSecondsLeft] = useState(4);
  const [previewAutoTimerActive, setPreviewAutoTimerActive] = useState(true);

  const [notification, setNotification] = useState<{
    title: string;
    desc: string;
    type: 'success' | 'info';
  } | null>(null);

  const triggerToast = useCallback(
    (title: string, desc: string, type: 'success' | 'info' = 'success') => {
      setNotification({ title, desc, type });
      setTimeout(() => {
        setNotification(null);
      }, 4500);
    },
    []
  );

  const {
    activeLaunchingWs,
    launchSteps,
    currentStepIndex,
    executeWorkspacePipeline,
  } = useWorkspaceLauncher({ triggerToast });

  // Only the MAIN window registers the global shortcut with the Rust backend.
  // The launcher window must NOT call set_global_shortcut; doing so would
  // unregister + re-register the shortcuts in a race condition every time
  // the launcher window mounts.
  useGlobalShortcut({
    shortcutKey,
    minimizeToTray,
    isMinimized,
    setIsMinimized,
    setIsLauncherOpen,
    previewingWorkspace,
    triggerToast,
    enabled: isMainWindow,
  });

  // Auto-hide the launcher window when it loses focus (click outside)
  useEffect(() => {
    if (windowLabel !== 'launcher') return;
    if (!isTauri) return;

    let unlisten: (() => void) | null = null;
    import('@tauri-apps/api/event').then(({ listen }) => {
      listen('tauri://blur', async () => {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        await getCurrentWindow().hide();
        console.log('[Launcher auto-hidden on blur]');
      }).then((fn) => {
        unlisten = fn;
      });
    });

    return () => {
      if (unlisten) unlisten();
    };
  }, [windowLabel]);

  const exportWorkspaces = useCallback(() => {
    const jsonString = createExportData(workspaces, {
      launchAtStartup,
      minimizeToTray,
      shortcutKey,
      autoBypassPreview,
    });
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shift-workspaces-${new Date().toISOString().slice(0, 10)}.shift`;
    a.click();
    URL.revokeObjectURL(url);
    triggerToast(
      'Export Successful',
      'Your workspaces have been exported successfully!'
    );
  }, [
    workspaces,
    launchAtStartup,
    minimizeToTray,
    shortcutKey,
    autoBypassPreview,
    triggerToast,
  ]);

  const importWorkspaces = useCallback(
    async (file: File): Promise<void> => {
      try {
        const text = await file.text();
        const data = parseImportData(text);

        const shouldReplace = confirm(
          'Replace existing workspaces? (Cancel to merge)'
        );
        if (shouldReplace) {
          setWorkspaces(data.workspaces);
        } else {
          const existingIds = new Set(workspaces.map((w) => w.id));
          const newWorkspaces = data.workspaces.filter(
            (w) => !existingIds.has(w.id)
          );
          setWorkspaces([...workspaces, ...newWorkspaces]);
        }
        if (data.preferences) {
          triggerToast(
            'Import Successful',
            'Your workspaces have been imported successfully!'
          );
        }
      } catch (error) {
        console.error('Import error:', error);
        triggerToast(
          'Import Failed',
          'The file is corrupted or in an invalid format.',
          'info'
        );
      }
    },
    [workspaces, triggerToast]
  );

  const handleOnboardingComplete = useCallback(
    (config: {
      minimizeToTray: boolean;
      launchAtStartup: boolean;
      firstWorkspace: string;
    }) => {
      setMinimizeToTray(config.minimizeToTray);
      setLaunchAtStartup(config.launchAtStartup);
      localStorage.setItem('shift_onboarding_completed', 'true');
      localStorage.setItem('shift_last_version', currentVersion);
      setWizardState('none');
      triggerToast(
        'Installation Complete',
        `Welcome to ${APP_CONFIG.name}! Create your first workspace.`,
        'success'
      );
      window.dispatchEvent(
        new window.CustomEvent('switch-tab', { detail: 'home' })
      );
    },
    [triggerToast, setMinimizeToTray, setLaunchAtStartup, currentVersion]
  );

  const handleUpdateComplete = useCallback(() => {
    localStorage.setItem('shift_last_version', currentVersion);
    setWizardState('none');
    triggerToast(
      'Update Complete',
      `${APP_CONFIG.name} has been updated to v${currentVersion}`,
      'success'
    );
  }, [currentVersion, triggerToast]);

  useEffect(() => {
    if (!previewingWorkspace) return;
    if (!previewAutoTimerActive) return;

    if (previewSecondsLeft > 0) {
      const timer = setTimeout(() => {
        setPreviewSecondsLeft((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      executeWorkspacePipeline(previewingWorkspace);
      setPreviewingWorkspace(null);
    }
  }, [previewingWorkspace, previewSecondsLeft, previewAutoTimerActive]);

  const handleLaunchItem = useCallback(
    async (item: {
      type: 'workspace' | 'app';
      data: Workspace | InstalledApp;
    }) => {
      setIsLauncherOpen(false);
      if (item.type === 'workspace') {
        const workspace = item.data as Workspace;
        if (autoBypassPreview) {
          executeWorkspacePipeline(workspace);
        } else {
          setPreviewingWorkspace(workspace);
          setPreviewSecondsLeft(4);
          setPreviewAutoTimerActive(true);
        }
      } else {
        const app = item.data as InstalledApp;
        try {
          const { invoke } = await import('@tauri-apps/api/core');
          await invoke('launch_application', { path: app.path });
          triggerToast(
            'App Launched',
            `${app.name} has been opened!`,
            'success'
          );
        } catch (e) {
          console.error('Failed to launch app:', e);
          triggerToast('Launch Failed', `Could not open ${app.name}`, 'info');
        }
      }
    },
    [autoBypassPreview, executeWorkspacePipeline, triggerToast]
  );

  const handleLaunchWorkspace = useCallback(
    (workspace: Workspace) => {
      if (autoBypassPreview) {
        executeWorkspacePipeline(workspace);
      } else {
        setPreviewingWorkspace(workspace);
        setPreviewSecondsLeft(4);
        setPreviewAutoTimerActive(true);
      }
    },
    [autoBypassPreview, executeWorkspacePipeline]
  );

  // While we're waiting for the window label to resolve, render nothing.
  // This prevents the launcher window from flashing the Dashboard UI and,
  // critically, from running Tauri-backend calls that belong only to main.
  if (windowLabel === null) {
    return null;
  }

  if (isLauncherWindow) {
    return (
      <AppContext.Provider
        value={{
          workspaces,
          setWorkspaces,
          theme,
          setTheme,
          exportWorkspaces,
          importWorkspaces,
          apps,
          setApps,
          triggerToast,
        }}
      >
        <div className='w-screen h-screen bg-transparent font-sans select-none overflow-hidden text-neutral-900 dark:text-neutral-100'>
          <LauncherPanel
            isOpen={true}
            onClose={async () => {
              if (isTauri) {
                const { getCurrentWindow } =
                  await import('@tauri-apps/api/window');
                await getCurrentWindow().hide();
                console.log('[Launcher Closed]');
              }
            }}
            workspaces={workspaces}
            apps={apps}
            onLaunch={handleLaunchItem}
            onOpenDashboard={async () => {
              if (isTauri) {
                const { getCurrentWindow, getAllWindows } =
                  await import('@tauri-apps/api/window');
                await getCurrentWindow().hide();
                const windows = await getAllWindows();
                const mainWindow = windows.find((w) => w.label === 'main');
                if (mainWindow) {
                  await mainWindow.show();
                  await mainWindow.unminimize();
                  await mainWindow.setFocus();
                }
              }
            }}
            onOpenSettings={async () => {
              if (isTauri) {
                const { getCurrentWindow, getAllWindows } =
                  await import('@tauri-apps/api/window');
                await getCurrentWindow().hide();
                const windows = await getAllWindows();
                const mainWindow = windows.find((w) => w.label === 'main');
                if (mainWindow) {
                  await mainWindow.show();
                  await mainWindow.unminimize();
                  await mainWindow.setFocus();
                  mainWindow.emit('open-settings');
                }
              }
            }}
          />
        </div>
      </AppContext.Provider>
    );
  }

  return (
    <AppContext.Provider
      value={{
        workspaces,
        setWorkspaces,
        theme,
        setTheme,
        exportWorkspaces,
        importWorkspaces,
        apps,
        setApps,
        triggerToast,
      }}
    >
      <div className='w-screen h-screen flex flex-col font-sans select-none overflow-hidden bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100'>
        <div className='flex-1 overflow-y-auto'>
          <Dashboard
            workspaces={workspaces}
            setWorkspaces={setWorkspaces}
            onLaunchWorkspace={handleLaunchWorkspace}
            launchAtStartup={launchAtStartup}
            setLaunchAtStartup={setLaunchAtStartup}
            minimizeToTray={minimizeToTray}
            setMinimizeToTray={setMinimizeToTray}
            shortcutKey={shortcutKey}
            setShortcutKey={setShortcutKey}
            autoBypassPreview={autoBypassPreview}
            setAutoBypassPreview={setAutoBypassPreview}
            isMinimized={isMinimized}
            setIsMinimized={setIsMinimized}
            triggerToast={triggerToast}
          />
        </div>

        <DockToTrayOverlay
          isVisible={isMinimized}
          shortcutKey={shortcutKey}
          launchAtStartup={launchAtStartup}
          workspaces={workspaces}
          onRestore={() => setIsMinimized(false)}
          onLaunchWorkspace={handleLaunchWorkspace}
        />

        <LauncherPanel
          isOpen={isLauncherOpen}
          onClose={() => setIsLauncherOpen(false)}
          workspaces={workspaces}
          apps={apps}
          onLaunch={handleLaunchItem}
          onOpenDashboard={() => {
            setIsLauncherOpen(false);
            setIsMinimized(false);
            window.dispatchEvent(
              new window.CustomEvent('switch-tab', { detail: 'home' })
            );
          }}
          onOpenSettings={() => {
            setIsLauncherOpen(false);
            setIsMinimized(false);
            window.dispatchEvent(
              new window.CustomEvent('switch-tab', { detail: 'settings' })
            );
          }}
        />

        <LaunchEnvironmentPreviewModal
          workspace={previewingWorkspace}
          autoBypassPreview={autoBypassPreview}
          setAutoBypassPreview={setAutoBypassPreview}
          previewSecondsLeft={previewSecondsLeft}
          isTimerActive={previewAutoTimerActive}
          toggleTimer={() => setPreviewAutoTimerActive((prev) => !prev)}
          onCancel={() => setPreviewingWorkspace(null)}
          onLaunch={() => {
            if (previewingWorkspace) {
              executeWorkspacePipeline(previewingWorkspace);
              setPreviewingWorkspace(null);
            }
          }}
        />

        <ExecutionOverlay
          workspace={activeLaunchingWs}
          steps={launchSteps}
          currentStepIndex={currentStepIndex}
        />

        <ToastNotification
          isVisible={!!notification}
          title={notification?.title || ''}
          description={notification?.desc || ''}
          onClose={() => setNotification(null)}
        />

        {wizardState === 'onboarding' && (
          <OnboardingWizard onComplete={handleOnboardingComplete} />
        )}

        {wizardState === 'update' && (
          <UpdateWizard
            version={currentVersion}
            onComplete={handleUpdateComplete}
          />
        )}
      </div>
    </AppContext.Provider>
  );
}
