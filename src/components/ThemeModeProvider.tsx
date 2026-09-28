import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import useMediaQuery from '@mui/material/useMediaQuery'
import { createAppTheme, THEME_COLORS, type ThemeMode } from '../theme'
import {
  ThemeModeContext,
  readStoredSetting,
  storeSetting,
  type ThemeSetting,
} from '../theme-mode'

/**
 * Owns the theme: resolves the visitor's preference against the OS
 * setting, builds the matching MUI theme, and provides both to the app.
 * Replaces the single hardcoded dark theme that used to be wired up
 * directly in main.tsx.
 */
export default function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [setting, setSettingState] = useState<ThemeSetting>(readStoredSetting)
  // Live query, so a visitor on 'system' follows the OS switching itself
  // (e.g. at sunset) without reloading the page.
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)')

  const mode: ThemeMode = setting === 'system' ? (prefersDark ? 'dark' : 'light') : setting

  const setSetting = useCallback((next: ThemeSetting) => {
    setSettingState(next)
    storeSetting(next)
  }, [])

  const theme = useMemo(() => createAppTheme(mode), [mode])

  // Keep the mobile browser's own chrome in step with the page;
  // index.html ships the dark value as the pre-JS default.
  useEffect(() => {
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', THEME_COLORS[mode])
  }, [mode])

  const value = useMemo(() => ({ setting, mode, setSetting }), [setting, mode, setSetting])

  return (
    <ThemeModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  )
}
