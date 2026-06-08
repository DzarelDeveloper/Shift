import { useState, useEffect } from 'react';
import type { ThemeConfig } from '../types';

const STORAGE_KEY = 'shift_theme_config';
const DEFAULT_THEME: ThemeConfig = {
  mode: 'dark',
  accentColor: '#6366f1',
};

export function useTheme() {
  const [theme, setTheme] = useState<ThemeConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load theme from localStorage:', e);
    }
    return DEFAULT_THEME;
  });

  const applyTheme = (themeConfig: ThemeConfig) => {
    const root = document.documentElement;
    const body = document.body;
    let isDark = themeConfig.mode === 'dark';
    if (themeConfig.mode === 'system') {
      isDark =
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    if (isDark) {
      root.classList.add('dark');
      body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      body.classList.remove('dark');
    }

    root.style.setProperty('--accent-color', themeConfig.accentColor);
  };

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleSystemThemeChange = () => {
      if (theme.mode === 'system') {
        applyTheme(theme);
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [theme]);

  return { theme, setTheme };
}
