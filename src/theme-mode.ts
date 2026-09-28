import { createContext, useContext } from 'react'
import type { ThemeMode } from './theme'

/**
 * The visitor's theme preference. 'system' isn't a palette — it defers to
 * the OS setting and keeps following it if that changes, which is why the
 * stored preference and the palette in use are two different values.
 *
 * Same shape of decision as the language default (see src/i18n/index.ts):
 * follow the browser unless the visitor says otherwise, then remember the
 * choice in localStorage and let it win from then on.
 */
export type ThemeSetting = ThemeMode | 'system'

export const THEME_SETTINGS: ThemeSetting[] = ['system', 'light', 'dark']

/** Matches the 'serudio_lang' convention used for the language choice. */
export const THEME_STORAGE_KEY = 'serudio_theme'

export interface ThemeModeContextValue {
  /** What the visitor picked, including 'system'. */
  setting: ThemeSetting
  /** The palette actually rendering, once 'system' is resolved. */
  mode: ThemeMode
  setSetting: (next: ThemeSetting) => void
}

export const ThemeModeContext = createContext<ThemeModeContextValue | null>(null)

export function useThemeMode(): ThemeModeContextValue {
  const value = useContext(ThemeModeContext)
  if (!value) {
    throw new Error('useThemeMode must be used inside <ThemeModeProvider>')
  }
  return value
}

export function readStoredSetting(): ThemeSetting {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored && (THEME_SETTINGS as string[]).includes(stored)) {
      return stored as ThemeSetting
    }
  } catch {
    // Private browsing or blocked site data — following the system is a
    // fine default, and the switcher still works for this visit.
  }
  return 'system'
}

export function storeSetting(setting: ThemeSetting): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, setting)
  } catch {
    // Storage unavailable; the choice just won't survive a reload.
  }
}
