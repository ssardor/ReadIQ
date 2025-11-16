import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseServer } from '@/lib/supabaseServer'
import { requireMentorApi } from '@/utils/apiAuth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const mentor = await requireMentorApi(req, res)
  if (!mentor) return

  const { groupId } = req.query
  if (!groupId || typeof groupId !== 'string') {
    return res.status(400).json({ message: 'Invalid groupId' })
  }

  if (req.method === 'GET') {
    const { data: group, error } = await supabaseServer
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .eq('teacher_id', mentor.id)
      .single()
    if (error || !group) return res.status(404).json({ message: 'Group not found' })

    const { data: rosterRows, error: rosterErr } = await supabaseServer
      .from('group_students')
      .select('student_id, status, joined_at')
      .eq('group_id', groupId)
    if (rosterErr) return res.status(500).json({ message: 'Failed to fetch roster' })

    let roster = rosterRows ?? []

    if (roster.length) {
      const studentIds = roster.map((item) => item.student_id)
      const { data: profiles, error: profileError } = await supabaseServer
        .from('users_profiles')
        .select('id, full_name, role, university')
        .in('id', studentIds)

      if (profileError) {
        console.error('Failed to fetch roster profiles', profileError)
      } else {
        const map = new Map<string, { id: string; full_name: string; role: string; university: string | null | undefined }>()
        profiles?.forEach((profile) => {
          map.set(profile.id, profile)
        })
        roster = roster.map((entry) => ({
          ...entry,
          profile: map.get(entry.student_id) ?? null,
        }))
      }
    }

    const { data: invites, error: inviteErr } = await supabaseServer
      .from('pending_invites')
      .select('id, email, status, created_at, expires_at')
      .eq('group_id', groupId)
    if (inviteErr) return res.status(500).json({ message: 'Failed to fetch invites' })

    const { count, error: cntErr } = await supabaseServer
      .from('group_students')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', groupId)
    if (cntErr) return res.status(500).json({ message: 'Failed to fetch roster count' })

    return res.status(200).json({
      group,
      stats: { students: count ?? 0 },
      roster: roster,
      pendingInvites: invites ?? [],
    })
  }

  if (req.method === 'PATCH') {
    const { name, term, capacity, is_archived } = req.body || {}
    const { data, error } = await supabaseServer
      .from('groups')
      .update({ name, term, capacity, is_archived })
      .eq('id', groupId)
      .eq('teacher_id', mentor.id)
      .select()
      .single()
    if (error) return res.status(500).json({ message: 'Failed to update group', error: error.message })
    return res.status(200).json({ group: data })
  }

  if (req.method === 'DELETE') {
    const { error } = await supabaseServer
      .from('groups')
      .update({ is_archived: true })
      .eq('id', groupId)
      .eq('teacher_id', mentor.id)
    if (error) return res.status(500).json({ message: 'Failed to archive group', error: error.message })
    return res.status(204).end()
  }

  return res.status(405).json({ message: 'Method not allowed' })
}
