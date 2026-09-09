import { createTheme } from '@mui/material/styles'

// Palette lifted straight from logo.svg's "obsidian + electric indigo"
// gradient so the UI and the mark feel like one brand.
declare module '@mui/material/styles' {
  interface Palette {
    accentGradient: string
  }
  interface PaletteOptions {
    accentGradient?: string
  }
}

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#6366f1' },
    secondary: { main: '#a855f7' },
    info: { main: '#38bdf8' },
    background: {
      default: '#05070b',
      paper: '#0d1119',
    },
    text: {
      primary: '#f8fafc',
      secondary: '#94a3b8',
    },
    divider: '#243247',
    accentGradient: 'linear-gradient(135deg, #38bdf8 0%, #6366f1 45%, #a855f7 100%)',
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
        root: {
          backgroundImage: 'none',
          border: '1px solid #243247',
        },
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
        root: {
          backgroundColor: '#0d1119',
        },
      },
    },
  },
})

export default theme
