import React, { useEffect, useRef, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { BackButton } from '@/components/BackButton'
import { supabase } from '@/lib/supabaseClient'

export default function Verify() {
  const router = useRouter()
  const [status, setStatus] = useState<'success' | 'pending' | 'error'>('pending')
  const [joinState, setJoinState] = useState<'idle' | 'joining' | 'success' | 'error'>('idle')
  const [joinMessage, setJoinMessage] = useState<string>('')
  const joinAttemptedRef = useRef(false)
  const [joinToken, setJoinToken] = useState<string | null>(null)
  const [sessionReady, setSessionReady] = useState(true)

  useEffect(() => {
    const queryToken = typeof router.query.joinToken === 'string' ? router.query.joinToken : null
    if (queryToken) {
      setJoinToken(queryToken)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('pending-join-token', queryToken)
      }
    } else if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('pending-join-token')
      if (stored) {
        setJoinToken(stored)
      }
    }
  }, [router.query.joinToken])

  useEffect(() => {
    const { access_token, refresh_token, expires_in } = router.query

    if (typeof access_token === 'string' && typeof refresh_token === 'string') {
      setSessionReady(false)

      const syncSession = async () => {
        try {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token })
          if (error) {
            throw error
          }

          const maxAge = typeof expires_in === 'string' ? Number(expires_in) : null

          const response = await fetch('/api/auth/set-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              access_token,
              refresh_token,
              expires_in: typeof maxAge === 'number' && Number.isFinite(maxAge) ? maxAge : undefined,
            }),
          })

          if (!response.ok) {
            throw new Error('Failed to persist server session during verification')
          }
        } catch (error) {
          console.error('Failed to synchronize session during verification', error)
        } finally {
          setSessionReady(true)
        }
      }

      syncSession()
    }
  }, [router.query])

  useEffect(() => {
    const { status: queryStatus } = router.query
    
    if (queryStatus === 'success') {
      setStatus('success')
      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        router.push('/dashboard')
      }, 3000)
    } else if (queryStatus === 'error') {
      setStatus('error')
    } else {
      setStatus('pending')
    }
  }, [router.query, router])

  useEffect(() => {
    const attemptJoin = async () => {
  if (status !== 'success') return
  if (!sessionReady) return
      if (!joinToken) return
      if (joinAttemptedRef.current) return
      joinAttemptedRef.current = true

      setJoinState('joining')
      setJoinMessage('Подключаем к группе…')
      try {
        const response = await fetch('/api/student/groups/join-with-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ token: joinToken }),
        })

        const payload = await response.json().catch(() => ({}))

        if (!response.ok) {
          throw new Error(payload?.message || 'Не удалось присоединиться к группе')
        }

        setJoinState('success')
        setJoinMessage(payload?.message || 'Вы успешно присоединились к группе')
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem('pending-join-token')
        }
      } catch (error: any) {
        console.error('Auto join after verification failed', error)
        setJoinState('error')
        setJoinMessage(error?.message || 'Не удалось присоединиться к группе. Попробуйте позже или используйте QR-код повторно.')
      }
    }

    attemptJoin()
  }, [status, joinToken, sessionReady])

  return (
    <>
      <Head>
        <title>Email Verification - ReadIQ</title>
        <meta name="description" content="Verify your ReadIQ email" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-6 lg:px-8 self-start mb-6">
          <BackButton fallbackHref="/" />
        </div>
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Link href="/" className="flex justify-center">
            <h1 className="text-4xl font-bold text-primary-600">ReadIQ</h1>
          </Link>
          
          <div className="mt-8 bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10">
            {status === 'success' ? (
              <div className="text-center">
                <div className="text-6xl mb-4">✅</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Email Verified!
                </h2>
                <p className="text-gray-600 mb-4">
                  Your email has been successfully verified.
                </p>
                {joinState === 'joining' && (
                  <p className="text-sm text-gray-500">{joinMessage || 'Подключаем к группе…'}</p>
                )}
                {joinState === 'success' && (
                  <p className="text-sm text-green-600">{joinMessage}</p>
                )}
                {joinState === 'error' && (
                  <p className="text-sm text-red-600">{joinMessage}</p>
                )}
                <p className="text-sm text-gray-500">
                  Redirecting to your dashboard...
                </p>
              </div>
            ) : status === 'error' ? (
              <div className="text-center">
                <div className="text-6xl mb-4">❌</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Verification Failed
                </h2>
                <p className="text-gray-600 mb-6">
                  The verification link is invalid or has expired.
                </p>
                <Link
                  href="/login"
                  className="inline-block px-6 py-3 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700"
                >
                  Go to Login
                </Link>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-6xl mb-4">📧</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Check Your Email
                </h2>
                <p className="text-gray-600 mb-4">
                  We&apos;ve sent a verification link to your email address.
                  Please click the link to verify your account.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> The verification link will expire in 24 hours.
                    If you don&apos;t see the email, check your spam folder.
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  Already verified?{' '}
                  <Link href="/login" className="text-primary-600 hover:text-primary-500 font-medium">
                    Log in here
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
