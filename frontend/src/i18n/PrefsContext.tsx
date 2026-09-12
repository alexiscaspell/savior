import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { type PaletteMode } from '@mui/material'
import { createAppTheme } from '../theme'
import { translate, type Locale } from '../i18n/messages'

const THEME_KEY = 'savior.theme'
const LOCALE_KEY = 'savior.locale'

type PrefsContextValue = {
  mode: PaletteMode
  locale: Locale
  toggleMode: () => void
  toggleLocale: () => void
  t: (key: string, vars?: Record<string, string | number>) => string
}

const PrefsContext = createContext<PrefsContextValue | null>(null)

function readMode(): PaletteMode {
  const stored = localStorage.getItem(THEME_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function readLocale(): Locale {
  const stored = localStorage.getItem(LOCALE_KEY)
  if (stored === 'es' || stored === 'en') return stored
  return navigator.language.toLowerCase().startsWith('en') ? 'en' : 'es'
}

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<PaletteMode>(() => readMode())
  const [locale, setLocale] = useState<Locale>(() => readLocale())

  useEffect(() => {
    localStorage.setItem(THEME_KEY, mode)
    document.documentElement.setAttribute('data-color-scheme', mode)
  }, [mode])

  useEffect(() => {
    localStorage.setItem(LOCALE_KEY, locale)
    document.documentElement.lang = locale
  }, [locale])

  const toggleMode = useCallback(() => {
    setMode((m) => (m === 'light' ? 'dark' : 'light'))
  }, [])

  const toggleLocale = useCallback(() => {
    setLocale((l) => (l === 'es' ? 'en' : 'es'))
  }, [])

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars),
    [locale],
  )

  const value = useMemo(
    () => ({ mode, locale, toggleMode, toggleLocale, t }),
    [mode, locale, toggleMode, toggleLocale, t],
  )

  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>
}

export function usePrefs() {
  const ctx = useContext(PrefsContext)
  if (!ctx) throw new Error('usePrefs must be used within PrefsProvider')
  return ctx
}

export function useAppTheme() {
  const { mode } = usePrefs()
  return useMemo(() => createAppTheme(mode), [mode])
}
