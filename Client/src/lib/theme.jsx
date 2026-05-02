import { createContext, useContext } from 'react'

// ── Always light — dark theme removed ────────────────────────────────────────
export const THEMES = {
  light: {
    bg:      '#f5f5f8',
    card:    '#ffffff',
    text:    '#2d3436',
    muted:   '#636e72',
    border:  '#e9ecef',
    accent:  '#6C5CE7',
    accentL: '#f0eeff',
    accentD: '#5a4bd1',
    hover:   '#f8f8ff',
    red:     '#d63031',
    redBg:   '#fff5f5',
    green:   '#00b894',
    amber:   '#f39c12',
    shadow:  '0 1px 4px rgba(108,92,231,0.08), 0 1px 2px rgba(0,0,0,0.04)',
    inputBg: '#fafafa',
    tableBg: '#fafafa',
  },
}

const ThemeCtx = createContext({
  theme:  'light',
  colors: THEMES.light,
  toggle: () => {},
})

export function ThemeProvider({ children }) {
  // Always force light — clear any saved dark preference
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', 'light')
    document.documentElement.classList.remove('dark')
    document.documentElement.style.colorScheme = 'light'
    localStorage.removeItem('empay-theme')
  }

  return (
    <ThemeCtx.Provider value={{ theme: 'light', colors: THEMES.light, toggle: () => {} }}>
      {children}
    </ThemeCtx.Provider>
  )
}

export const useTheme = () => useContext(ThemeCtx)
