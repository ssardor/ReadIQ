import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'
import { supabaseServer } from '@/lib/supabaseServer'
import { DashboardHeader } from '@/components/DashboardHeader'
import { Toast } from '@/components/Toast'
import { BackButton } from '@/components/BackButton'
import { validateFullName } from '@/utils/validation'
import type { UserProfile } from '@/lib/types'

interface ProfileProps {
  profile: UserProfile
}

export default function Profile({ profile }: ProfileProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    fullName: profile.full_name,
    university: profile.university || ''
  })
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const nameValidation = validateFullName(formData.fullName)
    if (!nameValidation.isValid) {
      setToast({
        message: nameValidation.error!,
        type: 'error'
      })
      return
    }

    setIsLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session')
      }

      const { error } = await supabase
        .from('users_profiles')
        .update({
          full_name: formData.fullName,
          university: formData.university || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)

      if (error) throw error

      setToast({
        message: 'Profile updated successfully!',
        type: 'success'
      })
      setIsEditing(false)

      // Refresh the page to show updated data
      setTimeout(() => {
        router.replace(router.asPath)
      }, 1000)

    } catch (error: any) {
      console.error('Update profile error:', error)
      setToast({
        message: error.message || 'Failed to update profile',
        type: 'error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Profile - ReadIQ</title>
        <meta name="description" content="Manage your ReadIQ profile" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <DashboardHeader fullName={profile.full_name} role={profile.role} />

        <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <BackButton fallbackHref="/dashboard" className="mb-4" />
            <div className="bg-white rounded-lg shadow">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Profile Settings
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <div className="mt-1">
                      <input
                        type="email"
                        id="email"
                        value={profile.id}
                        disabled
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 sm:text-sm cursor-not-allowed"
                      />
                      <p className="mt-2 text-xs text-gray-500">
                        Email cannot be changed
                      </p>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                      Role
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        id="role"
                        value={profile.role}
                        disabled
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 capitalize sm:text-sm cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                      Full Name
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className={`appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                          !isEditing ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="university" className="block text-sm font-medium text-gray-700">
                      University (Optional)
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        id="university"
                        name="university"
                        value={formData.university}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className={`appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                          !isEditing ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
                        }`}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    {!isEditing ? (
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        Edit Profile
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditing(false)
                            setFormData({
                              fullName: profile.full_name,
                              university: profile.university || ''
                            })
                          }}
                          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                      </>
                    )}
                  </div>
                </form>
              </div>
            </div>

            <div className="mt-6 bg-white rounded-lg shadow">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Account Information
                </h3>
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Member since</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(profile.created_at).toLocaleDateString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Email verified</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {profile.email_verified ? '✅ Yes' : '❌ No'}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </main>
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

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { req } = context

  const token = req.cookies['sb-access-token'] || req.cookies['supabase-auth-token']

  if (!token) {
    return {
      redirect: {
        destination: '/login',
        permanent: false
      }
    }
  }

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return {
        redirect: {
          destination: '/login',
          permanent: false
        }
      }
    }

    const { data: profile, error: profileError } = await supabaseServer
      .from('users_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return {
        redirect: {
          destination: '/login',
          permanent: false
        }
      }
    }

    return {
      props: {
        profile
      }
    }

  } catch (error) {
    return {
      redirect: {
        destination: '/login',
        permanent: false
      }
    }
  }
}
