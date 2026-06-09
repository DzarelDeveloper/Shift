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

  const [windowLabel, setWindowLabel] = useState<string>('main');
  useEffect(() => {
    if (isTauri) {
      import('@tauri-apps/api/window').then(({ getCurrentWindow }) => {
        setWindowLabel(getCurrentWindow().label);
      });
    }
  }, []);

  const [workspaces, setWorkspaces] = useState<Workspace[]>(() => {
    localStorage.removeItem('workspace_launcher_items');
    return DEFAULT_WORKSPACES;
  });

  useEffect(() => {
    localStorage.setItem(
      'workspace_launcher_items',
      JSON.stringify(workspaces)
    );
    console.log(`[Workspace Count]: ${workspaces.length}`);
  }, [workspaces]);

  const [launchAtStartup, setLaunchAtStartup] = useLocalStorage(
    'workspace_launcher_startup',
    true
  );
  const [minimizeToTray, setMinimizeToTray] = useLocalStorage(
    'workspace_launcher_tray',
    true
  );
  const [shortcutKey, setShortcutKey] = useLocalStorage(
    'workspace_launcher_shortcut',
    ''
  );
  const [autoBypassPreview, setAutoBypassPreview] = useLocalStorage(
    'workspace_launcher_bypass_preview',
    false
  );

  const [isMinimized, setIsMinimized] = useState(false);
  const [isLauncherOpen, setIsLauncherOpen] = useState(false);
  const [apps, setApps] = useState<InstalledApp[]>([]);

  const [wizardState, setWizardState] = useState<'loading' | 'onboarding' | 'update' | 'none'>('loading');
  const [currentVersion, setCurrentVersion] = useState('0.5.4');

  useEffect(() => {
    async function initWizardState() {
      let version = '0.5.4';
      try {
        if (typeof window !== 'undefined' && '__TAURI__' in window) {
          const { getVersion } = await import('@tauri-apps/api/app');
          version = await getVersion();
        }
      } catch (e) {
        console.error('Failed to get app version', e);
      }
      setCurrentVersion(version);

      const savedVersion = localStorage.getItem('shift_last_version');
      const hasCompletedOnboarding = localStorage.getItem('shift_onboarding_completed') === 'true';

      if (!hasCompletedOnboarding) {
        setWizardState('onboarding');
      } else if (savedVersion !== version) {
        setWizardState('update');
      } else {
        setWizardState('none');
      }
    }
    initWizardState();
  }, []);

  useEffect(() => {
    async function fetchApps() {
      if (typeof window !== 'undefined' && '__TAURI__' in window) {
        try {
          const { invoke } = await import('@tauri-apps/api/core');
          const installedApps = await invoke('get_installed_apps');
          setApps(installedApps as InstalledApp[]);
          console.log(`[Installed Apps Count]: ${((installedApps as InstalledApp[]) || []).length}`);
        } catch (e) {
          console.error('Failed to fetch installed apps', e);
        }
      }
    }
    fetchApps();
  }, []);

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

  useGlobalShortcut({
    shortcutKey,
    minimizeToTray,
    isMinimized,
    setIsMinimized,
    setIsLauncherOpen,
    previewingWorkspace,
    triggerToast,
  });

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
        'Welcome to Shift! Create your first workspace.',
        'success'
      );
      window.dispatchEvent(new CustomEvent('switch-tab', { detail: 'home' }));
    },
    [triggerToast, setMinimizeToTray, setLaunchAtStartup, currentVersion]
  );

  const handleUpdateComplete = useCallback(() => {
    localStorage.setItem('shift_last_version', currentVersion);
    setWizardState('none');
    triggerToast('Update Complete', `Shift has been updated to v${currentVersion}`, 'success');
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

  if (windowLabel === 'launcher') {
    return (
      <AppContext.Provider
        value={{
          workspaces,
          setWorkspaces,
          theme,
          setTheme,
          exportWorkspaces,
          importWorkspaces,
          triggerToast,
        }}
      >
        <div className='w-screen h-screen bg-transparent font-sans select-none overflow-hidden text-neutral-900 dark:text-neutral-100'>
          <LauncherPanel
            isOpen={true}
            onClose={async () => {
              if (isTauri) {
                const { getCurrentWindow } = await import('@tauri-apps/api/window');
                await getCurrentWindow().hide();
                console.log('[Launcher Closed]');
              }
            }}
            workspaces={workspaces}
            apps={apps}
            onLaunch={handleLaunchItem}
            onOpenDashboard={async () => {
              if (isTauri) {
                const { getCurrentWindow, getAllWindows } = await import('@tauri-apps/api/window');
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
                const { getCurrentWindow, getAllWindows } = await import('@tauri-apps/api/window');
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
            window.dispatchEvent(new CustomEvent('switch-tab', { detail: 'home' }));
          }}
          onOpenSettings={() => {
            setIsLauncherOpen(false);
            setIsMinimized(false);
            window.dispatchEvent(new CustomEvent('switch-tab', { detail: 'settings' }));
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
          <UpdateWizard version={currentVersion} onComplete={handleUpdateComplete} />
        )}
      </div>
    </AppContext.Provider>
  );
}
