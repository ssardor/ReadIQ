import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseServer } from '@/lib/supabaseServer'
import { requireMentorApi } from '@/utils/apiAuth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const mentor = await requireMentorApi(req, res)
  if (!mentor) return

  if (req.method === 'GET') {
    const { term, search } = req.query
    let query = supabaseServer.from('groups').select('id,name,term,capacity,is_archived,created_at')
      .eq('teacher_id', mentor.id)
    if (term) query = query.eq('term', term as string)
    if (search) query = query.ilike('name', `%${search}%`)
    const { data, error } = await query
    if (error) return res.status(500).json({ message: 'Failed to fetch groups', error: error.message })
    return res.status(200).json({ groups: data })
  }

  if (req.method === 'POST') {
    const { name, term, course_id, capacity } = req.body || {}
    if (!name) return res.status(400).json({ message: 'Name is required' })
    const { data, error } = await supabaseServer.from('groups').insert([
      { name, term: term || null, course_id: course_id || null, teacher_id: mentor.id, capacity: capacity || null }
    ]).select().single()
    if (error) return res.status(500).json({ message: 'Failed to create group', error: error.message })
    return res.status(201).json({ group: data })
  }

  return res.status(405).json({ message: 'Method not allowed' })
}
