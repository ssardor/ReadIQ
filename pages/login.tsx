import React, { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'
import { Toast } from '@/components/Toast'
import { useTranslation } from '@/components/SettingsProvider'
import { validateEmail, validatePassword, mapSupabaseError } from '@/utils/validation'

export default function Login() {
  const router = useRouter()
  const t = useTranslation()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

  const emailValidation = validateEmail(formData.email, t)
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.error!
    }

  const passwordValidation = validatePassword(formData.password, t)
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.error!
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      })

      if (error) throw error

      if (!data.user) {
        throw new Error(t('Login failed'))
      }

      // Check if email is verified
      if (!data.user.email_confirmed_at) {
        setToast({
          message: t('Please verify your email before logging in. Check your inbox.'),
          type: 'error'
        })
        await supabase.auth.signOut()
        setIsLoading(false)
        return
      }

      // Устанавливаем серверные куки через API, чтобы SSR видел сессию
      const session = data.session
      if (!session) {
        throw new Error(t('No session returned'))
      }

      const cookieResp = await fetch('/api/auth/set-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_in: session.expires_in
        })
      })

      if (!cookieResp.ok) {
        console.error('Failed to set session cookies')
        throw new Error(t('Failed to persist session'))
      }

      setToast({
        message: t('Signed in successfully! Redirecting to your dashboard...'),
        type: 'success'
      })

      router.push('/dashboard')

    } catch (error: any) {
      console.error('Login error:', error)
      setToast({
        message: mapSupabaseError(error, t),
        type: 'error'
      })
      setIsLoading(false)
    }
  }

  return (
    <>
      <Head>
  <title>{t('Login - ReadIQ')}</title>
  <meta name="description" content={t('Login to your ReadIQ account')} />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Link href="/" className="flex justify-center">
            <h1 className="text-4xl font-bold text-primary-600">ReadIQ</h1>
          </Link>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            {t('Sign in to your account')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t("Don't have an account?")}{' '}
            <Link href="/signup" className="font-medium text-primary-600 hover:text-primary-500">
              {t('Sign up')}
            </Link>
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  {t('Email address')}
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className={`appearance-none block w-full px-3 py-2 border ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                  />
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  {t('Password')}
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className={`appearance-none block w-full px-3 py-2 border ${
                      errors.password ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                  />
                  {errors.password && (
                    <p className="mt-2 text-sm text-red-600">{errors.password}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <Link href="/forgot" className="font-medium text-primary-600 hover:text-primary-500">
                    {t('Forgot your password?')}
                  </Link>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? t('Signing in...') : t('Sign in')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  )
}
