import React, { useCallback, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import type { GetServerSideProps } from 'next'
import { requireMentor } from '@/utils/roleGuard'
import { supabaseServer } from '@/lib/supabaseServer'
import { useToasts } from '@/components/ToastProvider'
import type { Quiz } from '@/lib/types'
import { BackButton } from '@/components/BackButton'
import { useTranslation } from '@/components/SettingsProvider'

interface QuizQuestion {
  id: string
  text: string
  choices: string[]
  correct_indexes: number[]
  source_slide_index: number | null
  difficulty?: string | null
}

interface QuizInstance {
  id: string
  group_id: string
  scheduled_at: string | null
  status: string
  duration_seconds: number | null
  group: {
    id: string
    name: string
    term: string | null
  } | null
}

type QuizDetailProps = {
  initialQuiz: Quiz
  initialQuestions: QuizQuestion[]
  initialInstances: QuizInstance[]
}

const formatDateTime = (value?: string | null) => {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString()
}

const formatDuration = (seconds?: number | null) => {
  if (!seconds) return '—'
  const mins = Math.round(seconds / 60)
  return mins >= 1 ? `${mins} min` : `${seconds} sec`
}

const MentorQuizDetail: React.FC<QuizDetailProps> = ({ initialQuiz, initialQuestions, initialInstances }) => {
  const router = useRouter()
  const { push } = useToasts()
  const t = useTranslation()

  const [quiz, setQuiz] = useState(initialQuiz)
  const [questions, setQuestions] = useState(initialQuestions)
  const [instances, setInstances] = useState(initialInstances)
  const [isEditing, setEditing] = useState(false)
  const [form, setForm] = useState({
    title: initialQuiz.title,
    description: initialQuiz.description ?? '',
  })
  const [isSaving, setSaving] = useState(false)
  const [isDeleting, setDeleting] = useState(false)
  const [isRefreshing, setRefreshing] = useState(false)

  const refreshData = useCallback(async () => {
    setRefreshing(true)
    try {
      const response = await fetch(`/api/mentor/quizzes/${quiz.id}`, { credentials: 'include' })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.message || t('Failed to refresh quiz data'))
      setQuiz(payload.quiz)
      setQuestions(payload.questions ?? [])
      setInstances(payload.instances ?? [])
      setForm({
        title: payload.quiz.title,
        description: payload.quiz.description ?? '',
      })
      push(t('Quiz data refreshed'), 'info')
    } catch (error: any) {
      push(error?.message || t('Error while refreshing quiz data'), 'error')
    } finally {
      setRefreshing(false)
    }
  }, [quiz.id, push, t])

  const handleSave = async () => {
    if (!form.title.trim()) {
      push(t('Quiz title is required'), 'error')
      return
    }
    setSaving(true)
    try {
      const response = await fetch(`/api/mentor/quizzes/${quiz.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title: form.title.trim(), description: form.description }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.message || t('Failed to update quiz'))
      setQuiz(payload.quiz)
      push(t('Quiz updated'), 'success')
      setEditing(false)
    } catch (error: any) {
      push(error?.message || t('Error while saving quiz'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(t('Archive this quiz? This action cannot be undone.'))) return
    setDeleting(true)
    try {
      const response = await fetch(`/api/mentor/quizzes/${quiz.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!response.ok && response.status !== 204) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.message || t('Failed to archive quiz'))
      }
      push(t('Quiz archived'), 'success')
      router.push('/mentor/quizzes')
    } catch (error: any) {
      push(error?.message || t('Error while archiving quiz'), 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <Head>
        <title>{quiz.title} • Mentor Quiz</title>
      </Head>
      <div className="mx-auto max-w-6xl px-6 py-6">
        <BackButton href="/mentor/quizzes" label={`← ${t('Back to quizzes')}`} className="mb-4" />
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{quiz.title}</h1>
            <p className="text-sm text-gray-500">
              {t('Created {{date}}', { date: new Date(quiz.created_at).toLocaleDateString() })} • {t('Updated {{date}}', { date: new Date(quiz.updated_at).toLocaleDateString() })}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={refreshData} disabled={isRefreshing} className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60">
              {isRefreshing ? t('Refreshing...') : t('Refresh')}
            </button>
            <button onClick={() => setEditing((prev) => !prev)} className="rounded border border-primary-200 px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50">
              {isEditing ? t('Cancel') : t('Edit')}
            </button>
            <button onClick={handleDelete} disabled={isDeleting} className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60">
              {isDeleting ? t('Archiving...') : t('Archive')}
            </button>
          </div>
        </div>

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">{t('Quiz information')}</h2>
            {!isEditing ? (
              <div className="mt-4 space-y-3 text-sm text-gray-700">
                <p>{quiz.description || t('No description provided')}</p>
                <div className="text-xs text-gray-500">{t('Template status')}: {quiz.is_template ? t('Active') : t('Disabled')}</div>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <label className="flex flex-col gap-1 text-sm text-gray-700">
                  <span>{t('Title')}</span>
                  <input value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} className="w-full rounded border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
                </label>
                <label className="flex flex-col gap-1 text-sm text-gray-700">
                  <span>{t('Description')}</span>
                  <textarea value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} rows={4} className="w-full rounded border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
                </label>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setEditing(false)} className="rounded border px-4 py-2 text-sm">{t('Cancel')}</button>
                  <button onClick={handleSave} disabled={isSaving} className="rounded bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60">
                    {isSaving ? t('Saving...') : t('Save')}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">{t('Linked groups')}</h2>
            {instances.length === 0 ? (
              <p className="mt-4 text-sm text-gray-500">{t('This quiz is not linked to any group yet. Create an assignment when scheduling an instance.')}</p>
            ) : (
              <ul className="mt-4 space-y-3 text-sm text-gray-700">
                {instances.map((instance) => (
                  <li key={instance.id} className="rounded border border-gray-200 p-3">
                    <div className="font-medium text-gray-900">{instance.group?.name || t('Unknown group')}</div>
                    <div className="text-xs text-gray-500">{t('Status')}: {instance.status} • {t('Slot')}: {formatDateTime(instance.scheduled_at)}</div>
                    <div className="text-xs text-gray-500">{t('Duration')}: {formatDuration(instance.duration_seconds)}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">{t('Question preview')}</h2>
            <span className="text-sm text-gray-500">{questions.length} {t('items')}</span>
          </div>
          <div className="mt-3 space-y-4">
            {questions.length === 0 && <div className="rounded border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-500">{t('This quiz has no questions yet.')}</div>}
            {questions.map((question, index) => {
              const correctSet = new Set(question.correct_indexes)
              return (
                <div key={question.id} className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
                  <div className="mb-3 flex items-center justify-between text-sm text-gray-500">
                    <span>{t('Question')} {index + 1}</span>
                    <span>
                      {t('Difficulty')}: {question.difficulty || '—'}
                      {typeof question.source_slide_index === 'number' && (
                        <span className="ml-2">{t('Slide')} #{question.source_slide_index + 1}</span>
                      )}
                    </span>
                  </div>
                  <p className="text-base font-medium text-gray-900">{question.text}</p>
                  <ul className="mt-4 space-y-2">
                    {question.choices.map((choice, choiceIndex) => (
                      <li key={choiceIndex} className={`flex items-start gap-3 rounded border px-3 py-2 text-sm ${correctSet.has(choiceIndex) ? 'border-green-300 bg-green-50 text-green-800' : 'border-gray-200 text-gray-700'}`}>
                        <span className="font-semibold">{String.fromCharCode(65 + choiceIndex)}.</span>
                        <span>{choice}</span>
                        {correctSet.has(choiceIndex) && <span className="ml-auto text-xs font-semibold uppercase text-green-700">Correct</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </>
  )
}

export const getServerSideProps: GetServerSideProps<QuizDetailProps> = async (ctx) => {
  const mentor = await requireMentor(ctx)
  if ('redirect' in mentor) return mentor as any

  const { quizId } = ctx.params ?? {}
  if (typeof quizId !== 'string') {
    return { notFound: true }
  }

  const { data: quiz, error: quizError } = await supabaseServer
    .from('quizzes')
    .select('id,title,description,is_template,created_at,updated_at,creator_id')
    .eq('id', quizId)
    .single()

  if (quizError || !quiz || quiz.creator_id !== mentor.user.id) {
    return { notFound: true }
  }

  const { creator_id: _creatorId, ...quizData } = quiz

  const [{ data: questions, error: questionError }, { data: instances, error: instanceError }] = await Promise.all([
    supabaseServer
      .from('questions')
      .select('id,text,choices,correct_indexes,source_slide_index,difficulty')
      .eq('quiz_id', quizId)
      .order('created_at', { ascending: true }),
    supabaseServer
      .from('quiz_instances')
      .select('id,group_id,scheduled_at,status,duration_seconds,group:groups(id,name,term)')
      .eq('quiz_id', quizId)
      .order('scheduled_at', { ascending: true, nullsFirst: true }),
  ])

  if (questionError) {
    console.error('Failed to load questions for quiz', quizId, questionError)
  }
  if (instanceError) {
    console.error('Failed to load quiz instances for quiz', quizId, instanceError)
  }

  return {
    props: {
      initialQuiz: quizData,
      initialQuestions: questions ?? [],
      initialInstances: instances ?? [],
    },
  }
}

export default MentorQuizDetail
