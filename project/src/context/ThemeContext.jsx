import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const ThemeContext = createContext()

export function useTheme() {
  return useContext(ThemeContext)
}

/**
 * Color palette presets — full shade ramps for each base color.
 * These match common Tailwind palettes so the UI looks consistent.
 * The API only sends three base hex values (primary, secondary, accent)
 * and we map them to a known ramp.
 */
const COLOR_RAMPS = {
  // Teal
  '#0d9488': { 50:'#f0fdfa',100:'#ccfbf1',200:'#99f6e4',300:'#5eead4',400:'#2dd4bf',500:'#14b8a6',600:'#0d9488',700:'#0f766e',800:'#115e59',900:'#134e4a',950:'#042f2e' },
  '#14b8a6': { 50:'#f0fdfa',100:'#ccfbf1',200:'#99f6e4',300:'#5eead4',400:'#2dd4bf',500:'#14b8a6',600:'#0d9488',700:'#0f766e',800:'#115e59',900:'#134e4a',950:'#042f2e' },
  // Slate
  '#475569': { 50:'#f8fafc',100:'#f1f5f9',200:'#e2e8f0',300:'#cbd5e1',400:'#94a3b8',500:'#64748b',600:'#475569',700:'#334155',800:'#1e293b',900:'#0f172a',950:'#020617' },
  '#64748b': { 50:'#f8fafc',100:'#f1f5f9',200:'#e2e8f0',300:'#cbd5e1',400:'#94a3b8',500:'#64748b',600:'#475569',700:'#334155',800:'#1e293b',900:'#0f172a',950:'#020617' },
  // Amber
  '#d97706': { 50:'#fffbeb',100:'#fef3c7',200:'#fde68a',300:'#fcd34d',400:'#fbbf24',500:'#f59e0b',600:'#d97706',700:'#b45309',800:'#92400e',900:'#78350f',950:'#451a03' },
  '#f59e0b': { 50:'#fffbeb',100:'#fef3c7',200:'#fde68a',300:'#fcd34d',400:'#fbbf24',500:'#f59e0b',600:'#d97706',700:'#b45309',800:'#92400e',900:'#78350f',950:'#451a03' },
  // Coral / Red
  '#e74c3c': { 50:'#fef2f2',100:'#fee2e2',200:'#fecaca',300:'#fca5a5',400:'#f87171',500:'#ef4444',600:'#e74c3c',700:'#b91c1c',800:'#991b1b',900:'#7f1d1d',950:'#450a0a' },
  // Burnt orange
  '#d35400': { 50:'#fff7ed',100:'#ffedd5',200:'#fed7aa',300:'#fdba74',400:'#fb923c',500:'#f97316',600:'#d35400',700:'#c2410c',800:'#9a3412',900:'#7c2d12',950:'#431407' },
  // Gold
  '#f39c12': { 50:'#fffbeb',100:'#fef3c7',200:'#fde68a',300:'#fcd34d',400:'#fbbf24',500:'#f39c12',600:'#d97706',700:'#b45309',800:'#92400e',900:'#78350f',950:'#451a03' },
  // Emerald
  '#059669': { 50:'#ecfdf5',100:'#d1fae5',200:'#a7f3d0',300:'#6ee7b7',400:'#34d399',500:'#10b981',600:'#059669',700:'#047857',800:'#065f46',900:'#064e3b',950:'#022c22' },
  '#065f46': { 50:'#ecfdf5',100:'#d1fae5',200:'#a7f3d0',300:'#6ee7b7',400:'#34d399',500:'#10b981',600:'#059669',700:'#047857',800:'#065f46',900:'#064e3b',950:'#022c22' },
  // Ocean blue
  '#0284c7': { 50:'#f0f9ff',100:'#e0f2fe',200:'#bae6fd',300:'#7dd3fc',400:'#38bdf8',500:'#0ea5e9',600:'#0284c7',700:'#0369a1',800:'#075985',900:'#0c4a6e',950:'#082f49' },
  '#0c4a6e': { 50:'#f0f9ff',100:'#e0f2fe',200:'#bae6fd',300:'#7dd3fc',400:'#38bdf8',500:'#0ea5e9',600:'#0284c7',700:'#0369a1',800:'#075985',900:'#0c4a6e',950:'#082f49' },
  // Orange accent
  '#ea580c': { 50:'#fff7ed',100:'#ffedd5',200:'#fed7aa',300:'#fdba74',400:'#fb923c',500:'#f97316',600:'#ea580c',700:'#c2410c',800:'#9a3412',900:'#7c2d12',950:'#431407' },
  // Rose
  '#e11d48': { 50:'#fff1f2',100:'#ffe4e6',200:'#fecdd3',300:'#fda4af',400:'#fb7185',500:'#f43f5e',600:'#e11d48',700:'#be123c',800:'#9f1239',900:'#881337',950:'#4c0519' },
  // Gray
  '#374151': { 50:'#f9fafb',100:'#f3f4f6',200:'#e5e7eb',300:'#d1d5db',400:'#9ca3af',500:'#6b7280',600:'#4b5563',700:'#374151',800:'#1f2937',900:'#111827',950:'#030712' },
  // Violet
  '#7c3aed': { 50:'#f5f3ff',100:'#ede9fe',200:'#ddd6fe',300:'#c4b5fd',400:'#a78bfa',500:'#8b5cf6',600:'#7c3aed',700:'#6d28d9',800:'#5b21b6',900:'#4c1d95',950:'#2e1065' },
  // Indigo
  '#4f46e5': { 50:'#eef2ff',100:'#e0e7ff',200:'#c7d2fe',300:'#a5b4fc',400:'#818cf8',500:'#6366f1',600:'#4f46e5',700:'#4338ca',800:'#3730a3',900:'#312e81',950:'#1e1b4b' },
  '#1e1b4b': { 50:'#eef2ff',100:'#e0e7ff',200:'#c7d2fe',300:'#a5b4fc',400:'#818cf8',500:'#6366f1',600:'#4f46e5',700:'#4338ca',800:'#3730a3',900:'#312e81',950:'#1e1b4b' },
}

/**
 * Generate shade ramp from a base hex color.
 * First checks our preset map. If not found, generates an approximate ramp
 * by lightening/darkening the base color.
 */
function generateShades(baseHex) {
  const normalized = baseHex?.toLowerCase()
  if (COLOR_RAMPS[normalized]) return COLOR_RAMPS[normalized]

  // Fallback: simple programmatic lightening/darkening
  const hex = normalized?.replace('#', '') || '0d9488'
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)

  const lighten = (r, g, b, factor) => {
    const lr = Math.round(r + (255 - r) * factor)
    const lg = Math.round(g + (255 - g) * factor)
    const lb = Math.round(b + (255 - b) * factor)
    return `#${lr.toString(16).padStart(2,'0')}${lg.toString(16).padStart(2,'0')}${lb.toString(16).padStart(2,'0')}`
  }

  const darken = (r, g, b, factor) => {
    const dr = Math.round(r * (1 - factor))
    const dg = Math.round(g * (1 - factor))
    const db = Math.round(b * (1 - factor))
    return `#${dr.toString(16).padStart(2,'0')}${dg.toString(16).padStart(2,'0')}${db.toString(16).padStart(2,'0')}`
  }

  return {
    50: lighten(r, g, b, 0.95),
    100: lighten(r, g, b, 0.88),
    200: lighten(r, g, b, 0.75),
    300: lighten(r, g, b, 0.55),
    400: lighten(r, g, b, 0.3),
    500: lighten(r, g, b, 0.1),
    600: baseHex,
    700: darken(r, g, b, 0.15),
    800: darken(r, g, b, 0.35),
    900: darken(r, g, b, 0.5),
    950: darken(r, g, b, 0.7),
  }
}

function applyThemeToDOM(colors) {
  const root = document.documentElement

  const groups = [
    { prefix: 'primary', hex: colors.primary },
    { prefix: 'secondary', hex: colors.secondary },
    { prefix: 'accent', hex: colors.accent },
  ]

  for (const { prefix, hex } of groups) {
    const shades = generateShades(hex)
    for (const [shade, value] of Object.entries(shades)) {
      root.style.setProperty(`--color-${prefix}-${shade}`, value)
    }
  }
}

// Default colors in case API hasn't responded yet
const DEFAULT_COLORS = {
  primary: '#0d9488',
  secondary: '#475569',
  accent: '#d97706',
}

export function ThemeProvider({ children }) {
  const [colors, setColors] = useState(DEFAULT_COLORS)
  const [preset, setPreset] = useState('teal_slate')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Apply defaults immediately so there's no flash
    applyThemeToDOM(DEFAULT_COLORS)

    api.get('/theme/')
      .then(res => {
        const data = res.data
        setColors(data.colors)
        setPreset(data.preset)
        applyThemeToDOM(data.colors)
      })
      .catch(() => {
        // API unavailable — keep defaults
      })
      .finally(() => setLoading(false))
  }, [])

  const value = { colors, preset, loading }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}
