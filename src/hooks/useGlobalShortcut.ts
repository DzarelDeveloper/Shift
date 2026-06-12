import { useEffect } from 'react';

interface UseGlobalShortcutProps {
  shortcutKey: string;
  minimizeToTray: boolean;
  enabled?: boolean;
}

export function useGlobalShortcut({
  shortcutKey,
  minimizeToTray,
  enabled = true,
}: UseGlobalShortcutProps) {
  useEffect(() => {
    if (!enabled) return;
    const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;
    if (isTauri) {
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
}
