import type { NextApiRequest, NextApiResponse } from 'next'
import { addStudentsToGroup } from '@/lib/server/addStudentsToGroup'
import { requireMentorApi } from '@/utils/apiAuth'

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 10

const rateLimiter = new Map<string, { count: number; resetAt: number }>()

function enforceRateLimit(userId: string) {
  const now = Date.now()
  const entry = rateLimiter.get(userId)

  if (!entry || entry.resetAt < now) {
    rateLimiter.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    const error = new Error('Too many requests, please retry later') as Error & { status?: number; retryAfter?: number }
    error.status = 429
    error.retryAfter = Math.max(retryAfter, 1)
    throw error
  }

  entry.count += 1
  rateLimiter.set(userId, entry)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const mentor = await requireMentorApi(req, res)
  if (!mentor) return

  const { groupId } = req.query
  if (typeof groupId !== 'string' || !groupId) {
    return res.status(400).json({ message: 'Invalid group id' })
  }

  try {
    enforceRateLimit(mentor.id)
  } catch (err: any) {
    if (err.status === 429) {
      if (err.retryAfter) {
        res.setHeader('Retry-After', String(err.retryAfter))
      }
      return res.status(429).json({ message: err.message })
    }
    throw err
  }

  const { emails } = req.body ?? {}
  if (!Array.isArray(emails)) {
    return res.status(400).json({ message: 'Body must include emails: string[]' })
  }

  try {
    const response = await addStudentsToGroup(groupId, emails, mentor.id)
    return res.status(200).json(response)
  } catch (error: any) {
    const status = error?.status ?? 500
    const payload: Record<string, any> = { message: error?.message ?? 'Internal server error' }
    if (process.env.DEBUG === 'true') {
      payload.details = error
    }
    return res.status(status).json(payload)
  }
}
