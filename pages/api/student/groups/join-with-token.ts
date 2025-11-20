import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseServer } from '@/lib/supabaseServer'
import { requireStudentApi } from '@/utils/apiAuth'
import {
  fetchActiveQuizInstances,
  upsertGroupStudent,
  createAssignmentsForStudent,
} from '@/lib/server/groupMembership'
import { trackEvent } from '@/utils/telemetry'

const ASSIGNMENT_SOURCE = 'qr_join'

type SessionRow = {
  id: string
  group_id: string
  mentor_id: string
  status: 'active' | 'expired' | 'revoked'
  expires_at: string
  consumed_count: number | null
}

async function loadSessionByToken(token: string): Promise<SessionRow | null> {
  const { data, error } = await supabaseServer
    .from('group_qr_sessions')
    .select('id, group_id, mentor_id, status, expires_at, consumed_count')
    .eq('token', token)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to lookup QR session: ${error.message}`)
  }

  return (data as SessionRow | null) ?? null
}

async function fetchGroup(groupId: string) {
  const { data, error } = await supabaseServer
    .from('groups')
    .select('id, name, is_archived, teacher_id')
    .eq('id', groupId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to load group: ${error.message}`)
  }

  return data
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const student = await requireStudentApi(req, res)
  if (!student) return

  const { token } = req.body ?? {}
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ message: 'QR token is required' })
  }

  try {
    console.info('QR join request received', {
      studentId: student.id,
      token: token.slice(0, 6),
    })

    const session = await loadSessionByToken(token)
    if (!session) {
      console.warn('QR join: session not found', { tokenSnippet: token.slice(0, 6) })
      return res.status(404).json({ message: 'QR session not found' })
    }

    if (session.status !== 'active') {
      console.warn('QR join: session inactive', {
        sessionId: session.id,
        status: session.status,
      })
      return res.status(410).json({ message: 'QR code session has ended' })
    }

    const now = new Date()
    if (now.getTime() >= new Date(session.expires_at).getTime()) {
      console.warn('QR join: session expired during request', {
        sessionId: session.id,
        expiresAt: session.expires_at,
      })
      await supabaseServer
        .from('group_qr_sessions')
        .update({ status: 'expired' })
        .eq('id', session.id)

      return res.status(410).json({ message: 'QR code session has expired' })
    }

    const group = await fetchGroup(session.group_id)
    if (!group) {
      return res.status(404).json({ message: 'Group not found' })
    }

    if (group.is_archived) {
      return res.status(409).json({ message: 'Group has been archived' })
    }

    if (group.teacher_id !== session.mentor_id) {
      console.warn('QR join: mentor mismatch', { groupId: group.id, sessionId: session.id })
      console.warn('QR join: mentor mismatch', {
        groupId: group.id,
        sessionId: session.id,
        expectedMentor: group.teacher_id,
        actualMentor: session.mentor_id,
      })
  return res.status(409).json({ message: 'QR session is invalid' })
    }

    const membershipRows = await upsertGroupStudent(group.id, student.id)
    const alreadyMember = membershipRows.length === 0
    console.info('QR join: membership upsert result', {
      sessionId: session.id,
      groupId: group.id,
      studentId: student.id,
      alreadyMember,
      insertedRows: membershipRows.map((row) => row.id),
    })

    let assignedCount = 0
    if (!alreadyMember) {
      const quizInstances = await fetchActiveQuizInstances(group.id)
      console.info('QR join: fetched quiz instances for assignment', {
        sessionId: session.id,
        groupId: group.id,
        studentId: student.id,
        quizInstanceCount: quizInstances.length,
      })
      assignedCount = await createAssignmentsForStudent(quizInstances, student.id, session.mentor_id, ASSIGNMENT_SOURCE)
    }

    const { error: updateError } = await supabaseServer
      .from('group_qr_sessions')
      .update({
        consumed_count: alreadyMember ? session.consumed_count : (session.consumed_count ?? 0) + 1,
        last_consumed_at: new Date().toISOString(),
      })
      .eq('id', session.id)

    if (updateError) {
      console.error('Failed to update QR session usage', updateError)
    }

    await trackEvent(session.mentor_id, 'group_qr_join', {
      group_id: group.id,
      student_id: student.id,
      already_member: alreadyMember,
      assignments_created: assignedCount,
    })

    console.info('QR join: completed', {
      sessionId: session.id,
      groupId: group.id,
      studentId: student.id,
      alreadyMember,
      assignmentsCreated: assignedCount,
    })

    return res.status(200).json({
      joined: !alreadyMember,
      alreadyMember,
      assignmentsCreated: assignedCount,
      message: alreadyMember ? 'You are already a member of this group' : `You have successfully joined the group "${group.name}"`,
      groupId: group.id,
      groupName: group.name,
    })
  } catch (error: any) {
    console.error('QR join error', error)
    return res.status(500).json({ message: error?.message ?? 'Failed to join the group' })
  }
}
