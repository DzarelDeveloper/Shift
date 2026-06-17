import { useEffect } from 'react';

interface UseGlobalShortcutProps {
  shortcutKey: string;
  dashboardShortcutKey: string;
  minimizeToTray: boolean;
  enabled?: boolean;
}

export function useGlobalShortcut({
  shortcutKey,
  dashboardShortcutKey,
  minimizeToTray,
  enabled = true,
}: UseGlobalShortcutProps) {
  useEffect(() => {
    console.log('[Shortcut] useGlobalShortcut useEffect called');
    console.log('[Shortcut] enabled:', enabled);
    console.log('[Shortcut] shortcutKey:', shortcutKey);
    console.log('[Shortcut] dashboardShortcutKey:', dashboardShortcutKey);
    console.log('[Shortcut] minimizeToTray:', minimizeToTray);

    if (!enabled) {
      console.log('[Shortcut] Not enabled, returning');
      return;
    }

    const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;
    console.log('[Shortcut] isTauri:', isTauri);

    if (isTauri) {
      console.log('[Shortcut] Importing Tauri core...');
      import('@tauri-apps/api/core')
        .then(async ({ invoke }) => {
          console.log('[Shortcut] Calling set_global_shortcut with:', shortcutKey, dashboardShortcutKey);
          await invoke('set_global_shortcut', { 
            newLauncherShortcut: shortcutKey,
            newDashboardShortcut: dashboardShortcutKey
          }).catch(
            (e: unknown) =>
              console.error('[Shortcut] ❌ set_global_shortcut failed:', e)
          );
          console.log('[Shortcut] Calling set_minimize_to_tray with:', minimizeToTray);
          await invoke('set_minimize_to_tray', { value: minimizeToTray }).catch(
            (e: unknown) =>
              console.error('[Shortcut] ❌ set_minimize_to_tray failed:', e)
          );
          console.log('[Shortcut] ✅ All shortcut commands sent!');
        })
        .catch((e) =>
          console.error('[Shortcut] ❌ Failed to import Tauri core:', e)
        );
    } else {
      console.log('[Shortcut] Not in Tauri environment, skipping');
    }
  }, [enabled, shortcutKey, dashboardShortcutKey, minimizeToTray]);
}
