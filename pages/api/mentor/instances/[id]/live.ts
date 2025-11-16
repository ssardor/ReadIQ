import type { NextApiRequest, NextApiResponse } from 'next'
import { requireMentorApi } from '@/utils/apiAuth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const mentor = await requireMentorApi(req, res)
  if (!mentor) return
  const { id } = req.query
  if (!id || typeof id !== 'string') return res.status(400).json({ message: 'Invalid instance id' })
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' })

  // Stub realtime/live response
  const now = Date.now()
  return res.status(200).json({
    instance_id: id,
    status: 'active',
    time_left_seconds: 420,
    students_total: 24,
    students_completed: 7,
    avg_score: 66.4,
    by_question: [
      { question_id: 'q1', correct_percent: 58, option_counts: [5,10,6,3] },
      { question_id: 'q2', correct_percent: 71, option_counts: [8,12,2,2] }
    ],
    recent_events: [
      { t: new Date(now - 5000).toISOString(), student_id: 's1', event: 'submitted', score: 80 },
      { t: new Date(now - 2000).toISOString(), student_id: 's3', event: 'answered', q: 'q2', choice: 1 }
    ]
  })
}
