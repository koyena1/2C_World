/** Theme configuration shared by the provider, hooks and components. */

export type ThemeMode = 'light' | 'dark';

export const THEME_STORAGE_KEY = '2coms_theme';
export const DEFAULT_THEME: ThemeMode = 'dark';

export const isThemeMode = (value: unknown): value is ThemeMode =>
  value === 'light' || value === 'dark';
