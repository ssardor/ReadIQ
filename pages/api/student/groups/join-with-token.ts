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
    const session = await loadSessionByToken(token)
    if (!session) {
      return res.status(404).json({ message: 'QR-сессия не найдена' })
    }

    if (session.status !== 'active') {
      return res.status(410).json({ message: 'Сессия QR-кода завершена' })
    }

    const now = new Date()
    if (now.getTime() >= new Date(session.expires_at).getTime()) {
      await supabaseServer
        .from('group_qr_sessions')
        .update({ status: 'expired' })
        .eq('id', session.id)

      return res.status(410).json({ message: 'Срок действия QR-кода истёк' })
    }

    const group = await fetchGroup(session.group_id)
    if (!group) {
      return res.status(404).json({ message: 'Группа не найдена' })
    }

    if (group.is_archived) {
      return res.status(409).json({ message: 'Группа архивирована' })
    }

    if (group.teacher_id !== session.mentor_id) {
      console.warn('QR join: mentor mismatch', { groupId: group.id, sessionId: session.id })
      return res.status(409).json({ message: 'QR-сессия недействительна' })
    }

    const membershipRows = await upsertGroupStudent(group.id, student.id)
    const alreadyMember = membershipRows.length === 0

    let assignedCount = 0
    if (!alreadyMember) {
      const quizInstances = await fetchActiveQuizInstances(group.id)
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

    return res.status(200).json({
      joined: !alreadyMember,
      alreadyMember,
      assignmentsCreated: assignedCount,
      message: alreadyMember ? 'Вы уже состоите в этой группе' : `Вы успешно присоединились к группе «${group.name}»`,
      groupId: group.id,
      groupName: group.name,
    })
  } catch (error: any) {
    console.error('QR join error', error)
    return res.status(500).json({ message: error?.message ?? 'Не удалось присоединиться к группе' })
  }
}
