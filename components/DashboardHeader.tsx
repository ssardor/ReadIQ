import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'
import { useTranslation } from '@/components/SettingsProvider'

interface DashboardHeaderProps {
  fullName: string
  role: 'student' | 'mentor'
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ fullName, role }) => {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const t = useTranslation()

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      await supabase.auth.signOut()
      // clear server cookies so SSR no longer sees the session
      try {
        await fetch('/api/auth/clear-session', { method: 'POST', credentials: 'include' })
      } catch (e) {
        console.error('Failed to clear server cookies', e)
      }
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
      setIsLoading(false)
    }
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center gap-6">
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="text-2xl font-bold text-primary-600">
                ReadIQ
              </Link>
              {role === 'mentor' && (
                <nav className="hidden md:flex items-center gap-4 text-sm font-medium text-gray-600">
                  <Link href="/mentor/groups" className="hover:text-primary-600 transition-colors">
                    {t('Groups')}
                  </Link>
                  <Link href="/mentor/quizzes" className="hover:text-primary-600 transition-colors">
                    {t('Quizzes')}
                  </Link>
                  <Link href="/mentor/analytics" className="hover:text-primary-600 transition-colors">
                    {t('Analytics')}
                  </Link>
                </nav>
              )}
            </div>

            <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{fullName}</p>
              <p className="text-xs text-gray-500 capitalize">
                {role === 'mentor' ? t('Mentor') : t('Student')}
              </p>
            </div>
            
            <Link
              href="/profile"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
            >
              {t('Profile')}
            </Link>
            <Link
              href="/settings"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
            >
              {t('Settings')}
            </Link>
            
            <button
              onClick={handleLogout}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? t('Logging out...') : t('Log out')}
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
