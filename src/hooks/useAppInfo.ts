/**
 * src/hooks/useAppInfo.ts
 *
 * Reads the live application version from the Tauri runtime.
 * Falls back to APP_CONFIG.fallbackVersion in browser dev-mode.
 *
 * Usage:
 *   const { name, version, fullTitle } = useAppInfo();
 */

import { useState, useEffect } from 'react';
import { APP_CONFIG } from '../config/app';

export interface AppInfo {
  /** e.g. "Shift" */
  name: string;
  /** e.g. "0.5.6"  (live from Tauri, fallback in browser) */
  version: string;
  /** e.g. "Shift v0.5.6" */
  fullTitle: string;
  /** e.g. "Restore your workflow in seconds." */
  description: string;
  /** e.g. "https://github.com/DzarelDeveloper/Shift" */
  website: string;
  /** e.g. "Muhamad Dzarel Alghifari" */
  author: string;
  /** true while the async Tauri call is in-flight */
  isLoading: boolean;
}

const isTauri =
  typeof window !== 'undefined' && '__TAURI__' in window;

export function useAppInfo(): AppInfo {
  const [version, setVersion] = useState<string>(APP_CONFIG.fallbackVersion);
  const [isLoading, setIsLoading] = useState<boolean>(isTauri);

  useEffect(() => {
    if (!isTauri) return;

    let cancelled = false;
    import('@tauri-apps/api/app')
      .then(({ getVersion }) => getVersion())
      .then((v) => {
        if (!cancelled) {
          setVersion(v);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('[useAppInfo] Failed to read Tauri version:', err);
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    name: APP_CONFIG.name,
    version,
    fullTitle: `${APP_CONFIG.name} v${version}`,
    description: APP_CONFIG.description,
    website: APP_CONFIG.website,
    author: APP_CONFIG.author,
    isLoading,
  };
}
