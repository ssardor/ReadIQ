import type { NextApiRequest, NextApiResponse } from 'next'
import { requireMentorApi } from '@/utils/apiAuth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const mentor = await requireMentorApi(req, res)
  if (!mentor) return
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' })

  // Stub analytics payload
  return res.status(200).json({
    kpis: {
      avg_comprehension: 72,
      completion_rate: 0.86,
      at_risk: 4,
      quizzes_total: 12,
    },
    charts: {
      distribution: [
        { bucket: '0-20', count: 2 },
        { bucket: '20-40', count: 5 },
        { bucket: '40-60', count: 8 },
        { bucket: '60-80', count: 10 },
        { bucket: '80-100', count: 6 },
      ],
      trend: [
        { date: '2025-10-15', avg: 61 },
        { date: '2025-10-22', avg: 65 },
        { date: '2025-10-29', avg: 68 },
        { date: '2025-11-05', avg: 71 },
      ]
    }
  })
}
