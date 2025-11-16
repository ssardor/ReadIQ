import type { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import '@/styles/globals.css'
import { ToastProvider } from '@/components/ToastProvider'
import { ThemeToggle } from '@/components/ThemeToggle'
import { SettingsProvider } from '@/components/SettingsProvider'

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()
  const showThemeToggle = router.pathname !== '/dashboard'

  return (
    <SettingsProvider>
      <ToastProvider>
        <Component {...pageProps} />
        {showThemeToggle && <ThemeToggle className="fixed top-4 right-4 z-50 shadow-md" />}
      </ToastProvider>
    </SettingsProvider>
  )
}
