import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseServer } from '@/lib/supabaseServer'

export type ApiUser = {
  id: string
  email?: string
  role?: string
  user_metadata?: Record<string, any>
}

export async function requireMentorApi(req: NextApiRequest, res: NextApiResponse): Promise<ApiUser | null> {
  try {
    const token = req.cookies['sb-access-token']
    if (!token) {
      res.status(401).json({ message: 'Unauthorized: no token' })
      return null
    }
    const { data: { user }, error } = await supabaseServer.auth.getUser(token)
    if (error || !user) {
      res.status(401).json({ message: 'Unauthorized' })
      return null
    }
    const role = (user.user_metadata as any)?.role
    if (role !== 'mentor') {
      res.status(403).json({ message: 'Forbidden: mentor role required' })
      return null
    }
    return { id: user.id, email: user.email ?? undefined, role, user_metadata: user.user_metadata }
  } catch (e: any) {
    console.error('requireMentorApi error', e)
    res.status(500).json({ message: 'Internal server error' })
    return null
  }
}

export async function requireStudentApi(req: NextApiRequest, res: NextApiResponse): Promise<ApiUser | null> {
  try {
    const token = req.cookies['sb-access-token']
    if (!token) {
      res.status(401).json({ message: 'Unauthorized: no token' })
      return null
    }
    const { data: { user }, error } = await supabaseServer.auth.getUser(token)
    if (error || !user) {
      res.status(401).json({ message: 'Unauthorized' })
      return null
    }
    const role = (user.user_metadata as any)?.role
    if (role !== 'student') {
      res.status(403).json({ message: 'Forbidden: student role required' })
      return null
    }
    return { id: user.id, email: user.email ?? undefined, role, user_metadata: user.user_metadata }
  } catch (e: any) {
    console.error('requireStudentApi error', e)
    res.status(500).json({ message: 'Internal server error' })
    return null
  }
}
