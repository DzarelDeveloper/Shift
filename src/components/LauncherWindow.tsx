import React, { useState, useEffect, useCallback } from 'react';
import { Workspace, InstalledApp } from '../types';
import LauncherPanel from './LauncherPanel';

const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;

export const LauncherWindow: React.FC = () => {
  const [launcherWorkspaces, setLauncherWorkspaces] = useState<Workspace[]>([]);
  const [launcherApps, setLauncherApps] = useState<InstalledApp[]>([]);

  // Load initial workspaces from disk and listen for updates
  useEffect(() => {
    if (!isTauri) return;

    // Load initial workspaces from storage
    import('@tauri-apps/api/path').then(({ appDataDir }) => {
      import('@tauri-apps/plugin-fs').then(({ readTextFile, exists }) => {
        appDataDir().then(async (dirPath) => {
          const filePath = `${dirPath}/workspaces.json`;
          const fileExists = await exists(filePath);
          if (fileExists) {
            try {
              const content = await readTextFile(filePath);
              const parsed = JSON.parse(content);
              setLauncherWorkspaces(parsed);
            } catch (e) {
              console.error('[Launcher] Failed to parse workspaces.json:', e);
            }
          }
        });
      });
    });

    let unlistenApps: (() => void) | null = null;
    let unlistenWorkspaces: (() => void) | null = null;

    import('@tauri-apps/api/event').then(({ listen }) => {
      listen('shift://apps-updated', (event) => {
        console.log('[Launcher] Received apps update:', event.payload);
        setLauncherApps(event.payload as InstalledApp[]);
      }).then((fn) => {
        unlistenApps = fn;
      });

      listen('shift://workspaces-updated', (event) => {
        console.log('[Launcher] Received workspaces update:', event.payload);
        setLauncherWorkspaces(event.payload as Workspace[]);
      }).then((fn) => {
        unlistenWorkspaces = fn;
      });
    });

    return () => {
      if (unlistenApps) unlistenApps();
      if (unlistenWorkspaces) unlistenWorkspaces();
    };
  }, []);

  // handle launch item specifically for launcher window
  const handleLauncherLaunchItem = useCallback(
    async (item: {
      type: 'workspace' | 'app';
      data: Workspace | InstalledApp;
    }) => {
      if (isTauri) {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        await getCurrentWindow().hide();
      }

      if (item.type === 'app') {
        const app = item.data as InstalledApp;
        try {
          const { invoke } = await import('@tauri-apps/api/core');
          await invoke('launch_application', { path: app.path });
        } catch (e) {
          console.error('Failed to launch app:', e);
        }
      } else {
        // For workspace, send event to main window to launch
        if (isTauri) {
          const { emitTo } = await import('@tauri-apps/api/event');
          await emitTo('main', 'shift://launch-workspace', item.data);
        }
      }
    },
    []
  );

  return (
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
        workspaces={launcherWorkspaces}
        apps={launcherApps}
        onLaunch={handleLauncherLaunchItem}
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
  );
};
