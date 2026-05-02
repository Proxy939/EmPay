import { createContext, useContext, useState, useEffect } from 'react'

// ── Theme colour palettes ─────────────────────────────────────────────────────
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
  dark: {
    bg:      '#0d0d14',
    card:    '#13131f',
    text:    '#e2e2f0',
    muted:   '#7a7a9a',
    border:  '#222238',
    accent:  '#8075f5',
    accentL: '#1c1a30',
    accentD: '#a09af8',
    hover:   '#1a1a2c',
    red:     '#ff6b6b',
    redBg:   '#1a0d0d',
    green:   '#00d9a3',
    amber:   '#f9ca74',
    shadow:  '0 1px 8px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.4)',
    inputBg: '#0f0f1a',
    tableBg: '#0f0f1a',
  },
}

const ThemeCtx = createContext({
  theme:  'light',
  colors: THEMES.light,
  toggle: () => {},
})

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(
    () => localStorage.getItem('empay-theme') || 'light'
  )

  useEffect(() => {
    localStorage.setItem('empay-theme', theme)
    // Keep html data-theme in sync (useful for any global CSS selectors)
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const toggle = () => setTheme(t => (t === 'light' ? 'dark' : 'light'))

  return (
    <ThemeCtx.Provider value={{ theme, colors: THEMES[theme], toggle }}>
      {children}
    </ThemeCtx.Provider>
  )
}

export const useTheme = () => useContext(ThemeCtx)
