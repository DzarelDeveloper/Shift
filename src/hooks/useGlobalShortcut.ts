import { useEffect } from 'react';
import { Workspace } from '../types';

interface UseGlobalShortcutProps {
  shortcutKey: string;
  minimizeToTray: boolean;
  isMinimized: boolean;
  setIsMinimized: (_val: boolean) => void;
  previewingWorkspace: Workspace | null;
  triggerToast: (
    title: string,
    desc: string,
    type?: 'success' | 'info'
  ) => void;
  /**
   * When false the hook is a no-op.
   * Set to true only in the MAIN window so the launcher window never
   * races to call set_global_shortcut and corrupt the shortcut state.
   */
  enabled?: boolean;
}

export function useGlobalShortcut({
  shortcutKey,
  minimizeToTray,
  isMinimized,
  setIsMinimized,
  previewingWorkspace,
  triggerToast,
  enabled = true,
}: UseGlobalShortcutProps) {
  // Register global shortcut and minimize-to-tray in Tauri backend.
  // ONLY runs when enabled=true (i.e. the main window).
  // The Rust handler directly shows/hides the launcher window — no frontend
  // event is emitted; this hook only keeps the stored shortcut key in sync.
  useEffect(() => {
    if (!enabled) return;
    const isTauriEnv = typeof window !== 'undefined' && '__TAURI__' in window;
    if (isTauriEnv) {
      import('@tauri-apps/api/core')
        .then(({ invoke }) => {
          invoke('set_global_shortcut', { newShortcut: shortcutKey }).catch(
            (e: unknown) =>
              console.error('[Shortcut] set_global_shortcut failed:', e)
          );
          invoke('set_minimize_to_tray', { value: minimizeToTray }).catch(
            (e: unknown) =>
              console.error('[Shortcut] set_minimize_to_tray failed:', e)
          );
        })
        .catch((e) =>
          console.error('[Shortcut] Failed to import Tauri core:', e)
        );
    }
  }, [enabled, shortcutKey, minimizeToTray]);

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
  ]);
}
