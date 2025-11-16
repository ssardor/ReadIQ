import React, { useMemo } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { GetServerSideProps } from 'next'
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

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '—'
  return parsed.toLocaleString()
}

export default function Dashboard({ profile, assignments, analytics }: DashboardProps) {
  const assignmentList = useMemo(() => (Array.isArray(assignments) ? assignments : []), [assignments])
  const completedCount = assignmentList.filter((item) => item.status === 'completed').length
  const nextScheduled = useMemo(() => {
    return assignmentList
      .map((item) => item.quiz_instance?.scheduled_at)
      .filter((date): date is string => Boolean(date))
      .map((date) => new Date(date))
      .filter((date) => !Number.isNaN(date.getTime()))
      .sort((a, b) => a.getTime() - b.getTime())[0]
  }, [assignmentList])
  const mentorSummary = profile.role === 'mentor' ? analytics?.summary ?? null : null
  const mentorCompletionRate = mentorSummary && mentorSummary.totalAssignments
    ? mentorSummary.completedAssignments / mentorSummary.totalAssignments
    : null
  const mentorActiveStudents = profile.role === 'mentor' && analytics
    ? analytics.students.filter((student) => Boolean(student.lastActivity)).length
    : 0
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
                      Перейти к группам
                    </Link>
                    <Link href="/mentor/quizzes" className="inline-flex items-center justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:border-primary-200 hover:bg-primary-50">
                      Перейти к квизам
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
                      <h2 className="text-2xl font-bold text-gray-900">Обзор наставника</h2>
                      <p className="text-gray-600">Следите за активностью групп и быстро переходите к ключевым действиям.</p>
                    </div>
                    <Link href="/mentor/analytics" className="inline-flex items-center justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-primary-700">
                      Перейти к аналитике
                    </Link>
                  </div>
                </section>

                <section className="grid gap-4 md:grid-cols-3">
                  <article className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">Назначений</p>
                    <p className="mt-2 text-3xl font-semibold text-primary-600">{mentorSummary ? mentorSummary.totalAssignments : '—'}</p>
                    <p className="mt-2 text-xs text-gray-500">Выданные задания по всем группам.</p>
                  </article>
                  <article className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">Завершено</p>
                    <p className="mt-2 text-3xl font-semibold text-green-600">{mentorSummary ? mentorSummary.completedAssignments : '—'}</p>
                    <p className="mt-2 text-xs text-gray-500">Доля: {formatPercent(mentorCompletionRate)}</p>
                  </article>
                  <article className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">Активные студенты</p>
                    <p className="mt-2 text-3xl font-semibold text-blue-600">{mentorSummary ? mentorActiveStudents : '—'}</p>
                    <p className="mt-2 text-xs text-gray-500">С зафиксированными результатами.</p>
                  </article>
                </section>

                <section className="grid gap-4 md:grid-cols-2">
                  <article className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900">Быстрые действия</h3>
                    <p className="mt-1 text-sm text-gray-600">Запустите работу с группами и квизами.</p>
                    <div className="mt-4 grid gap-3">
                      <Link href="/mentor/groups" className="flex items-center justify-between rounded border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:border-primary-200 hover:bg-primary-50">
                        <span>Открыть список групп</span>
                        <span className="text-xs text-gray-500">CMD+G</span>
                      </Link>
                      <Link href="/mentor/quizzes" className="flex items-center justify-between rounded border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:border-primary-200 hover:bg-primary-50">
                        <span>Открыть список квизов</span>
                        <span className="text-xs text-gray-500">CMD+Q</span>
                      </Link>
                      <Link href="/mentor/quizzes/new" className="flex items-center justify-between rounded border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:border-primary-200 hover:bg-primary-50">
                        <span>Создать новый квиз</span>
                        <span className="text-xs text-gray-500">CMD+N</span>
                      </Link>
                      <Link href="/mentor/groups" className="flex items-center justify-between rounded border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:border-primary-200 hover:bg-primary-50">
                        <span>Добавить студентов в группу</span>
                        <span className="text-xs text-gray-500">CMD+S</span>
                      </Link>
                    </div>
                  </article>

                  <article className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900">Недавние группы</h3>
                    <p className="mt-1 text-sm text-gray-600">Последние активные группы и их прогресс.</p>
                    {analytics && analytics.groups.length ? (
                      <div className="mt-4 space-y-3">
                        {analytics.groups.slice(0, 3).map((group) => (
                          <div key={group.id} className="rounded border border-gray-100 px-4 py-3">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900">{group.name}</p>
                              <span className="rounded bg-green-50 px-2 py-1 text-xs font-semibold text-green-700">{formatPercent(group.completionRate)}</span>
                            </div>
                            <p className="mt-1 text-xs text-gray-500">{group.studentCount} студентов • {group.quizCount} квизов</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-4 rounded border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-sm text-gray-500">
                        Групп пока нет. Создайте группу, чтобы начать отслеживать прогресс.
                      </div>
                    )}
                  </article>
                </section>

                <section className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Активность студентов</h3>
                      <p className="text-sm text-gray-600">Последние студенты, которые прошли или начали квизы.</p>
                    </div>
                    <Link href="/mentor/analytics" className="text-sm font-medium text-primary-600 hover:underline">Подробная аналитика</Link>
                  </div>
                  {analytics && analytics.students.length ? (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {analytics.students.slice(0, 6).map((student) => (
                        <div key={student.id} className="rounded border border-gray-100 px-4 py-3">
                          <p className="text-sm font-semibold text-gray-900">{student.fullName}</p>
                          <p className="text-xs text-gray-500">{student.groupNames.join(', ') || '—'}</p>
                          <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
                            <span>Средний балл</span>
                            <span className="font-semibold text-gray-900">{formatScore(student.averageScore)}</span>
                          </div>
                          <div className="mt-1 flex items-center justify-between text-xs text-gray-600">
                            <span>Завершено</span>
                            <span className="font-semibold text-gray-900">{student.completedAssignments}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-4 rounded border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-sm text-gray-500">
                      Когда студенты начнут проходить квизы, здесь появится их активность.
                    </div>
                  )}
                </section>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Ваши квизы</h2>
                    <p className="text-gray-600">Все назначенные вам задания по группам</p>
                  </div>
                </div>
                <div className="mt-6">
                  {assignmentList.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Квиз</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Группа</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Статус</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Когда</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Длительность</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                          {assignmentList.map((assignment) => {
                            const instance = assignment.quiz_instance
                            const quiz = instance?.quiz
                            const group = instance?.group
                            const scheduledLabel = instance?.scheduled_at
                              ? new Date(instance.scheduled_at).toLocaleString()
                              : 'В любое время'
                            const duration = instance?.duration_seconds
                              ? `${Math.round(instance.duration_seconds / 60)} мин`
                              : '—'
                            const statusLabel =
                              assignment.status === 'completed'
                                ? 'Завершён'
                                : assignment.status === 'notified'
                                  ? 'Оповещён'
                                  : assignment.status === 'cancelled'
                                    ? 'Отменён'
                                    : 'Назначен'

                            return (
                              <tr key={assignment.id}>
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                  <Link href={`/student/quizzes/${assignment.id}`} className="text-primary-600 hover:underline">
                                    {quiz?.title || 'Без названия'}
                                  </Link>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">{group?.name || '—'}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{statusLabel}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{scheduledLabel}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{duration}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="rounded border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-gray-500">
                      Вам пока не назначено ни одного квиза. Ожидайте приглашение от преподавателя.
                    </div>
                  )}
                </div>
              </div>
            )}

            {profile.role === 'student' && (
              <div className="mt-6 grid gap-6 md:grid-cols-3">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Следующий квиз</h3>
                  <div className="text-3xl font-bold text-primary-600">
                    {nextScheduled ? nextScheduled.toLocaleDateString() : '—'}
                  </div>
                  <p className="text-sm text-gray-600">Дата ближайшего планового квиза</p>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Выполнено</h3>
                  <div className="text-3xl font-bold text-green-600">{completedCount}</div>
                  <p className="text-sm text-gray-600">Количество завершённых квизов</p>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Всего заданий</h3>
                  <div className="text-3xl font-bold text-primary-600">{assignmentList.length}</div>
                  <p className="text-sm text-gray-600">Активные и завершённые квизы.</p>
                </div>
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

    // Check email verification
    if (!user.email_confirmed_at) {
      console.log('Dashboard - Email not verified')
      return {
        redirect: {
          destination: '/verify?status=pending',
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
