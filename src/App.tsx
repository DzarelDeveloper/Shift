import React, {
  useState,
  useEffect,
  createContext,
  useContext,
  useCallback,
} from 'react';

import { Workspace, ThemeConfig, InstalledApp } from './types';
import { DEFAULT_WORKSPACES } from './data/defaultWorkspaces';
import { useTheme } from './hooks/useTheme';
import { useDataStore } from './hooks/useDataStore';
import Dashboard from './components/Dashboard';
import OnboardingWizard from './components/OnboardingWizard';
import UpdateWizard from './components/UpdateWizard';
import { LauncherWindow } from './components/LauncherWindow';
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

  const {
    data: workspaces,
    setData: setWorkspaces,
    isLoaded: workspacesLoaded,
  } = useDataStore<Workspace[]>('workspaces.json', DEFAULT_WORKSPACES, {
    autoSave: true,
    parseRawApp: false,
  });

  useEffect(() => {
    if (workspacesLoaded) {
      console.log(`[Workspace Count]: ${workspaces.length}`);
    }
  }, [workspaces, workspacesLoaded]);

  const { data: launchAtStartup, setData: setLaunchAtStartup } = useDataStore(
    'settings_startup.json',
    true
  );
  const { data: minimizeToTray, setData: setMinimizeToTray } = useDataStore(
    'settings_tray.json',
    true
  );
  const { data: shortcutKey, setData: setShortcutKey } = useDataStore(
    'settings_shortcut.json',
    ''
  );
  const { data: dashboardShortcutKey, setData: setDashboardShortcutKey } = useDataStore(
    'settings_dashboard_shortcut.json',
    ''
  );
  const { data: autoBypassPreview, setData: setAutoBypassPreview } =
    useDataStore('settings_bypass.json', false);

  const [isMinimized, setIsMinimized] = useState(false);
  const [apps, setApps] = useState<InstalledApp[]>([]);

  // Log whenever apps state updates AND send to launcher window via event
  useEffect(() => {
    console.log('-----------------------------------------------------------');
    console.log('📊 Apps STATE UPDATE!');
    console.log('   📊 apps.length:', apps.length);
    if (apps.length > 0) {
      console.log('   📊 First 10 apps in state:');
      apps
        .slice(0, 10)
        .forEach((app, i) => console.log(`      #${i + 1}`, app));
    }
    console.log('-----------------------------------------------------------');

    // Send updated apps to all windows via Tauri event
    if (isTauri && isMainWindow) {
      import('@tauri-apps/api/event').then(({ emit }) => {
        emit('shift://apps-updated', apps).catch(console.error);
      });
    }
  }, [apps, isMainWindow]);

  // Send updated workspaces to all windows whenever they change
  useEffect(() => {
    if (isTauri && isMainWindow) {
      import('@tauri-apps/api/event').then(({ emit }) => {
        emit('shift://workspaces-updated', workspaces).catch(console.error);
      });
    }
  }, [workspaces, isMainWindow]);

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
    console.log('----------------------------------------');
    console.log('📋 App.tsx: fetchApps useEffect RUNNING!');
    console.log('   🔹 windowLabel:', windowLabel);
    console.log('   🔹 isMainWindow:', windowLabel === 'main');
    console.log('   🔹 __TAURI__ in window?', '__TAURI__' in window);
    console.log('----------------------------------------');

    async function fetchApps() {
      console.log('🚀 fetchApps() CALLED!');
      if (windowLabel !== 'main') {
        console.log('❌ Not main window, SKIPPING fetch!');
        return;
      }
      console.log('✅ Main window confirmed, proceeding!');

      if (typeof window !== 'undefined' && '__TAURI__' in window) {
        try {
          console.log("📞 Calling Tauri's get_installed_apps()...");
          const { invoke } = await import('@tauri-apps/api/core');
          const installedAppsRaw = await invoke('get_installed_apps');
          console.log('✅ Tauri invoke SUCCESS!');
          console.log('   📦 Raw data type:', typeof installedAppsRaw);
          console.log('   📦 Raw data:', installedAppsRaw);

          const installedApps = installedAppsRaw as InstalledApp[];

          console.log('🔍 Installed apps type:', typeof installedApps);
          console.log('🔍 Is Array?', Array.isArray(installedApps));
          console.log('🔍 Apps length:', installedApps.length);

          if (Array.isArray(installedApps) && installedApps.length > 0) {
            console.log('📋 First 10 apps:');
            installedApps.slice(0, 10).forEach((app, i) => {
              console.log(`   #${i + 1}:`, app);
            });
          }

          console.log('💾 Calling setApps with this data!');
          setApps(installedApps);
        } catch (e) {
          console.error('❌ Failed to fetch installed apps! Error:', e);
        }
      } else {
        console.log('❌ Not in Tauri environment, SKIPPING fetch!');
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
    dashboardShortcutKey,
    minimizeToTray,
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

  const exportWorkspaces = useCallback(async (): Promise<void> => {
    try {
      const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;
      const jsonString = createExportData(workspaces, {
        launchAtStartup,
        minimizeToTray,
        shortcutKey,
        dashboardShortcutKey,
        autoBypassPreview,
      });
      const defaultFileName = `shift-workspaces-${new Date().toISOString().slice(0, 10)}.shift`;

      if (isTauri) {
        const { save } = await import('@tauri-apps/plugin-dialog');
        const { writeTextFile } = await import('@tauri-apps/plugin-fs');

        const filePath = await save({
          defaultPath: defaultFileName,
          filters: [
            {
              name: 'Shift Workspace',
              extensions: ['shift', 'json'],
            },
          ],
        });

        if (filePath) {
          await writeTextFile(filePath, jsonString);
          triggerToast(
            'Export Successful',
            'Your workspaces have been exported successfully!'
          );
        }
      } else {
        // Fallback for browser dev mode
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = defaultFileName;
        a.click();
        URL.revokeObjectURL(url);
        triggerToast(
          'Export Successful',
          'Your workspaces have been exported successfully!'
        );
      }
    } catch (error) {
      console.error('Export error:', error);
      triggerToast(
        'Export Failed',
        'Something went wrong while exporting.',
        'info'
      );
    }
  }, [
    workspaces,
    launchAtStartup,
    minimizeToTray,
    shortcutKey,
    dashboardShortcutKey,
    autoBypassPreview,
    triggerToast,
  ]);

  const importWorkspaces = useCallback(async (): Promise<void> => {
    try {
      const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;

      let fileContent: string;

      if (isTauri) {
        const { open } = await import('@tauri-apps/plugin-dialog');
        const { readTextFile } = await import('@tauri-apps/plugin-fs');

        const selected = await open({
          filters: [
            {
              name: 'Shift Workspace',
              extensions: ['shift', 'json'],
            },
          ],
          multiple: false,
        });

        if (!selected) return;
        fileContent = await readTextFile(selected);
      } else {
        // Fallback for browser dev mode
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.shift,application/json';

        fileContent = await new Promise((resolve, reject) => {
          input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
              resolve(await file.text());
            } else {
              reject(new Error('No file selected'));
            }
          };
          input.click();
        });
      }

      const data = parseImportData(fileContent);

      // Ask user to confirm import using Tauri dialog if in Tauri env
      let proceed = false;
      if (isTauri) {
        const { ask } = await import('@tauri-apps/plugin-dialog');
        proceed = await ask(
          'Do you want to import and merge these workspaces into your current list?',
          { title: 'Import Workspaces', kind: 'info' }
        );
      } else {
        proceed = window.confirm(
          'Do you want to import and merge these workspaces into your current list?'
        );
      }

      if (!proceed) return;

      setWorkspaces((prevWorkspaces) => {
        const existingIds = new Set(prevWorkspaces.map((w) => w.id));
        const merged = [...prevWorkspaces];
        for (const w of data.workspaces) {
          if (existingIds.has(w.id)) {
            // ID collision! Generate a new unique ID and append name
            const newId = `ws-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            merged.push({
              ...w,
              id: newId,
              name: `${w.name} (Imported)`,
            });
          } else {
            merged.push(w);
          }
        }
        return merged;
      });

      // Apply preferences if available
      if (data.preferences) {
        if (data.preferences.launchAtStartup !== undefined) {
          setLaunchAtStartup(data.preferences.launchAtStartup);
          if (isTauri) {
            const { invoke } = await import('@tauri-apps/api/core');
            if (data.preferences.launchAtStartup) {
              await invoke('plugin:autostart|enable');
            } else {
              await invoke('plugin:autostart|disable');
            }
          }
        }
        if (data.preferences.minimizeToTray !== undefined) {
          setMinimizeToTray(data.preferences.minimizeToTray);
          if (isTauri) {
            const { invoke } = await import('@tauri-apps/api/core');
            await invoke('set_minimize_to_tray', {
              value: data.preferences.minimizeToTray,
            });
          }
        }
        if (data.preferences.shortcutKey !== undefined) {
          setShortcutKey(data.preferences.shortcutKey);
        }
        if (data.preferences.dashboardShortcutKey !== undefined) {
          setDashboardShortcutKey(data.preferences.dashboardShortcutKey);
        }
        if (data.preferences.shortcutKey !== undefined || data.preferences.dashboardShortcutKey !== undefined) {
          if (isTauri) {
            const { invoke } = await import('@tauri-apps/api/core');
            await invoke('set_global_shortcut', {
              newLauncherShortcut: data.preferences.shortcutKey !== undefined ? data.preferences.shortcutKey : shortcutKey,
              newDashboardShortcut: data.preferences.dashboardShortcutKey !== undefined ? data.preferences.dashboardShortcutKey : dashboardShortcutKey,
            });
          }
        }
        if (data.preferences.autoBypassPreview !== undefined) {
          setAutoBypassPreview(data.preferences.autoBypassPreview);
        }
      }

      triggerToast(
        'Import Successful',
        'Your workspaces and preferences have been imported!'
      );
    } catch (error) {
      console.error('Import error:', error);
      triggerToast(
        'Import Failed',
        'The file is corrupted or in an invalid format.',
        'info'
      );
    }
  }, [
    workspaces,
    setWorkspaces,
    setLaunchAtStartup,
    setMinimizeToTray,
    setShortcutKey,
    setDashboardShortcutKey,
    shortcutKey,
    dashboardShortcutKey,
    setAutoBypassPreview,
    triggerToast,
  ]);

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
  }, [
    previewingWorkspace,
    previewSecondsLeft,
    previewAutoTimerActive,
    executeWorkspacePipeline,
  ]);

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

  // Listen for launch workspace events from the launcher window
  useEffect(() => {
    if (!isTauri || !isMainWindow) return;

    let unlistenLaunchWorkspace: (() => void) | null = null;

    import('@tauri-apps/api/event').then(({ listen }) => {
      listen('shift://launch-workspace', (event) => {
        console.log('[Main] Received launch workspace event:', event.payload);
        const workspace = event.payload as Workspace;
        handleLaunchWorkspace(workspace);
      }).then((fn) => {
        unlistenLaunchWorkspace = fn;
      });
    });

    return () => {
      if (unlistenLaunchWorkspace) unlistenLaunchWorkspace();
    };
  }, [isMainWindow, handleLaunchWorkspace]);

  // While we're waiting for the window label to resolve, render nothing.
  // This prevents the launcher window from flashing the Dashboard UI and,
  // critically, from running Tauri-backend calls that belong only to main.
  if (windowLabel === null) {
    return null;
  }

  if (isLauncherWindow) {
    return <LauncherWindow />;
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
            dashboardShortcutKey={dashboardShortcutKey}
            setDashboardShortcutKey={setDashboardShortcutKey}
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
