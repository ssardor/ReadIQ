import React from 'react'
import { useSettings, useTranslation } from '@/components/SettingsProvider'

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, toggleTheme, isReady } = useSettings()
  const t = useTranslation()

  if (!isReady) {
    return null
  }

  const icon = theme === 'dark' ? '🌙' : '☀️'
  const label = theme === 'dark' ? t('Dark mode') : t('Light mode')
  const ariaLabel = t('Toggle color theme')

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`flex items-center gap-2 rounded-full border border-primary-200 bg-white px-3 py-1 text-sm font-medium text-primary-600 transition hover:bg-primary-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 ${className}`.trim()}
      aria-label={ariaLabel}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  )
}
