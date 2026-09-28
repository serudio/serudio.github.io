import { createTheme, type Theme } from '@mui/material/styles'

// Palette lifted straight from logo.svg's "obsidian + electric indigo"
// gradient so the UI and the mark feel like one brand. The light palette
// is the same brand hues re-weighted for a bright ground — indigo and
// purple darkened enough to keep text and buttons legible on white.
declare module '@mui/material/styles' {
  interface Palette {
    accentGradient: string
  }
  interface PaletteOptions {
    accentGradient?: string
  }
}

/** The two palettes a visitor can actually end up looking at. */
export type ThemeMode = 'light' | 'dark'

const BRAND_GRADIENT = 'linear-gradient(135deg, #38bdf8 0%, #6366f1 45%, #a855f7 100%)'

const PALETTES = {
  dark: {
    primary: { main: '#6366f1' },
    secondary: { main: '#a855f7' },
    info: { main: '#38bdf8' },
    background: { default: '#05070b', paper: '#0d1119' },
    text: { primary: '#f8fafc', secondary: '#94a3b8' },
    divider: '#243247',
  },
  light: {
    // Indigo/purple/sky one step darker than the dark-mode values, so
    // they clear contrast minimums against white rather than glowing.
    primary: { main: '#4f46e5' },
    secondary: { main: '#9333ea' },
    info: { main: '#0284c7' },
    background: { default: '#f5f7fa', paper: '#ffffff' },
    text: { primary: '#0f172a', secondary: '#475569' },
    divider: '#dde3ec',
  },
} as const

/**
 * The colour a mobile browser paints its own chrome with — kept next to
 * the palettes so the two can't drift apart. index.html ships the dark
 * value as its static default; ThemeModeProvider updates the live tag.
 */
export const THEME_COLORS: Record<ThemeMode, string> = {
  dark: PALETTES.dark.background.default,
  light: PALETTES.light.background.default,
}

/**
 * Builds the MUI theme for one mode. Component overrides read their
 * colours off the palette rather than hardcoding hexes, so both modes
 * stay consistent from this one definition.
 */
export function createAppTheme(mode: ThemeMode): Theme {
  return createTheme({
    palette: {
      mode,
      ...PALETTES[mode],
      accentGradient: BRAND_GRADIENT,
    },
    shape: {
      borderRadius: 14,
    },
    typography: {
      fontFamily: [
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        'Helvetica',
        'Arial',
        'sans-serif',
      ].join(','),
      h1: { fontWeight: 700 },
      h2: { fontWeight: 700 },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundImage: 'none',
            border: `1px solid ${theme.palette.divider}`,
          }),
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundColor: theme.palette.background.paper,
          }),
        },
      },
    },
  })
}
