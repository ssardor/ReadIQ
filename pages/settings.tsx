import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { BackButton } from '@/components/BackButton'
import { useSettings, useTranslation } from '@/components/SettingsProvider'

export default function SettingsPage() {
  const { theme, setTheme, language, setLanguage, isReady } = useSettings()
  const t = useTranslation()

  const themeOptions: Array<{ value: typeof theme; label: string; description: string }> = [
    {
      value: 'light',
      label: t('Light mode'),
      description: t('Bright interface ideal for daytime use.'),
    },
    {
      value: 'dark',
      label: t('Dark mode'),
      description: t('Dimmed interface to reduce eye strain in low light.'),
    },
  ]

  const languageOptions: Array<{ value: typeof language; label: string; description: string }> = [
    {
      value: 'en',
      label: t('English'),
      description: t('Use English for all interface elements.'),
    },
    {
      value: 'ru',
      label: t('Russian'),
      description: t('Use Russian for all interface elements.'),
    },
  ]

  return (
    <>
      <Head>
        <title>{t('Settings')} - ReadIQ</title>
        <meta name="description" content={t('Adjust appearance and language preferences for ReadIQ.')} />
      </Head>

      <main className="min-h-screen bg-gray-50 py-10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between">
            <BackButton label={t('← Back')} />
            <Link href="/" className="text-sm font-semibold text-primary-600 hover:text-primary-700">
              {t('Go to home')}
            </Link>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h1 className="text-3xl font-bold text-gray-900">{t('Settings')}</h1>
            <p className="mt-1 text-sm text-gray-500">{t('Control theme, language, and accessibility preferences for your account.')}</p>

            <section className="mt-8 border-t border-gray-100 pt-6">
              <h2 className="text-xl font-semibold text-gray-900">{t('Appearance')}</h2>
              <p className="mt-1 text-sm text-gray-500">{t('Select how ReadIQ looks on this device.')}</p>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {themeOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer flex-col gap-2 rounded-lg border p-4 transition ${
                      theme === option.value
                        ? 'border-primary-400 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-primary-200'
                    }`}
                  >
                    <span className="text-sm font-semibold">{option.label}</span>
                    <span className="text-xs text-gray-500">{option.description}</span>
                    <div className="mt-2">
                      <input
                        type="radio"
                        name="theme"
                        value={option.value}
                        checked={theme === option.value}
                        onChange={() => setTheme(option.value)}
                        disabled={!isReady}
                      />
                    </div>
                  </label>
                ))}
              </div>
            </section>

            <section className="mt-10 border-t border-gray-100 pt-6">
              <h2 className="text-xl font-semibold text-gray-900">{t('Language')}</h2>
              <p className="mt-1 text-sm text-gray-500">{t('Choose the language used across the entire interface.')}</p>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {languageOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer flex-col gap-2 rounded-lg border p-4 transition ${
                      language === option.value
                        ? 'border-primary-400 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-primary-200'
                    }`}
                  >
                    <span className="text-sm font-semibold">{option.label}</span>
                    <span className="text-xs text-gray-500">{option.description}</span>
                    <div className="mt-2">
                      <input
                        type="radio"
                        name="language"
                        value={option.value}
                        checked={language === option.value}
                        onChange={() => setLanguage(option.value)}
                        disabled={!isReady}
                      />
                    </div>
                  </label>
                ))}
              </div>
            </section>

            <section className="mt-10 border-t border-gray-100 pt-6">
              <h2 className="text-xl font-semibold text-gray-900">{t('Need more settings?')}</h2>
              <p className="mt-1 text-sm text-gray-500">
                {t('We are expanding customization options. Let us know what you need via support@readiq.app.')}
              </p>
            </section>
          </div>
        </div>
      </main>
    </>
  )
}
