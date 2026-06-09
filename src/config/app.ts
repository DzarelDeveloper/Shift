/**
 * src/config/app.ts
 *
 * SINGLE SOURCE OF TRUTH for all application metadata.
 *
 * ┌──────────────────────────────────────────────────────────────────┐
 * │  To update any of these values, edit THIS FILE ONLY.             │
 * │  Every component, wizard, and page inherits from here.           │
 * └──────────────────────────────────────────────────────────────────┘
 *
 * Runtime version is read from Tauri (tauri.conf.json / package.json)
 * via the `useAppInfo` hook, so bumping the version in one place
 * propagates to the entire UI automatically.
 */

export const APP_CONFIG = {
  /** Human-readable application name displayed across the UI */
  name: 'Shift',

  /** One-liner description used in footers, about pages and meta tags */
  description: 'Restore your workflow in seconds.',

  /** Public website / repository URL */
  website: 'https://github.com/DzarelDeveloper/Shift',

  /**
   * Fallback version used only in browser dev-mode (no Tauri runtime).
   * The live app always reads the real version from Tauri via `useAppInfo`.
   */
  fallbackVersion: '0.5.7',

  /** Author / company information */
  author: 'Muhamad Dzarel Alghifari',

  /** Short identifier used in window titles, exports, and log prefixes */
  identifier: 'com.dzarel.shift',
} as const;

export type AppConfig = typeof APP_CONFIG;
