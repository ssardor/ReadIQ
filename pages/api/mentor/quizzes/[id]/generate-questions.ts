import type { NextApiRequest, NextApiResponse } from 'next'
import { requireMentorApi } from '@/utils/apiAuth'

// Stub endpoint that would call AI later; returns mock candidate questions.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const mentor = await requireMentorApi(req, res)
  if (!mentor) return
  const { id } = req.query
  if (!id || typeof id !== 'string') return res.status(400).json({ message: 'Invalid quiz id' })

  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' })

  const { presentation_id } = req.body || {}
  // Simple mock
  const candidates = Array.from({ length: 8 }).map((_, i) => ({
    text: `Auto question #${i + 1} for presentation ${presentation_id || 'N/A'}`,
    choices: ['Option A','Option B','Option C','Option D'],
    correct_indexes: [0],
    difficulty: ['easy','medium','hard'][i % 3],
    source_slide_index: i + 1
  }))
  return res.status(200).json({ quiz_id: id, presentation_id, candidates })
}
