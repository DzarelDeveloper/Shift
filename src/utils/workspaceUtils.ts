import { Workspace, ShiftExportData } from '../types';

export function createExportData(
  workspaces: Workspace[],
  preferences: {
    launchAtStartup: boolean;
    minimizeToTray: boolean;
    shortcutKey: string;
    autoBypassPreview: boolean;
  }
): string {
  const exportData: ShiftExportData = {
    version: '0.4.0',
    exportedAt: new Date().toISOString(),
    workspaces,
    preferences,
  };
  return JSON.stringify(exportData, null, 2);
}

export function parseImportData(jsonString: string): ShiftExportData {
  const data = JSON.parse(jsonString) as ShiftExportData;
  if (
    !data ||
    !data.version ||
    !data.workspaces ||
    !Array.isArray(data.workspaces)
  ) {
    throw new Error('Invalid .shift file format');
  }
  return data;
}

export async function checkWorkspaceHealth(
  workspace: Workspace
): Promise<{ healthy: boolean; brokenPaths: string[] }> {
  const brokenPaths: string[] = [];
  const isTauriEnv = typeof window !== 'undefined' && '__TAURI__' in window;

  if (!isTauriEnv) {
    // In browser environment, we can't reliably check paths, so assume healthy
    return { healthy: true, brokenPaths };
  }

  try {
    const { exists } = await import('@tauri-apps/plugin-fs');

    for (const app of workspace.applications) {
      if (app.path) {
        const pathExists = await exists(app.path);
        if (!pathExists) {
          brokenPaths.push(app.path);
        }
      }
    }

    for (const folder of workspace.folders) {
      if (folder.path) {
        const pathExists = await exists(folder.path);
        if (!pathExists) {
          brokenPaths.push(folder.path);
        }
      }
    }
  } catch (error) {
    console.error('Failed to check workspace health:', error);
  }

  return { healthy: brokenPaths.length === 0, brokenPaths };
}
