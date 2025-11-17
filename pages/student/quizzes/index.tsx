import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import type { GetServerSideProps } from 'next'
import { requireStudent } from '@/utils/roleGuard'
import { supabaseServer } from '@/lib/supabaseServer'
import type { StudentAssignment } from '@/lib/types'
import { BackButton } from '@/components/BackButton'

interface PageProps {
  assignments: StudentAssignment[]
}

const statusLabelMap: Record<StudentAssignment['status'], string> = {
  assigned: 'Assigned',
  notified: 'Notified',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

const formatSchedule = (value: string | null) => {
  if (!value) return 'Anytime'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'Anytime'
  return parsed.toLocaleString()
}

const formatDuration = (seconds: number | null) => {
  if (!seconds) return 'Flexible'
  const minutes = Math.max(1, Math.round(seconds / 60))
  return `${minutes} min`
}

const StudentQuizzesIndex: React.FC<PageProps> = ({ assignments }) => {
  return (
    <>
      <Head>
        <title>My Quizzes • ReadIQ</title>
      </Head>
      <div className="mx-auto max-w-5xl px-6 py-6">
        <BackButton href="/dashboard" className="mb-4" />
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Assigned quizzes</h1>
          <p className="text-sm text-gray-500">Review what is scheduled, already completed, and jump back in.</p>
        </div>

        {assignments.length ? (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Quiz</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Group</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Scheduled</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Duration</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {assignments.map((assignment) => {
                  const instance = assignment.quiz_instance
                  const quiz = instance?.quiz
                  const group = instance?.group
                  return (
                    <tr key={assignment.id}>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {quiz ? quiz.title : 'Untitled quiz'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{group ? group.name : '—'}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                          {statusLabelMap[assignment.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{formatSchedule(instance?.scheduled_at ?? null)}</td>
                      <td className="px-4 py-3 text-gray-600">{formatDuration(instance?.duration_seconds ?? null)}</td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/student/quizzes/${assignment.id}`}
                          className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-3 py-1 text-xs font-semibold text-white hover:bg-primary-700"
                        >
                          Open
                          <span aria-hidden>→</span>
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
            You do not have any assigned quizzes yet. Your mentor will invite you soon.
          </div>
        )}
      </div>
    </>
  )
}

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const student = await requireStudent(ctx)
  if ('redirect' in student) return student as any

  const { data: rows, error } = await supabaseServer
    .from('quiz_assignments')
    .select('id,status,created_at,quiz_instance:quiz_instances(id,status,scheduled_at,duration_seconds,quiz:quizzes(id,title,description),group:groups(id,name,term))')
    .eq('student_id', student.user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Student quizzes load error:', error)
    return {
      props: {
        assignments: [],
      },
    }
  }

  const assignments: StudentAssignment[] = (rows ?? []).map((row: any) => {
    const instanceRaw = Array.isArray(row.quiz_instance) ? row.quiz_instance[0] : row.quiz_instance
    const quizRaw = instanceRaw && Array.isArray(instanceRaw.quiz) ? instanceRaw.quiz[0] : instanceRaw?.quiz
    const groupRaw = instanceRaw && Array.isArray(instanceRaw.group) ? instanceRaw.group[0] : instanceRaw?.group

    return {
      id: row.id,
      status: row.status,
      created_at: row.created_at,
      quiz_instance: instanceRaw
        ? {
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
          }
        : null,
    }
  })

  return {
    props: {
      assignments,
    },
  }
}

export default StudentQuizzesIndex
