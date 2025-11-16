import crypto from 'crypto'
import { supabaseServer } from '@/lib/supabaseServer'
import { trackEvent } from '@/utils/telemetry'
import {
  ensureMentorOwnsGroup,
  fetchActiveQuizInstances,
  upsertGroupStudent,
  createAssignmentsForStudent,
} from '@/lib/server/groupMembership'

const DEBUG = process.env.DEBUG === 'true'
const logDebug = (...args: unknown[]) => {
  if (DEBUG) {
    console.debug('[addStudentsToGroup]', ...args)
  }
}

export type InviteStatus =
  | 'added'
  | 'already_member'
  | 'invited'
  | 'already_invited'
  | 'failed'

export type AddStudentResult = {
  email: string
  status: InviteStatus
  studentId?: string
  inviteToken?: string
  expiresAt?: string
  notes?: string
  reason?: string
}

export type AddStudentsSummary = {
  added: number
  invited: number
  alreadyMember: number
  alreadyInvited: number
  failed: number
}

export type AddStudentsResponse = {
  results: AddStudentResult[]
  summary: AddStudentsSummary
}

const INVITE_EXPIRY_DAYS = 7
const TOKEN_BYTES = 32

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function generateInviteToken(): string {
  return crypto.randomBytes(TOKEN_BYTES).toString('hex')
}

async function sendInviteEmail(_args: {
  email: string
  token: string
  groupName: string
  expiresAt: string
}) {
  // TODO(@team): integrate transactional email provider (Supabase email, Resend, etc.)
  // Ensure tokens are never logged or exposed outside secure transport.
}

async function sendNotificationEmail(_args: {
  email: string
  groupName: string
  assignments: { quizTitle?: string; quizInstanceId: string }[]
}) {
  // TODO(@team): implement student notification emails for newly assigned quizzes.
}

async function upsertPendingInvite(opts: {
  groupId: string
  email: string
  mentorId: string
  groupName: string
}) {
  const token = generateInviteToken()
  const expiresAt = new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000)

  const { data, error } = await supabaseServer
    .from('pending_invites')
    .upsert(
      [
        {
          group_id: opts.groupId,
          email: opts.email,
          token,
          status: 'pending',
          invited_by: opts.mentorId,
          expires_at: expiresAt.toISOString(),
        },
      ],
      {
        onConflict: 'group_id,email',
        ignoreDuplicates: false,
      },
    )
    .select('id, token, expires_at, status')

  if (error) {
    throw new Error(`Failed to upsert pending invite: ${error.message}`)
  }

  const row = data?.[0]
  if (!row) return null

  await trackEvent(opts.mentorId, 'group_invite_created', {
    group_id: opts.groupId,
    email: opts.email,
    expires_at: row.expires_at,
  })

  await sendInviteEmail({
    email: opts.email,
    token: row.token,
    groupName: opts.groupName,
    expiresAt: row.expires_at,
  })

  return row
}

export async function addStudentsToGroup(
  groupId: string,
  emails: string[],
  mentorId: string,
): Promise<AddStudentsResponse> {
  if (!emails?.length) {
    throw new Error('No emails provided')
  }

  const normalized = Array.from(new Set(emails.map(normalizeEmail))).filter(Boolean)
  if (!normalized.length) {
    throw new Error('Emails are empty after normalization')
  }

  const group = await ensureMentorOwnsGroup(groupId, mentorId)
  const quizInstances = await fetchActiveQuizInstances(groupId)

  const summary: AddStudentsSummary = {
    added: 0,
    invited: 0,
    alreadyMember: 0,
    alreadyInvited: 0,
    failed: 0,
  }

  const results: AddStudentResult[] = []

  const adminApi = supabaseServer.auth.admin as unknown as {
    listUsers: (params: { email?: string; page?: number; perPage?: number }) => Promise<{
      data?: { users?: any[] }
      error?: { message: string; status?: number }
    }>
  }

  for (const email of normalized) {
    try {
      logDebug('Processing email', email)
      const { data: userList, error: lookupError } = await adminApi.listUsers({ email, perPage: 1 })
      if (lookupError && lookupError.status !== 404) {
        throw new Error(`Failed to lookup auth user: ${lookupError.message}`)
      }

      const authUser = userList?.users?.[0]
      if (authUser) {
        const membershipRows = await upsertGroupStudent(groupId, authUser.id)
        const isExistingMember = membershipRows.length === 0

        if (isExistingMember) {
          summary.alreadyMember += 1
          results.push({ email, status: 'already_member', studentId: authUser.id })
          continue
        }

        const assignedCount = await createAssignmentsForStudent(quizInstances, authUser.id, mentorId, 'mentor_add')
        summary.added += 1

        const assignmentMeta = quizInstances.map((qi) => ({
          quizTitle: qi.quiz?.title,
          quizInstanceId: qi.id,
        }))

        await sendNotificationEmail({
          email,
          groupName: group.name,
          assignments: assignmentMeta,
        })

        await trackEvent(mentorId, 'group_student_added', {
          group_id: groupId,
          student_id: authUser.id,
          quizzes_assigned: assignedCount,
        })

        results.push({
          email,
          status: 'added',
          studentId: authUser.id,
          notes: assignedCount ? `assigned ${assignedCount} quiz${assignedCount > 1 ? 'zes' : ''}` : undefined,
        })
        continue
      }

      const inviteRow = await upsertPendingInvite({
        groupId,
        email,
        mentorId,
        groupName: group.name,
      })

      if (!inviteRow) {
        summary.alreadyInvited += 1
        results.push({ email, status: 'already_invited' })
        continue
      }

      summary.invited += 1
      results.push({
        email,
        status: 'invited',
        inviteToken: inviteRow.token,
        expiresAt: inviteRow.expires_at,
      })
    } catch (err: any) {
      console.error('addStudentsToGroup failed for', email, err)
      summary.failed += 1
      results.push({ email, status: 'failed', reason: err?.message ?? 'Unknown error' })
    }
  }
  const totalProcessed = results.length
  await trackEvent(mentorId, 'group_invite_bulk', {
    group_id: groupId,
    total_emails: totalProcessed,
    summary,
  })

  return { results, summary }
}
