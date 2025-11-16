import type { NextApiRequest, NextApiResponse } from 'next'
import crypto from 'crypto'
import { supabaseServer } from '@/lib/supabaseServer'
import { requireMentorApi } from '@/utils/apiAuth'
import { ensureMentorOwnsGroup } from '@/lib/server/groupMembership'

const SESSION_TTL_MINUTES = 30

type SessionRow = {
  id: string
  group_id: string
  mentor_id: string
  token: string
  status: 'active' | 'expired' | 'revoked'
  created_at: string
  expires_at: string
  consumed_count: number | null
  last_consumed_at: string | null
}

function buildBaseUrl(req: NextApiRequest): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (envUrl) {
    return envUrl.replace(/\/$/, '')
  }

  const proto = (req.headers['x-forwarded-proto'] as string) || 'http'
  const host = req.headers.host ?? 'localhost:3000'
  return `${proto}://${host}`.replace(/\/$/, '')
}

function withSessionPayload(row: SessionRow, req: NextApiRequest) {
  const expiresAt = new Date(row.expires_at)
  const now = new Date()
  const ttlSeconds = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000))
  return {
    id: row.id,
    token: row.token,
    status: row.status,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    consumedCount: row.consumed_count ?? 0,
    lastConsumedAt: row.last_consumed_at,
    ttlSeconds,
    joinUrl: `${buildBaseUrl(req)}/join/${row.token}`,
  }
}

async function findActiveSession(groupId: string, mentorId: string): Promise<SessionRow | null> {
  const { data, error } = await supabaseServer
    .from('group_qr_sessions')
    .select('id, group_id, mentor_id, token, status, created_at, expires_at, consumed_count, last_consumed_at')
    .eq('group_id', groupId)
    .eq('mentor_id', mentorId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) {
    throw new Error(`Failed to lookup active QR session: ${error.message}`)
  }

  const session = data?.[0] as SessionRow | undefined
  if (!session) return null

  const now = new Date()
  if (now.getTime() >= new Date(session.expires_at).getTime()) {
    await supabaseServer
      .from('group_qr_sessions')
      .update({ status: 'expired' })
      .eq('id', session.id)

    return null
  }

  return session
}

async function expireStaleSessions(groupId: string, mentorId: string) {
  const nowIso = new Date().toISOString()
  await supabaseServer
    .from('group_qr_sessions')
    .update({ status: 'expired' })
    .eq('group_id', groupId)
    .eq('mentor_id', mentorId)
    .eq('status', 'active')
    .lte('expires_at', nowIso)
}

async function createSession(groupId: string, mentorId: string): Promise<SessionRow> {
  const token = crypto.randomBytes(16).toString('hex')
  const expiresAt = new Date(Date.now() + SESSION_TTL_MINUTES * 60 * 1000).toISOString()

  const { data, error } = await supabaseServer
    .from('group_qr_sessions')
    .insert([
      {
        group_id: groupId,
        mentor_id: mentorId,
        token,
        expires_at: expiresAt,
        status: 'active',
      },
    ])
    .select('id, group_id, mentor_id, token, status, created_at, expires_at, consumed_count, last_consumed_at')
    .single()

  if (error || !data) {
    throw new Error(error?.message || 'Failed to create QR session')
  }

  return data as SessionRow
}

async function revokeSession(sessionId: string) {
  const { error } = await supabaseServer
    .from('group_qr_sessions')
    .update({ status: 'revoked' })
    .eq('id', sessionId)

  if (error) {
    throw new Error(`Failed to revoke QR session: ${error.message}`)
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const mentor = await requireMentorApi(req, res)
  if (!mentor) return

  const { groupId } = req.query
  if (!groupId || typeof groupId !== 'string') {
    return res.status(400).json({ message: 'Invalid groupId' })
  }

  try {
    await ensureMentorOwnsGroup(groupId, mentor.id)
  } catch (error: any) {
    return res.status(403).json({ message: error?.message ?? 'Forbidden' })
  }

  try {
    if (req.method === 'GET') {
      await expireStaleSessions(groupId, mentor.id)
      const session = await findActiveSession(groupId, mentor.id)
      return res.status(200).json({ session: session ? withSessionPayload(session, req) : null, ttlMinutes: SESSION_TTL_MINUTES })
    }

    if (req.method === 'POST') {
      await expireStaleSessions(groupId, mentor.id)
      const activeSession = await findActiveSession(groupId, mentor.id)
      if (activeSession) {
        return res.status(200).json({ session: withSessionPayload(activeSession, req), ttlMinutes: SESSION_TTL_MINUTES })
      }

      const session = await createSession(groupId, mentor.id)
      return res.status(201).json({ session: withSessionPayload(session, req), ttlMinutes: SESSION_TTL_MINUTES })
    }

    if (req.method === 'DELETE') {
      const { sessionId } = req.body ?? {}
      if (!sessionId || typeof sessionId !== 'string') {
        return res.status(400).json({ message: 'sessionId required' })
      }

      await revokeSession(sessionId)
      return res.status(204).end()
    }

    res.setHeader('Allow', ['GET', 'POST', 'DELETE'])
    return res.status(405).json({ message: 'Method not allowed' })
  } catch (error: any) {
    console.error('QR session handler error', error)
    return res.status(500).json({ message: error?.message ?? 'Internal server error' })
  }
}
