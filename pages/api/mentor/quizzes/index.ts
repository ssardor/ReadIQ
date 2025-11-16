import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseServer } from '@/lib/supabaseServer'
import { requireMentorApi } from '@/utils/apiAuth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const mentor = await requireMentorApi(req, res)
  if (!mentor) return

  if (req.method === 'GET') {
    const { status, search } = req.query
    let query = supabaseServer.from('quizzes').select('id,title,description,is_template,created_at,updated_at').eq('creator_id', mentor.id)
    if (search) query = query.ilike('title', `%${search}%`)
    const { data, error } = await query
    if (error) return res.status(500).json({ message: 'Failed to fetch quizzes', error: error.message })
    return res.status(200).json({ quizzes: data })
  }

  if (req.method === 'POST') {
    const { title, description, presentation_id, questions } = req.body || {}
    if (!title) return res.status(400).json({ message: 'Title is required' })
    const { data: quiz, error } = await supabaseServer.from('quizzes').insert([
      { title, description: description || null, presentation_id: presentation_id || null, creator_id: mentor.id, is_template: true }
    ]).select().single()
    if (error || !quiz) return res.status(500).json({ message: 'Failed to create quiz', error: error?.message })

    if (Array.isArray(questions) && questions.length) {
      const payload = questions.map((q: any) => ({
        quiz_id: quiz.id,
        text: q.text,
        choices: q.choices ?? [],
        correct_indexes: q.correct_indexes ?? [0],
        source_slide_index: q.source_slide_index ?? null,
        difficulty: q.difficulty ?? null,
      }))
      const { error: qErr } = await supabaseServer.from('questions').insert(payload)
      if (qErr) return res.status(500).json({ message: 'Quiz created but failed to add questions', error: qErr.message, quiz })
    }

    return res.status(201).json({ quiz })
  }

  return res.status(405).json({ message: 'Method not allowed' })
}
