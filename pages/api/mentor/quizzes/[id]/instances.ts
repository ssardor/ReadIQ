import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseServer } from '@/lib/supabaseServer'
import { requireMentorApi } from '@/utils/apiAuth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const mentor = await requireMentorApi(req, res)
  if (!mentor) return
  const { id } = req.query
  if (!id || typeof id !== 'string') return res.status(400).json({ message: 'Invalid quiz id' })

  if (req.method === 'POST') {
    const { group_id, scheduled_at, duration_seconds, status } = req.body || {}
    if (!group_id) return res.status(400).json({ message: 'group_id is required' })
    const { data, error } = await supabaseServer
      .from('quiz_instances')
      .insert([
      {
        quiz_id: id,
        group_id,
        scheduled_at: scheduled_at || null,
        duration_seconds: duration_seconds || 300,
          status: status || 'scheduled'
      }
      ])
      .select()
      .single()
    if (error) return res.status(500).json({ message: 'Failed to create instance', error: error.message })

    const { data: students, error: studentsError } = await supabaseServer
      .from('group_students')
      .select('student_id')
      .eq('group_id', group_id)
      .eq('status', 'active')

    if (studentsError) {
      console.error('Failed to load group students for assignment', studentsError)
    }

    if (students?.length) {
      const assignmentsPayload = students.map((student) => ({
        quiz_instance_id: data.id,
        student_id: student.student_id,
        status: 'assigned',
        assignment_source: 'quiz_creation',
      }))

      const { error: assignmentError } = await supabaseServer
        .from('quiz_assignments')
        .upsert(assignmentsPayload, { onConflict: 'quiz_instance_id,student_id', ignoreDuplicates: false })

      if (assignmentError) {
        console.error('Failed to create assignments for quiz instance', assignmentError)
      }
    }

    return res.status(201).json({ instance: data })
  }

  return res.status(405).json({ message: 'Method not allowed' })
}
