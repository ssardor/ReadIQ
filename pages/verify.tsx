import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { BackButton } from '@/components/BackButton'

export default function Verify() {
  const router = useRouter()
  const [status, setStatus] = useState<'success' | 'pending' | 'error'>('pending')

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
                  We've sent a verification link to your email address.
                  Please click the link to verify your account.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> The verification link will expire in 24 hours.
                    If you don't see the email, check your spam folder.
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
