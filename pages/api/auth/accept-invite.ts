import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseServer } from '@/lib/supabaseServer'

const SIGNUP_PATH = '/signup'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const token = typeof req.query.token === 'string' ? req.query.token : undefined
  if (!token) {
    return res.status(400).json({ message: 'Missing invite token' })
  }

  const { data, error } = await supabaseServer
    .from('pending_invites')
    .select('id, email, group_id, status, expires_at')
    .eq('token', token)
    .maybeSingle()

  if (error) {
    return res.status(500).json({ message: 'Failed to verify invite token' })
  }

  if (!data) {
    return res.status(404).json({ message: 'Invite not found or already used' })
  }

  if (data.status !== 'pending') {
    return res.status(400).json({ message: 'Invite is not active' })
  }

  const expiresAt = new Date(data.expires_at)
  if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() < Date.now()) {
    await supabaseServer
      .from('pending_invites')
      .update({ status: 'expired' })
      .eq('id', data.id)
    return res.status(410).json({ message: 'Invite has expired' })
  }

  const searchParams = new URLSearchParams({
    invite_token: token,
    email: data.email,
    group_id: data.group_id,
  })

  const redirectUrl = `${SIGNUP_PATH}?${searchParams.toString()}`

  res.setHeader('Location', redirectUrl)
  return res.status(302).end()
}
