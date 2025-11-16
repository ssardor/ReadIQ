import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import type { GetServerSideProps } from 'next'
import { requireMentor } from '@/utils/roleGuard'
import type { MentorAnalytics } from '@/lib/types'
import { getMentorAnalytics } from '@/lib/server/getMentorAnalytics'
import { BackButton } from '@/components/BackButton'

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

type MentorAnalyticsPageProps = {
  analytics: MentorAnalytics
}

const MentorAnalyticsPage: React.FC<MentorAnalyticsPageProps> = ({ analytics }) => {
  return (
    <>
      <Head>
        <title>Mentor Analytics • ReadIQ</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <BackButton href="/dashboard" label="← Назад" className="mb-4" />

          <header className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900">Аналитика наставника</h1>
              <p className="text-sm text-gray-600">Детализированная статистика по группам, квизам и студентам.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/mentor/groups" className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
                Управлять группами
              </Link>
              <Link href="/mentor/quizzes" className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
                Управлять квизами
              </Link>
            </div>
          </header>

          <section className="grid gap-4 md:grid-cols-3">
            <article className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Назначений всего</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">{analytics.summary.totalAssignments}</p>
              <p className="mt-2 text-xs text-gray-500">Задания, выданные активным студентам.</p>
            </article>
            <article className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Завершено</p>
              <p className="mt-2 text-3xl font-semibold text-green-600">{analytics.summary.completedAssignments}</p>
              <p className="mt-2 text-xs text-gray-500">Студенты, сдавшие задания до конца.</p>
            </article>
            <article className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Средний балл</p>
              <p className="mt-2 text-3xl font-semibold text-indigo-600">{formatScore(analytics.summary.averageScore)}</p>
              <p className="mt-2 text-xs text-gray-500">Средний результат по последним попыткам.</p>
            </article>
          </section>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <section className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Группы</h2>
                <Link href="/mentor/groups" className="text-sm font-medium text-primary-600 hover:underline">Перейти к группам</Link>
              </div>
              {analytics.groups.length ? (
                <div className="space-y-4">
                  {analytics.groups.map((group) => (
                    <article key={group.id} className="rounded border border-gray-100 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{group.name}</p>
                          <p className="text-xs text-gray-500">{group.term || 'Терм не указан'} • {group.studentCount} студентов</p>
                        </div>
                        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">{formatPercent(group.completionRate)}</span>
                      </div>
                      <dl className="mt-3 grid grid-cols-2 gap-3 text-xs text-gray-600 sm:grid-cols-4">
                        <div>
                          <dt>Квизов</dt>
                          <dd className="font-semibold text-gray-900">{group.quizCount}</dd>
                        </div>
                        <div>
                          <dt>Завершено</dt>
                          <dd className="font-semibold text-gray-900">{group.completedAssignments}/{group.totalAssignments}</dd>
                        </div>
                        <div>
                          <dt>Средний балл</dt>
                          <dd className="font-semibold text-gray-900">{formatScore(group.averageScore)}</dd>
                        </div>
                        <div>
                          <dt>Грядущие квизы</dt>
                          <dd className="font-semibold text-gray-900">{group.upcomingInstances}</dd>
                        </div>
                      </dl>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-500">
                  Группы ещё не созданы. Создайте группу, чтобы отслеживать прогресс студентов.
                </div>
              )}
            </section>

            <section className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Квизы</h2>
                <Link href="/mentor/quizzes" className="text-sm font-medium text-primary-600 hover:underline">Перейти к квизам</Link>
              </div>
              {analytics.quizzes.length ? (
                <div className="space-y-4">
                  {analytics.quizzes.map((quiz) => (
                    <article key={quiz.id} className="rounded border border-gray-100 p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-900">{quiz.title}</p>
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{formatPercent(quiz.completionRate)}</span>
                      </div>
                      <dl className="mt-3 grid grid-cols-2 gap-3 text-xs text-gray-600 sm:grid-cols-4">
                        <div>
                          <dt>Назначений</dt>
                          <dd className="font-semibold text-gray-900">{quiz.assignmentCount}</dd>
                        </div>
                        <div>
                          <dt>Завершено</dt>
                          <dd className="font-semibold text-gray-900">{quiz.completedAssignments}</dd>
                        </div>
                        <div>
                          <dt>Средний балл</dt>
                          <dd className="font-semibold text-gray-900">{formatScore(quiz.averageScore)}</dd>
                        </div>
                        <div>
                          <dt>Диапазон</dt>
                          <dd className="font-semibold text-gray-900">{formatScore(quiz.worstScore)} – {formatScore(quiz.bestScore)}</dd>
                        </div>
                      </dl>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-500">
                  Квизы ещё не созданы. Добавьте квиз, чтобы увидеть статистику.
                </div>
              )}
            </section>
          </div>

          <section className="mt-8 rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Студенты</h2>
              <p className="text-xs text-gray-500">Скоро появится просмотр истории студента.</p>
            </div>
            {analytics.students.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-500">Студент</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500">Группы</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500">Средний балл</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500">Завершено</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500">Ожидает</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500">Последняя активность</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {analytics.students.map((student) => (
                      <tr key={student.id}>
                        <td className="px-4 py-3 font-medium text-gray-900">{student.fullName}</td>
                        <td className="px-4 py-3 text-gray-600">{student.groupNames.join(', ') || '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{formatScore(student.averageScore)}</td>
                        <td className="px-4 py-3 text-gray-600">{student.completedAssignments}</td>
                        <td className="px-4 py-3 text-gray-600">{student.pendingAssignments}</td>
                        <td className="px-4 py-3 text-gray-600">{formatDateTime(student.lastActivity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-500">
                Студентов пока не добавлено. После присоединения появится статистика по результатам.
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  )
}

export const getServerSideProps: GetServerSideProps<MentorAnalyticsPageProps> = async (ctx) => {
  const mentor = await requireMentor(ctx)
  if ('redirect' in mentor) {
    return mentor as any
  }

  const analytics = await getMentorAnalytics(mentor.user.id)

  return {
    props: {
      analytics,
    },
  }
}

export default MentorAnalyticsPage
