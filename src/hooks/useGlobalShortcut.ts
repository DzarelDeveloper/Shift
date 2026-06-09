import { useEffect, Dispatch, SetStateAction } from 'react';
import { Workspace } from '../types';

interface UseGlobalShortcutProps {
  shortcutKey: string;
  minimizeToTray: boolean;
  isMinimized: boolean;
  setIsMinimized: (_val: boolean) => void;
  setIsLauncherOpen: Dispatch<SetStateAction<boolean>>;
  previewingWorkspace: Workspace | null;
  triggerToast: (
    title: string,
    desc: string,
    type?: 'success' | 'info'
  ) => void;
}

export function useGlobalShortcut({
  shortcutKey,
  minimizeToTray,
  isMinimized,
  setIsMinimized,
  setIsLauncherOpen,
  previewingWorkspace,
  triggerToast,
}: UseGlobalShortcutProps) {
  // Register global shortcut and minimize-to-tray in Tauri backend
  // The Rust handler directly shows/hides the launcher window — no frontend event needed
  useEffect(() => {
    const isTauriEnv = typeof window !== 'undefined' && '__TAURI__' in window;
    if (isTauriEnv) {
      import('@tauri-apps/api/core')
        .then((core) => {
          const { invoke } = core;
          invoke('set_global_shortcut', { newShortcut: shortcutKey });
          invoke('set_minimize_to_tray', { value: minimizeToTray });
        })
        .catch((e) =>
          console.error('Failed to initialize global shortcut in Tauri:', e)
        );
    }
  }, [shortcutKey, minimizeToTray]);

  useEffect(() => {
    const handleGlobalShortcut = (e: KeyboardEvent) => {
      const keyUpper = e.key.toUpperCase();
      let isTriggered = false;

      if (shortcutKey === '') {
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        if (isMac) {
          isTriggered = e.metaKey && e.altKey && e.key === ' ';
        } else {
          isTriggered = e.ctrlKey && e.altKey && e.key === ' ';
        }
      } else if (shortcutKey === 'Ctrl+K') {
        isTriggered = (e.ctrlKey || e.metaKey) && keyUpper === 'K';
      } else if (shortcutKey === 'Alt+P') {
        isTriggered = e.altKey && keyUpper === 'P';
      } else if (shortcutKey === 'Alt+Z') {
        isTriggered = e.altKey && keyUpper === 'Z';
      } else {
        isTriggered = (e.metaKey || e.ctrlKey) && keyUpper === 'K';
      }

      if (e.key === 'Enter' && previewingWorkspace) {
        return;
      }

      if (isTriggered) {
        e.preventDefault();
        if (isMinimized) {
          setIsMinimized(false);
          triggerToast(
            'App Restored',
            'Main window maximized from system tray.',
            'info'
          );
          setIsLauncherOpen(true);
        } else {
          setIsLauncherOpen((prev) => !prev);
        }
      }
    };

    const isTauriEnv = typeof window !== 'undefined' && '__TAURI__' in window;
    if (!isTauriEnv) {
      window.addEventListener('keydown', handleGlobalShortcut);
      return () => window.removeEventListener('keydown', handleGlobalShortcut);
    }
  }, [
    shortcutKey,
    isMinimized,
    previewingWorkspace,
    triggerToast,
    setIsMinimized,
    setIsLauncherOpen,
  ]);
}
