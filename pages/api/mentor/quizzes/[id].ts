import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseServer } from '@/lib/supabaseServer'
import { requireMentorApi } from '@/utils/apiAuth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const mentor = await requireMentorApi(req, res)
  if (!mentor) return
  const { id } = req.query
  if (!id || typeof id !== 'string') return res.status(400).json({ message: 'Invalid id' })

  if (req.method === 'GET') {
    const { data: quiz, error } = await supabaseServer
      .from('quizzes')
      .select('id,title,description,is_template,created_at,updated_at,creator_id')
      .eq('id', id)
      .eq('creator_id', mentor.id)
      .single()
    if (error || !quiz) return res.status(404).json({ message: 'Quiz not found' })

    const { creator_id: _creatorId, ...quizData } = quiz

    const { data: questions, error: qErr } = await supabaseServer
      .from('questions')
      .select('id,text,choices,correct_indexes,source_slide_index,difficulty')
      .eq('quiz_id', id)
      .order('created_at', { ascending: true })
    if (qErr) return res.status(500).json({ message: 'Failed to fetch questions', error: qErr.message })

    const { data: instances, error: instErr } = await supabaseServer
      .from('quiz_instances')
      .select('id,group_id,scheduled_at,status,duration_seconds,group:groups(id,name,term)')
      .eq('quiz_id', id)
      .order('scheduled_at', { ascending: true, nullsFirst: true })
    if (instErr) return res.status(500).json({ message: 'Failed to fetch quiz instances', error: instErr.message })

    return res.status(200).json({ quiz: quizData, questions, instances })
  }

  if (req.method === 'PATCH') {
    const { title, description } = req.body || {}
    const { data, error } = await supabaseServer
      .from('quizzes')
      .update({ title, description })
      .eq('id', id)
      .eq('creator_id', mentor.id)
      .select()
      .single()
    if (error) return res.status(500).json({ message: 'Failed to update quiz', error: error.message })
    const { creator_id: _creatorId, ...quizData } = data
    return res.status(200).json({ quiz: quizData })
  }

  if (req.method === 'DELETE') {
    // soft delete by setting is_template false & description appended (simple approach)
    const { error } = await supabaseServer
      .from('quizzes')
      .update({ is_template: false, description: 'ARCHIVED' })
      .eq('id', id)
      .eq('creator_id', mentor.id)
    if (error) return res.status(500).json({ message: 'Failed to archive quiz', error: error.message })
    return res.status(204).end()
  }

  return res.status(405).json({ message: 'Method not allowed' })
}
