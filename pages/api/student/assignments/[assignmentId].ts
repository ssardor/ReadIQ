import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseServer } from '@/lib/supabaseServer'
import { requireStudentApi } from '@/utils/apiAuth'
import { trackEvent } from '@/utils/telemetry'

function normalizeRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  if (Array.isArray(value)) return value[0] ?? null
  return value
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const student = await requireStudentApi(req, res)
  if (!student) return

  const { assignmentId } = req.query
  if (!assignmentId || typeof assignmentId !== 'string') {
    return res.status(400).json({ message: 'Invalid assignment id' })
  }

  const { data: assignmentRow, error: assignmentError } = await supabaseServer
    .from('quiz_assignments')
    .select(
      'id,status,created_at,notified_at,completed_at,quiz_instance:quiz_instances(id,status,scheduled_at,quiz_id,duration_seconds,quiz:quizzes(id,title,description),group:groups(id,name,term))'
    )
    .eq('id', assignmentId)
    .eq('student_id', student.id)
    .maybeSingle()

  if (assignmentError) {
    return res.status(500).json({ message: 'Failed to load assignment', error: assignmentError.message })
  }
  if (!assignmentRow) {
    return res.status(404).json({ message: 'Assignment not found' })
  }

  const quizInstance = normalizeRelation(assignmentRow.quiz_instance)
  if (!quizInstance) {
    return res.status(500).json({ message: 'Assignment missing quiz instance' })
  }

  const quiz = normalizeRelation(quizInstance.quiz)
  const group = normalizeRelation(quizInstance.group)

  if (req.method === 'GET') {
    if (!quiz) {
      return res.status(500).json({ message: 'Quiz metadata unavailable' })
    }

    const { data: questions, error: questionsError } = await supabaseServer
      .from('questions')
      .select('id,text,choices,correct_indexes')
      .eq('quiz_id', quiz.id)
      .order('created_at', { ascending: true })

    if (questionsError) {
      return res.status(500).json({ message: 'Failed to fetch quiz questions', error: questionsError.message })
    }

    const { data: attempts, error: attemptsError } = await supabaseServer
      .from('attempts')
      .select('id,score,submitted_at,answers,duration_seconds')
      .eq('quiz_instance_id', quizInstance.id)
      .eq('student_id', student.id)
      .order('submitted_at', { ascending: false })
      .limit(1)

    if (attemptsError) {
      return res.status(500).json({ message: 'Failed to load attempts', error: attemptsError.message })
    }

    const attempt = attempts?.[0] ?? null

    const revealAnswers = attempt || assignmentRow.status === 'completed'
    const sanitizedQuestions = (questions ?? []).map((question) => (
      revealAnswers
        ? question
        : { id: question.id, text: question.text, choices: question.choices }
    ))

    return res.status(200).json({
      assignment: {
        id: assignmentRow.id,
        status: assignmentRow.status,
        created_at: assignmentRow.created_at,
        notified_at: assignmentRow.notified_at,
        completed_at: assignmentRow.completed_at,
        quiz_instance: {
          id: quizInstance.id,
          status: quizInstance.status,
          scheduled_at: quizInstance.scheduled_at,
          duration_seconds: quizInstance.duration_seconds,
          quiz: quiz,
          group,
        },
      },
      questions: sanitizedQuestions,
      attempt,
    })
  }

  if (req.method === 'POST') {
    if (assignmentRow.status === 'completed') {
      return res.status(400).json({ message: 'Assignment already completed' })
    }

    const { answers, durationSeconds } = req.body || {}
    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ message: 'Answers are required' })
    }

    const { data: questions, error: questionsError } = await supabaseServer
      .from('questions')
      .select('id,correct_indexes')
      .eq('quiz_id', quizInstance.quiz_id)

    if (questionsError) {
      return res.status(500).json({ message: 'Failed to load quiz questions', error: questionsError.message })
    }

    const answerMap = new Map<string, number[]>()
    for (const entry of answers) {
      if (!entry || typeof entry.questionId !== 'string' || !Array.isArray(entry.selectedIndexes)) continue
      const normalized = entry.selectedIndexes
        .map((value: number) => Number.isInteger(value) ? Number(value) : NaN)
        .filter((value: number) => !Number.isNaN(value))
        .sort((a: number, b: number) => a - b)
      answerMap.set(entry.questionId, normalized)
    }

    let correctCount = 0
    const detailedResults: { questionId: string; correctIndexes: number[]; selectedIndexes: number[]; isCorrect: boolean }[] = []

    for (const question of questions ?? []) {
      const expected = (question.correct_indexes ?? []).slice().sort((a: number, b: number) => a - b)
      const selected = answerMap.get(question.id) ?? []
      const isCorrect = expected.length === selected.length && expected.every((value: number, idx: number) => value === selected[idx])
      if (isCorrect) correctCount += 1
      detailedResults.push({
        questionId: question.id,
        correctIndexes: expected,
        selectedIndexes: selected,
        isCorrect,
      })
    }

    const totalQuestions = questions?.length ?? 0
    if (!totalQuestions) {
      return res.status(400).json({ message: 'Quiz has no questions configured' })
    }

    const score = correctCount / totalQuestions

    const { data: attemptRow, error: attemptError } = await supabaseServer
      .from('attempts')
      .insert([
        {
          quiz_instance_id: quizInstance.id,
          student_id: student.id,
          answers,
          score,
          duration_seconds: typeof durationSeconds === 'number' ? durationSeconds : null,
        },
      ])
      .select('id,score,submitted_at,answers,duration_seconds')
      .single()

    if (attemptError) {
      return res.status(500).json({ message: 'Failed to record attempt', error: attemptError.message })
    }

    const { error: updateError } = await supabaseServer
      .from('quiz_assignments')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', assignmentRow.id)
      .eq('student_id', student.id)

    if (updateError) {
      return res.status(500).json({ message: 'Failed to update assignment status', error: updateError.message })
    }

    await trackEvent(student.id, 'quiz_attempt_submitted', {
      assignment_id: assignmentRow.id,
      quiz_instance_id: quizInstance.id,
      score,
    })

    return res.status(200).json({
      score,
      correctCount,
      totalQuestions,
      attempt: attemptRow,
      results: detailedResults,
    })
  }

  return res.status(405).json({ message: 'Method not allowed' })
}
