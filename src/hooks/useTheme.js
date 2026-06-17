import { useEffect, useState, useCallback } from 'react';

const STORAGE_KEY = 'r2up_v1::theme';
const DEFAULT_THEME = 'blossom';
const VALID_THEMES = ['midnight', 'blossom'];

function applyTheme(theme) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
  // Update theme-color meta on the fly so the OS chrome matches
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', theme === 'blossom' ? '#fef6f4' : '#06060b');
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_THEME;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && VALID_THEMES.includes(stored)) return stored;
    } catch {}
    return DEFAULT_THEME;
  });

  // Apply theme on mount + whenever it changes
  useEffect(() => {
    applyTheme(theme);
    try { localStorage.setItem(STORAGE_KEY, theme); } catch {}
  }, [theme]);

  const setTheme = useCallback((next) => {
    if (VALID_THEMES.includes(next)) setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((t) => (t === 'midnight' ? 'blossom' : 'midnight'));
  }, []);

  return { theme, setTheme, toggleTheme };
}
