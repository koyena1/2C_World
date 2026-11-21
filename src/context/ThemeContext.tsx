import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { DEFAULT_THEME, THEME_STORAGE_KEY, ThemeMode, isThemeMode } from '../styles/theme';
import { safeGetItem, safeSetItem } from '../utils/storage';

export type { ThemeMode };

export interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: DEFAULT_THEME,
  setTheme: () => {},
  toggleTheme: () => {},
  isDark: DEFAULT_THEME === 'dark',
});

/** Applies the theme to <html>; all colors are driven by CSS variables in styles/tokens.css. */
const applyThemeToDocument = (theme: ThemeMode) => {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.classList.toggle('light', theme === 'light');
  root.setAttribute('data-theme', theme);
  root.style.colorScheme = theme;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = safeGetItem(THEME_STORAGE_KEY);
    return isThemeMode(saved) ? saved : DEFAULT_THEME;
  });

  const setTheme = useCallback((next: ThemeMode) => {
    setThemeState(next);
    safeSetItem(THEME_STORAGE_KEY, next);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme, isDark: theme === 'dark' }),
    [theme, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
