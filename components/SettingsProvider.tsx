import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useTranslate } from '@/lib/i18n'
import { LANGUAGE_STORAGE_KEY, THEME_STORAGE_KEY, type Language, type ThemePreference } from '@/lib/settings'

interface SettingsContextValue {
  theme: ThemePreference
  language: Language
  setTheme: (theme: ThemePreference) => void
  setLanguage: (language: Language) => void
  toggleTheme: () => void
  isReady: boolean
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

const detectInitialTheme = (): ThemePreference => {
  if (typeof window === 'undefined') return 'light'
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
  return prefersDark ? 'dark' : 'light'
}

const detectInitialLanguage = (): Language => {
  if (typeof window === 'undefined') return 'en'
  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
  if (stored === 'ru' || stored === 'en') return stored
  const browser = window.navigator?.language || window.navigator?.languages?.[0]
  if (browser && browser.toLowerCase().startsWith('ru')) return 'ru'
  return 'en'
}

const applyThemeToDocument = (theme: ThemePreference) => {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

const applyLanguageToDocument = (language: Language) => {
  if (typeof document === 'undefined') return
  document.documentElement.lang = language
}

export const SettingsProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemePreference>(detectInitialTheme)
  const [language, setLanguageState] = useState<Language>('en')
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    applyThemeToDocument(theme)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme)
    }
  }, [theme])

  useEffect(() => {
    const initialLanguage = detectInitialLanguage()
    setLanguageState(initialLanguage)
  }, [])

  useEffect(() => {
    applyLanguageToDocument(language)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
    }
  }, [language])

  useEffect(() => {
    setIsReady(true)
  }, [])

  const setTheme = useCallback((next: ThemePreference) => {
    setThemeState(next)
  }, [])

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }, [])

  const value = useMemo<SettingsContextValue>(
    () => ({ theme, language, setTheme, setLanguage, toggleTheme, isReady }),
    [theme, language, setTheme, setLanguage, toggleTheme, isReady],
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export const useSettings = () => {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider')
  }
  return context
}

export const useTranslation = () => {
  const { language } = useSettings()
  return useTranslate(language)
}
