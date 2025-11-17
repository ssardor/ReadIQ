import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Head from 'next/head'
import type { GetServerSideProps } from 'next'
import { requireStudent } from '@/utils/roleGuard'
import { supabaseServer } from '@/lib/supabaseServer'
import { useToasts } from '@/components/ToastProvider'
import { BackButton } from '@/components/BackButton'

interface QuizChoiceQuestion {
  id: string
  text: string
  choices: string[]
  correct_indexes?: number[]
}

interface AssignmentMeta {
  id: string
  status: string
  created_at: string
  notified_at?: string | null
  completed_at?: string | null
  quiz_instance: {
    id: string
    status: string
    scheduled_at: string | null
    duration_seconds?: number | null
    quiz: {
      id: string
      title: string
      description?: string | null
    } | null
    group: {
      id: string
      name: string
      term?: string | null
    } | null
  }
}

interface AttemptSummary {
  id: string
  score: number
  submitted_at: string
  answers: Array<{ questionId: string; selectedIndexes: number[] }>
  duration_seconds?: number | null
}

interface AssignmentPayload {
  assignment: AssignmentMeta
  questions: QuizChoiceQuestion[]
  attempt: AttemptSummary | null
}

interface SubmissionResult {
  score: number
  correctCount: number
  totalQuestions: number
  results: Array<{ questionId: string; correctIndexes: number[]; selectedIndexes: number[]; isCorrect: boolean }>
  attempt: AttemptSummary | null
  autoFailed?: boolean
}

interface PageProps {
  assignmentId: string
}

const StudentQuizPage: React.FC<PageProps> = ({ assignmentId }) => {
  const { push } = useToasts()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [payload, setPayload] = useState<AssignmentPayload | null>(null)
  const [submission, setSubmission] = useState<SubmissionResult | null>(null)
  const [selected, setSelected] = useState<Record<string, number[]>>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null)
  const autoFailTriggered = useRef(false)
  const startedAtRef = useRef<number>(Date.now())

  const assignment = payload?.assignment
  const questions = useMemo(() => payload?.questions ?? [], [payload])
  const attempt = payload?.attempt
  const showResults = Boolean(submission || attempt)
  const attemptSummary = submission?.attempt ?? attempt ?? null
  const submittedAt = attemptSummary?.submitted_at ? new Date(attemptSummary.submitted_at) : null
  const correctAnswers = submission?.correctCount ?? 0
  const totalQuestionsCount = submission?.totalQuestions ?? questions.length
  const displayedScore = submission?.score ?? attemptSummary?.score ?? 0
  const currentQuestion = questions[currentIndex]
  const answeredCurrent = currentQuestion ? ((selected[currentQuestion.id]?.length ?? 0) > 0) : false
  const quizDuration = useMemo(() => {
    if (assignment?.quiz_instance.duration_seconds && assignment.quiz_instance.duration_seconds > 0) {
      return assignment.quiz_instance.duration_seconds
    }
    if (questions.length) {
      return Math.max(1, questions.length) * 60
    }
    return null
  }, [assignment?.quiz_instance.duration_seconds, questions.length])

  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/student/assignments/${assignmentId}`, { signal: controller.signal })
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}))
          throw new Error(payload?.message || 'Не удалось загрузить квиз')
        }
        const data: AssignmentPayload = await response.json()
        setPayload(data)

        if (data.attempt) {
          const answerMap: Record<string, number[]> = {}
          data.attempt.answers?.forEach((entry: any) => {
            if (entry?.questionId && Array.isArray(entry.selectedIndexes)) {
              answerMap[entry.questionId] = entry.selectedIndexes
            }
          })
          setSelected(answerMap)

          if (data.questions.some((q) => Array.isArray(q.correct_indexes))) {
            const results = data.questions.map((question) => {
              const correct = (question.correct_indexes ?? []).slice().sort((a, b) => a - b)
              const chosen = (answerMap[question.id] ?? []).slice().sort((a, b) => a - b)
              const isCorrect = correct.length === chosen.length && correct.every((value, idx) => value === chosen[idx])
              return { questionId: question.id, correctIndexes: correct, selectedIndexes: chosen, isCorrect }
            })
            const correctCount = results.filter((item) => item.isCorrect).length
            setSubmission({
              score: data.attempt.score,
              correctCount,
              totalQuestions: data.questions.length,
              results,
              attempt: data.attempt,
            })
          }
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          push(error?.message || 'Ошибка при загрузке квиза', 'error')
        }
      } finally {
        setLoading(false)
        startedAtRef.current = Date.now()
        setCurrentIndex(0)
        autoFailTriggered.current = false
      }
    }
    load()
    return () => controller.abort()
  }, [assignmentId, push])

  useEffect(() => {
    if (attempt || submission) {
      setRemainingSeconds(null)
      return
    }
    if (!questions.length) return
    setRemainingSeconds(quizDuration)
  }, [attempt, submission, questions.length, quizDuration])

  useEffect(() => {
    if (remainingSeconds == null) return
    if (attempt || submission || submitting) return
    if (remainingSeconds <= 0) {
      setRemainingSeconds(0)
      return
    }
    const id = window.setInterval(() => {
      setRemainingSeconds((prev) => (prev == null || prev <= 0 ? 0 : prev - 1))
    }, 1000)
    return () => window.clearInterval(id)
  }, [remainingSeconds, attempt, submission, submitting])

  const handleToggle = (questionId: string, index: number) => {
    if (attempt || submission) return
    setSelected((prev) => {
      const existing = prev[questionId] ? [...prev[questionId]] : []
      const next = existing.includes(index)
        ? existing.filter((value) => value !== index)
        : [...existing, index]
      next.sort((a, b) => a - b)
      return { ...prev, [questionId]: next }
    })
  }

  const allAnswered = useMemo(() => {
    if (!questions.length) return false
    return questions.every((question) => (selected[question.id]?.length ?? 0) > 0)
  }, [questions, selected])

  const nextDisabled = !answeredCurrent

  const formatTime = (seconds: number | null) => {
    if (seconds == null) return '—'
    const safe = Math.max(0, seconds)
    const minutes = Math.floor(safe / 60)
    const secs = safe % 60
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const handleNext = () => {
    if (!currentQuestion) return
    if (nextDisabled) {
      push('Сначала выберите ответ', 'info')
      return
    }
    setCurrentIndex((index) => Math.min(index + 1, questions.length - 1))
  }

  const handlePrevious = () => {
    setCurrentIndex((index) => Math.max(index - 1, 0))
  }

  const submitAnswers = useCallback(async (options?: { autoFailed?: boolean }) => {
    if (!assignment) return
    if (attempt || submission) return
    if (!questions.length) {
      push('В квизе нет вопросов', 'error')
      return
    }

    setSubmitting(true)
    try {
      const durationSeconds = Math.round((Date.now() - startedAtRef.current) / 1000)
      const answers = questions.map((question) => ({
        questionId: question.id,
        selectedIndexes: selected[question.id] ?? [],
      }))

      const response = await fetch(`/api/student/assignments/${assignmentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, durationSeconds, autoFailed: Boolean(options?.autoFailed) }),
      })

      const json = await response.json()
      if (!response.ok) throw new Error(json?.message || 'Не удалось отправить ответы')

      if (options?.autoFailed) {
        push('Время истекло — попытка завершена с результатом 0%.', 'error')
      } else {
        push('Ответы отправлены', 'success')
      }

      setCurrentIndex(0)

      setSubmission({
        score: json.score,
        correctCount: json.correctCount,
        totalQuestions: json.totalQuestions,
        results: json.results,
        attempt: json.attempt ?? null,
        autoFailed: Boolean(json.autoFailed),
      })
      setPayload((prev) => (
        prev
          ? {
              ...prev,
              assignment: { ...prev.assignment, status: 'completed', completed_at: new Date().toISOString() },
              attempt: json.attempt,
              questions: prev.questions.map((question) => {
                const result = json.results.find((item: any) => item.questionId === question.id)
                return {
                  ...question,
                  correct_indexes: result?.correctIndexes ?? question.correct_indexes,
                }
              }),
            }
          : prev
      ))
    } catch (error: any) {
      push(error?.message || 'Ошибка при отправке ответов', 'error')
    } finally {
      setSubmitting(false)
    }
  }, [assignment, attempt, submission, questions, selected, push, assignmentId])

  const handleAutoFail = useCallback(() => {
    submitAnswers({ autoFailed: true })
  }, [submitAnswers])

  useEffect(() => {
    if (attempt || submission) return
    if (remainingSeconds !== 0) return
    if (!questions.length) return
    if (autoFailTriggered.current) return
    if (submitting) return
    autoFailTriggered.current = true
    handleAutoFail()
  }, [attempt, submission, remainingSeconds, questions.length, submitting, handleAutoFail])

  const handleSubmit = async () => {
    if (!allAnswered) {
      push('Ответьте на все вопросы, прежде чем отправлять квиз', 'info')
      return
    }
    submitAnswers()
  }

  const renderStatusBadge = () => {
    const status = submission || attempt ? 'completed' : assignment?.status
    switch (status) {
      case 'completed':
        return <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">Завершён</span>
      case 'assigned':
      case 'notified':
        return <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">Назначен</span>
      default:
        return <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">{status}</span>
    }
  }

  return (
    <>
      <Head>
        <title>Квиз • ReadIQ</title>
      </Head>
      <div className="mx-auto max-w-5xl px-6 py-6">
        <BackButton href="/dashboard" className="mb-4" />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{assignment?.quiz_instance.quiz?.title || 'Квиз'}</h1>
            <p className="text-sm text-gray-500">Группа: {assignment?.quiz_instance.group?.name || '—'}</p>
          </div>
          <div className="flex items-center gap-2">
            {renderStatusBadge()}
          </div>
        </div>

        {!showResults && !attempt && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
            <div className="font-medium">
              Вопрос {currentIndex + 1} из {questions.length || 1}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wide text-gray-500">Оставшееся время</span>
              <span className={`rounded px-3 py-1 text-sm font-semibold ${remainingSeconds !== null && remainingSeconds <= 30 ? 'bg-red-100 text-red-700' : 'bg-white text-gray-900'}`}>
                {formatTime(remainingSeconds ?? quizDuration ?? 0)}
              </span>
            </div>
          </div>
        )}

        {assignment?.quiz_instance.quiz?.description && (
          <p className="mt-3 text-sm text-gray-600">{assignment.quiz_instance.quiz.description}</p>
        )}

        {loading ? (
          <div className="mt-10 text-gray-500">Загрузка вопросов…</div>
        ) : (
          <div className="mt-8 space-y-6">
            {questions.length === 0 && (
              <div className="rounded border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-gray-500">В этом квизе пока нет вопросов.</div>
            )}

            {!showResults && currentQuestion && (
              <div key={currentQuestion.id} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-500">Вопрос {currentIndex + 1}</span>
                </div>
                <p className="text-base font-medium text-gray-900">{currentQuestion.text}</p>
                <ul className="mt-4 space-y-3">
                  {currentQuestion.choices.map((choice, idx) => {
                    const selectedIndexes = selected[currentQuestion.id] ?? []
                    const isSelected = selectedIndexes.includes(idx)

                    return (
                      <li
                        key={idx}
                        className={`flex items-center gap-3 rounded border px-3 py-2 text-sm ${
                          isSelected ? 'border-primary-200 bg-primary-50 text-primary-800' : 'border-gray-200 text-gray-700'
                        }`}
                      >
                        <label className="flex w-full cursor-pointer items-center gap-3">
                          <input
                            type="checkbox"
                            disabled={Boolean(submission || attempt)}
                            checked={isSelected}
                            onChange={() => handleToggle(currentQuestion.id, idx)}
                            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="flex-1">{choice}</span>
                        </label>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

            {showResults && questions.map((question, questionIndex) => {
              const selectedIndexes = selected[question.id] ?? []
              const breakdown = submission?.results.find((item) => item.questionId === question.id)
              const correctIndexes = question.correct_indexes ?? []

              return (
                <div key={question.id} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-500">Вопрос {questionIndex + 1}</span>
                    {breakdown && (
                      <span className={breakdown.isCorrect ? 'text-sm font-semibold text-green-600' : 'text-sm font-semibold text-red-600'}>
                        {breakdown.isCorrect ? 'Верно' : 'Неверно'}
                      </span>
                    )}
                  </div>
                  <p className="text-base font-medium text-gray-900">{question.text}</p>
                  <ul className="mt-4 space-y-3">
                    {question.choices.map((choice, idx) => {
                      const isSelected = selectedIndexes.includes(idx)
                      const isCorrect = breakdown ? breakdown.correctIndexes.includes(idx) : correctIndexes.includes(idx)

                      return (
                        <li
                          key={idx}
                          className={`flex items-center gap-3 rounded border px-3 py-2 text-sm ${
                            isCorrect
                              ? 'border-green-200 bg-green-50 text-green-800'
                              : isSelected
                                ? 'border-primary-200 bg-primary-50 text-primary-800'
                                : 'border-gray-200 text-gray-700'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-semibold ${isSelected ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                              {String.fromCharCode(65 + idx)}
                            </span>
                            <span className="flex-1">{choice}</span>
                          </div>
                        </li>
                      )}
                    )}
                  </ul>
                </div>
              )
            })}
          </div>
        )}

        {!loading && !attempt && !submission && questions.length > 0 && currentQuestion && !showResults && (
          <div className="mt-8 flex flex-col gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-gray-500">Ответы можно менять до отправки. Отметьте все подходящие варианты и переходите к следующему вопросу.</div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handlePrevious}
                disabled={currentIndex === 0 || submitting}
                className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Назад
              </button>
              {currentIndex < questions.length - 1 ? (
                <button
                  onClick={handleNext}
                  disabled={submitting || nextDisabled}
                  className="rounded bg-primary-600 px-5 py-2 text-sm font-medium text-white shadow hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Далее
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !allAnswered}
                  className="rounded bg-primary-600 px-5 py-2 text-sm font-medium text-white shadow hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? 'Отправка…' : 'Отправить квиз'}
                </button>
              )}
            </div>
          </div>
        )}

        {showResults && (
          <div className="mt-10 rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Результат</h2>
            <div className="mt-3 text-sm text-gray-700">
              <p>Ответы отправлены: {submittedAt ? submittedAt.toLocaleString() : '—'}</p>
              <p>Правильных ответов: {correctAnswers} из {totalQuestionsCount}</p>
              <p>Итоговый балл: {(displayedScore * 100).toFixed(0)}%</p>
              {submission?.autoFailed && (
                <p className="mt-2 text-sm font-semibold text-red-600">Попытка завершена автоматически из-за истечения времени.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const student = await requireStudent(ctx)
  if ('redirect' in student) return student as any

  const { assignmentId } = ctx.params ?? {}
  if (typeof assignmentId !== 'string') {
    return { notFound: true }
  }

  const { data: assignment, error } = await supabaseServer
    .from('quiz_assignments')
    .select('id')
    .eq('id', assignmentId)
    .eq('student_id', student.user.id)
    .maybeSingle()

  if (error || !assignment) {
    return { notFound: true }
  }

  return {
    props: {
      assignmentId,
    },
  }
}

export default StudentQuizPage
