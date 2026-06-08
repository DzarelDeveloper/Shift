/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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

  const [workspaces, setWorkspaces] = useState<Workspace[]>(() => {
    localStorage.removeItem('workspace_launcher_items');
    return DEFAULT_WORKSPACES;
  });

  useEffect(() => {
    localStorage.setItem(
      'workspace_launcher_items',
      JSON.stringify(workspaces)
    );
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
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(() => {
    return localStorage.getItem('shift_onboarding_completed') === 'true';
  });

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
    (_config: {
      minimizeToTray: boolean;
      launchAtStartup: boolean;
      firstWorkspace: string;
    }) => {
      localStorage.setItem('shift_onboarding_completed', 'true');
      setHasCompletedOnboarding(true);
      triggerToast(
        'Installation Complete',
        'Welcome to Shift! Create your first workspace.',
        'success'
      );
    },
    [triggerToast]
  );

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

        {!hasCompletedOnboarding && (
          <OnboardingWizard onComplete={handleOnboardingComplete} />
        )}
      </div>
    </AppContext.Provider>
  );
}
