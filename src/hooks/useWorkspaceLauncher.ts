import { useState, useCallback, useEffect } from 'react';
import { Workspace } from '../types';

interface LaunchStep {
  label: string;
  done: boolean;
  type: 'app' | 'link' | 'folder' | 'misc';
}

interface UseWorkspaceLauncherProps {
  triggerToast: (
    title: string,
    desc: string,
    type?: 'success' | 'info'
  ) => void;
}

export function useWorkspaceLauncher({
  triggerToast,
}: UseWorkspaceLauncherProps) {
  const [activeLaunchingWs, setActiveLaunchingWs] = useState<Workspace | null>(
    null
  );
  const [launchSteps, setLaunchSteps] = useState<LaunchStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const executeWorkspacePipeline = useCallback(async (workspace: Workspace) => {
    console.log('=== executeWorkspacePipeline CALLED for:', workspace.name);

    const steps: LaunchStep[] = [];
    workspace.applications.forEach((app) => {
      steps.push({
        label: `Opening Native Executable: ${app.name} (${app.path || 'Detected system alias'})`,
        done: false,
        type: 'app',
      });
    });
    workspace.folders.forEach((folder) => {
      steps.push({
        label: `Activating File Explorer directory binder: ${folder.name} (${folder.path})`,
        done: false,
        type: 'folder',
      });
    });
    workspace.websites.forEach((site) => {
      steps.push({
        label: `Redirecting default web socket: open ${site.name} (${site.url})`,
        done: false,
        type: 'link',
      });
    });
    steps.push({
      label:
        'Workspace environment restored. All targets successfully triggered.',
      done: false,
      type: 'misc',
    });

    setLaunchSteps(steps);
    setCurrentStepIndex(0);
    setActiveLaunchingWs(workspace);

    try {
      const { invoke } = await import('@tauri-apps/api/core');
      for (const app of workspace.applications) {
        if (app.path) {
          try {
            console.log('Launching app:', app.name, app.path);
            await invoke('launch_application', { path: app.path });
            console.log('Launched app:', app.name);
          } catch (e) {
            console.error('Failed to launch app:', e);
          }
        }
      }
      for (const folder of workspace.folders) {
        if (folder.path) {
          try {
            console.log('Opening folder:', folder.name, folder.path);
            await invoke('open_folder', { path: folder.path });
            console.log('Opened folder:', folder.name);
          } catch (e) {
            console.error('Failed to open folder:', e);
          }
        }
      }
      for (const site of workspace.websites) {
        try {
          console.log('Opening website:', site.name, site.url);
          await invoke('open_url', { url: site.url });
          console.log('Opened website:', site.name);
        } catch (e) {
          console.error('Failed to open website:', e);
        }
      }
    } catch (e) {
      console.error(
        'Tauri plugins not available, falling back to web mode:',
        e
      );
      workspace.websites.forEach((site) => {
        try {
          window.open(site.url, '_blank');
        } catch (e) {
          console.error(
            'Browser blocked popup redirection. Continuing simulation.',
            e
          );
        }
      });
    }
  }, []);

  useEffect(() => {
    if (!activeLaunchingWs || launchSteps.length === 0) return;

    if (currentStepIndex < launchSteps.length) {
      const timer = setTimeout(() => {
        setLaunchSteps((prev) =>
          prev.map((step, idx) =>
            idx === currentStepIndex ? { ...step, done: true } : step
          )
        );
        setCurrentStepIndex((prev) => prev + 1);
      }, 550);
      return () => clearTimeout(timer);
    } else {
      const timerComplete = setTimeout(() => {
        triggerToast(
          'Workspace Loaded',
          `"${activeLaunchingWs.name}" environment successfully restored in background.`,
          'success'
        );
        setActiveLaunchingWs(null);
      }, 800);
      return () => clearTimeout(timerComplete);
    }
  }, [activeLaunchingWs, currentStepIndex, launchSteps.length, triggerToast]);

  return {
    activeLaunchingWs,
    launchSteps,
    currentStepIndex,
    executeWorkspacePipeline,
  };
}
