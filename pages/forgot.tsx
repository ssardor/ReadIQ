import React, { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { Toast } from '@/components/Toast'
import { BackButton } from '@/components/BackButton'
import { validateEmail, mapSupabaseError } from '@/utils/validation'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const emailValidation = validateEmail(email)
    if (!emailValidation.isValid) {
      setToast({
        message: emailValidation.error!,
        type: 'error'
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message)
      }

      setIsSubmitted(true)
      setToast({
        message: 'Password reset email sent! Check your inbox.',
        type: 'success'
      })

    } catch (error: any) {
      console.error('Forgot password error:', error)
      setToast({
        message: mapSupabaseError(error),
        type: 'error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Forgot Password - ReadIQ</title>
        <meta name="description" content="Reset your ReadIQ password" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-6 lg:px-8 self-start mb-6">
          <BackButton fallbackHref="/" />
        </div>
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Link href="/" className="flex justify-center">
            <h1 className="text-4xl font-bold text-primary-600">ReadIQ</h1>
          </Link>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Remember your password?{' '}
            <Link href="/login" className="font-medium text-primary-600 hover:text-primary-500">
              Sign in
            </Link>
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10">
            {!isSubmitted ? (
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <p className="text-sm text-gray-600 mb-4">
                    Enter your email address and we&apos;ll send you a link to reset your password.
                  </p>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email address
                  </label>
                  <div className="mt-1">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Sending...' : 'Send reset link'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center">
                <div className="text-5xl mb-4">✉️</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Check your email
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  We&apos;ve sent a password reset link to <strong>{email}</strong>.
                  Click the link in the email to reset your password.
                </p>
                <p className="text-xs text-gray-500">
                  Didn&apos;t receive the email? Check your spam folder or{' '}
                  <button
                    onClick={() => setIsSubmitted(false)}
                    className="text-primary-600 hover:text-primary-500 font-medium"
                  >
                    try again
                  </button>
                </p>
              </div>
            )}
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
