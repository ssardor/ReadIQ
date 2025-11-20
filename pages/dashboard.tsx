import React, { useMemo } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { GetServerSideProps } from 'next'
import { motion } from 'framer-motion'
import { supabaseServer } from '@/lib/supabaseServer'
import { DashboardHeader } from '@/components/DashboardHeader'
import type { MentorAnalytics, StudentAssignment, UserProfile } from '@/lib/types'
import { getMentorAnalytics } from '@/lib/server/getMentorAnalytics'

interface DashboardProps {
  profile: UserProfile
  assignments?: StudentAssignment[] | null
  analytics?: MentorAnalytics | null
}

const formatPercent = (value: number | null | undefined) => {
  if (value == null) return '—'
  return `${Math.round(value * 100)}%`
}

const formatScore = (value: number | null | undefined) => {
  if (value == null) return '—'
  return `${Math.round(value * 100)}%`
}

const getScheduledTimestamp = (assignment: StudentAssignment) => {
  const scheduled = assignment.quiz_instance?.scheduled_at
  if (!scheduled) return Number.MAX_SAFE_INTEGER
  const timestamp = new Date(scheduled).getTime()
  return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp
}

export default function Dashboard({ profile, assignments, analytics }: DashboardProps) {
  const assignmentList = useMemo(() => (Array.isArray(assignments) ? assignments : []), [assignments])
  const completedCount = assignmentList.filter((item) => item.status === 'completed').length
  const mentorSummary = profile.role === 'mentor' ? analytics?.summary ?? null : null
  const mentorCompletionRate = mentorSummary && mentorSummary.totalAssignments
    ? mentorSummary.completedAssignments / mentorSummary.totalAssignments
    : null
  const mentorActiveStudents = profile.role === 'mentor' && analytics
    ? analytics.students.filter((student) => Boolean(student.lastActivity)).length
    : 0
  const upcomingAssignments = useMemo(() => (
    assignmentList
      .filter((item) => item.status !== 'completed')
      .sort((a, b) => getScheduledTimestamp(a) - getScheduledTimestamp(b))
  ), [assignmentList])

  const completedAssignments = useMemo(() => (
    assignmentList
      .filter((item) => item.status === 'completed')
      .sort((a, b) => {
        const aTime = new Date(a.quiz_instance?.scheduled_at ?? a.created_at).getTime()
        const bTime = new Date(b.quiz_instance?.scheduled_at ?? b.created_at).getTime()
        return bTime - aTime
      })
  ), [assignmentList])

  const nextAssignment = upcomingAssignments[0] ?? null
  const progressPercent = assignmentList.length ? Math.round((completedCount / assignmentList.length) * 100) : 0
  const upcomingPreview = upcomingAssignments.slice(0, 5)
  const completedPreview = completedAssignments.slice(0, 5)
  const firstName = profile.full_name ? profile.full_name.split(' ')[0] : 'there'
  const isAllComplete = assignmentList.length > 0 && completedCount === assignmentList.length
  const heroCtaLink = nextAssignment ? `/student/quizzes/${nextAssignment.id}` : '/student/quizzes'

  const formatDueInfo = (assignment: StudentAssignment) => {
    const scheduled = assignment.quiz_instance?.scheduled_at
    if (!scheduled) return 'Available anytime'
    const date = new Date(scheduled)
    if (Number.isNaN(date.getTime())) return 'Available anytime'
    const diffMs = date.getTime() - Date.now()
    if (diffMs <= 0) return 'Available now'
    const diffMinutes = Math.round(diffMs / 60000)
    if (diffMinutes < 60) return `Starts in ${diffMinutes} min`
    const diffHours = Math.round(diffMinutes / 60)
    if (diffHours < 24) return `Starts in ${diffHours} hr`
    const diffDays = Math.round(diffHours / 24)
    if (diffDays <= 7) return `Starts in ${diffDays} day${diffDays === 1 ? '' : 's'}`
    return date.toLocaleDateString()
  }

  const getStatusLabel = (assignment: StudentAssignment) => {
    switch (assignment.status) {
      case 'completed':
        return 'Completed'
      case 'notified':
        return 'Notified'
      case 'cancelled':
        return 'Cancelled'
      default:
        return 'Assigned'
    }
  }

  const formatDurationLabel = (seconds?: number | null) => {
    if (!seconds) return 'Flexible'
    const mins = Math.max(1, Math.round(seconds / 60))
    return `${mins} min`
  }
  return (
    <>
      <Head>
        <title>Dashboard - ReadIQ</title>
        <meta name="description" content="Your ReadIQ dashboard" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <DashboardHeader fullName={profile.full_name} role={profile.role} />

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Welcome, {profile.role === 'mentor' ? 'Mentor' : 'Student'} {profile.full_name}
                  </h1>
                  <p className="mt-2 text-gray-600">
                    {profile.university && `${profile.university} • `}
                    Role: <span className="capitalize font-medium">{profile.role}</span>
                  </p>
                </div>

                {profile.role === 'mentor' && (
                  <div className="flex flex-wrap gap-2">
                    <Link href="/mentor/groups" className="inline-flex items-center justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:border-primary-200 hover:bg-primary-50">
                      Go to groups
                    </Link>
                    <Link href="/mentor/quizzes" className="inline-flex items-center justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:border-primary-200 hover:bg-primary-50">
                      Go to quizzes
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {profile.role === 'mentor' ? (
              <div className="space-y-6">
                <section className="rounded-lg bg-white shadow p-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Mentor overview</h2>
                      <p className="text-gray-600">Track group activity and jump to key actions quickly.</p>
                    </div>
                    <Link href="/mentor/analytics" className="inline-flex items-center justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-primary-700">
                      Go to analytics
                    </Link>
                  </div>
                </section>

                <section className="grid gap-4 md:grid-cols-3">
                  <article className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">Assignments</p>
                    <p className="mt-2 text-3xl font-semibold text-primary-600">{mentorSummary ? mentorSummary.totalAssignments : '—'}</p>
                    <p className="mt-2 text-xs text-gray-500">Total assignments across all groups.</p>
                  </article>
                  <article className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">Completed</p>
                    <p className="mt-2 text-3xl font-semibold text-green-600">{mentorSummary ? mentorSummary.completedAssignments : '—'}</p>
                    <p className="mt-2 text-xs text-gray-500">Completion rate: {formatPercent(mentorCompletionRate)}</p>
                  </article>
                  <article className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">Active students</p>
                    <p className="mt-2 text-3xl font-semibold text-blue-600">{mentorSummary ? mentorActiveStudents : '—'}</p>
                    <p className="mt-2 text-xs text-gray-500">With recorded results.</p>
                  </article>
                </section>

                <section className="grid gap-4 md:grid-cols-2">
                  <article className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900">Quick actions</h3>
                    <p className="mt-1 text-sm text-gray-600">Get started with groups and quizzes.</p>
                    <div className="mt-4 grid gap-3">
                      <Link href="/mentor/groups" className="flex items-center justify-between rounded border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:border-primary-200 hover:bg-primary-50">
                        <span>Open group list</span>
                        <span className="text-xs text-gray-500">CMD+G</span>
                      </Link>
                      <Link href="/mentor/quizzes" className="flex items-center justify-between rounded border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:border-primary-200 hover:bg-primary-50">
                        <span>Open quiz list</span>
                        <span className="text-xs text-gray-500">CMD+Q</span>
                      </Link>
                      <Link href="/mentor/quizzes/new" className="flex items-center justify-between rounded border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:border-primary-200 hover:bg-primary-50">
                        <span>Create new quiz</span>
                        <span className="text-xs text-gray-500">CMD+N</span>
                      </Link>
                      <Link href="/mentor/groups" className="flex items-center justify-between rounded border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:border-primary-200 hover:bg-primary-50">
                        <span>Add students to a group</span>
                        <span className="text-xs text-gray-500">CMD+S</span>
                      </Link>
                    </div>
                  </article>

                  <article className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900">Recent groups</h3>
                    <p className="mt-1 text-sm text-gray-600">Most recently active groups and their progress.</p>
                    {analytics && analytics.groups.length ? (
                      <div className="mt-4 space-y-3">
                        {analytics.groups.slice(0, 3).map((group) => (
                          <div key={group.id} className="rounded border border-gray-100 px-4 py-3">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900">{group.name}</p>
                              <span className="rounded bg-green-50 px-2 py-1 text-xs font-semibold text-green-700">{formatPercent(group.completionRate)}</span>
                            </div>
                            <p className="mt-1 text-xs text-gray-500">{group.studentCount} students • {group.quizCount} quizzes</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-4 rounded border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-sm text-gray-500">
                        No groups yet. Create a group to start tracking progress.
                      </div>
                    )}
                  </article>
                </section>

                <section className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Student activity</h3>
                      <p className="text-sm text-gray-600">Latest students who completed or started quizzes.</p>
                    </div>
                    <Link href="/mentor/analytics" className="text-sm font-medium text-primary-600 hover:underline">Detailed analytics</Link>
                  </div>
                  {analytics && analytics.students.length ? (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {analytics.students.slice(0, 6).map((student) => (
                        <div key={student.id} className="rounded border border-gray-100 px-4 py-3">
                          <p className="text-sm font-semibold text-gray-900">{student.fullName}</p>
                          <p className="text-xs text-gray-500">{student.groupNames.join(', ') || '—'}</p>
                          <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
                            <span>Average score</span>
                            <span className="font-semibold text-gray-900">{formatScore(student.averageScore)}</span>
                          </div>
                          <div className="mt-1 flex items-center justify-between text-xs text-gray-600">
                            <span>Completed</span>
                            <span className="font-semibold text-gray-900">{student.completedAssignments}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-4 rounded border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-sm text-gray-500">
                      Student activity will show up here once they start taking quizzes.
                    </div>
                  )}
                </section>
              </div>
            ) : (
              <div className="space-y-6">
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-500 to-indigo-500 text-white shadow-xl"
                >
                  <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-10">
                    <div className="space-y-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-primary-100/80">Focus mode</p>
                      <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                        Hey {firstName}, ready for your next quiz?
                      </h2>
                      <p className="max-w-lg text-sm text-primary-100/90">
                        We deliver one question at a time. Take a breath, read slowly, and start when you feel prepared.
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <Link
                          href={heroCtaLink}
                          className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-primary-600 shadow hover:bg-primary-50"
                        >
                          {nextAssignment ? 'Continue quiz' : 'View assignments'}
                          <span aria-hidden>→</span>
                        </Link>
                        {nextAssignment && (
                          <span className="inline-flex items-center rounded-full border border-white/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-primary-100">
                            {formatDueInfo(nextAssignment)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="grid w-full max-w-md grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="rounded-2xl bg-white/10 p-4 shadow-lg ring-1 ring-white/20">
                        <p className="text-xs font-semibold uppercase tracking-wide text-primary-100/80">Progress</p>
                        <p className="mt-3 text-3xl font-semibold">{progressPercent}%</p>
                        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/30">
                          <div className="h-full rounded-full bg-white" style={{ width: `${progressPercent}%` }} />
                        </div>
                        <p className="mt-2 text-xs text-primary-100/80">{completedCount} of {assignmentList.length} completed</p>
                      </div>
                      <div className="rounded-2xl bg-white/10 p-4 shadow-lg ring-1 ring-white/20">
                        <p className="text-xs font-semibold uppercase tracking-wide text-primary-100/80">Next quiz</p>
                        <p className="mt-3 text-lg font-semibold leading-tight">
                          {nextAssignment?.quiz_instance?.quiz?.title ?? 'Waiting for assignment'}
                        </p>
                        <p className="mt-2 text-sm text-primary-100/80">
                          {nextAssignment ? formatDurationLabel(nextAssignment.quiz_instance?.duration_seconds) : 'We will notify you once a quiz is assigned.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.section>

                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                  className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 sm:text-xl">Upcoming</h3>
                      <p className="text-sm text-gray-500">Quizzes appear in the order you&apos;ll take them.</p>
                    </div>
                    <Link href="/student/quizzes" className="text-sm font-medium text-primary-600 hover:underline">
                      View all
                    </Link>
                  </div>
                  {upcomingPreview.length ? (
                    <div className="mt-6 space-y-4">
                      {upcomingPreview.map((assignment, index) => {
                        const instance = assignment.quiz_instance
                        const quiz = instance?.quiz
                        const group = instance?.group
                        const linkHref = `/student/quizzes/${assignment.id}`
                        return (
                          <motion.div
                            key={assignment.id}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 + index * 0.05 }}
                            whileHover={{ y: -2 }}
                            className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="space-y-3">
                              <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-wide text-primary-600">
                                <span>{group?.name ?? 'Self-paced'}</span>
                                {group?.term && <span className="text-gray-400">• {group.term}</span>}
                              </div>
                              <div>
                                <p className="text-lg font-semibold text-gray-900">{quiz?.title ?? 'Untitled quiz'}</p>
                                {quiz?.description && (
                                  <p className="mt-1 text-sm text-gray-500">{quiz.description}</p>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                                <span className="inline-flex items-center rounded-full bg-primary-50 px-3 py-1 font-semibold text-primary-600">
                                  {formatDueInfo(assignment)}
                                </span>
                                <span>Duration {formatDurationLabel(instance?.duration_seconds)}</span>
                                <span>Status {getStatusLabel(assignment)}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 self-end sm:self-center">
                              <Link
                                href={linkHref}
                                className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-gray-700"
                              >
                                Start
                                <span aria-hidden>→</span>
                              </Link>
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="mt-6 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
                      {isAllComplete ? 'You are all caught up. We will let you know when something new arrives.' : 'No quizzes yet. Your mentor will assign the first one soon.'}
                    </div>
                  )}
                </motion.section>

                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 sm:text-xl">Recently completed</h3>
                      <p className="text-sm text-gray-500">Review what you&apos;ve already tackled.</p>
                    </div>
                  </div>
                  {completedPreview.length ? (
                    <div className="mt-6 space-y-3">
                      {completedPreview.map((assignment) => {
                        const instance = assignment.quiz_instance
                        const quiz = instance?.quiz
                        const group = instance?.group
                        const completedOn = new Date(assignment.created_at).toLocaleDateString()
                        return (
                          <motion.div
                            key={assignment.id}
                            whileHover={{ y: -1 }}
                            className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{quiz?.title ?? 'Untitled quiz'}</p>
                              <p className="text-xs text-gray-500">{group?.name ?? 'Self-paced'} • Completed {completedOn}</p>
                            </div>
                            <Link href={`/student/quizzes/${assignment.id}`} className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:underline">
                              Review
                              <span aria-hidden>→</span>
                            </Link>
                          </motion.div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="mt-6 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
                      {assignmentList.length ? 'Completed quizzes will appear here for quick review.' : 'Once you finish a quiz, you will be able to review it here.'}
                    </div>
                  )}
                </motion.section>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { req } = context

  // Get all possible cookie names for Supabase auth
  const cookies = req.cookies
  let accessToken = cookies['sb-access-token'] || 
                    cookies['supabase-auth-token'] ||
                    cookies['sb-islicuycdgkjqbixfuyx-auth-token']

  // Try to find any Supabase auth token
  if (!accessToken) {
    const authCookie = Object.keys(cookies).find(key => 
      key.startsWith('sb-') && key.includes('auth-token')
    )
    if (authCookie) {
      accessToken = cookies[authCookie]
    }
  }

  // Parse if it's a JSON string
  if (accessToken && accessToken.startsWith('[') || accessToken?.startsWith('{')) {
    try {
      const parsed = JSON.parse(accessToken)
      accessToken = parsed.access_token || parsed[0]
    } catch (e) {
      console.error('Error parsing token:', e)
    }
  }

  console.log('Dashboard - Available cookies:', Object.keys(cookies))
  console.log('Dashboard - Access token found:', !!accessToken)

  if (!accessToken) {
    console.log('Dashboard - No access token, redirecting to login')
    return {
      redirect: {
        destination: '/login',
        permanent: false
      }
    }
  }

  try {
    // Verify token and get user using server client
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(accessToken)

    console.log('Dashboard - User found:', !!user)
    console.log('Dashboard - Auth error:', authError)

    if (authError || !user) {
      console.log('Dashboard - Auth failed, redirecting to login')
      return {
        redirect: {
          destination: '/login',
          permanent: false
        }
      }
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseServer
      .from('users_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    console.log('Dashboard - Profile found:', !!profile)
    console.log('Dashboard - Profile error:', profileError)

    if (profileError || !profile) {
      console.error('Profile error:', profileError)
      return {
        redirect: {
          destination: '/login?error=no_profile',
          permanent: false
        }
      }
    }

  let assignments: StudentAssignment[] | undefined
  let analytics: MentorAnalytics | null = null

    if (profile.role === 'student') {
      const { data: assignmentRows, error: assignmentError } = await supabaseServer
        .from('quiz_assignments')
        .select(
          'id,status,created_at,quiz_instance:quiz_instances(id,status,scheduled_at,duration_seconds,quiz:quizzes(id,title,description),group:groups(id,name,term))'
        )
        .eq('student_id', user.id)
        .order('created_at', { ascending: false })

      if (assignmentError) {
        console.error('Dashboard - Assignments error:', assignmentError)
      } else if (assignmentRows) {
        assignments = assignmentRows.map((row: any) => {
          const instanceRaw = Array.isArray(row.quiz_instance)
            ? row.quiz_instance[0]
            : row.quiz_instance

          if (!instanceRaw) {
            return {
              id: row.id,
              status: row.status,
              created_at: row.created_at,
              quiz_instance: null,
            } as StudentAssignment
          }

          const quizRaw = Array.isArray(instanceRaw.quiz) ? instanceRaw.quiz[0] : instanceRaw.quiz
          const groupRaw = Array.isArray(instanceRaw.group) ? instanceRaw.group[0] : instanceRaw.group

          return {
            id: row.id,
            status: row.status,
            created_at: row.created_at,
            quiz_instance: {
              id: instanceRaw.id,
              status: instanceRaw.status,
              scheduled_at: instanceRaw.scheduled_at,
              duration_seconds: instanceRaw.duration_seconds ?? null,
              quiz: quizRaw
                ? {
                    id: quizRaw.id,
                    title: quizRaw.title,
                    description: quizRaw.description ?? null,
                  }
                : null,
              group: groupRaw
                ? {
                    id: groupRaw.id,
                    name: groupRaw.name,
                    term: groupRaw.term ?? null,
                  }
                : null,
            },
          } as StudentAssignment
        })
      }
    } else if (profile.role === 'mentor') {
      try {
        analytics = await getMentorAnalytics(profile.id)
      } catch (analyticsError) {
        console.error('Dashboard - Analytics error:', analyticsError)
      }
    }

    return {
      props: {
        profile,
        assignments: assignments ?? null,
        analytics,
      },
    }

  } catch (error) {
    console.error('Dashboard SSR error:', error)
    return {
      redirect: {
        destination: '/login',
        permanent: false
      }
    }
  }
}
