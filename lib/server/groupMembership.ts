import { supabaseServer } from '@/lib/supabaseServer'
import { trackEvent } from '@/utils/telemetry'

export type QuizInstanceSummary = {
  id: string
  status: 'draft' | 'scheduled' | 'active' | 'closed'
  scheduled_at: string | null
  quiz: { title?: string } | null
}

const DEBUG = process.env.DEBUG === 'true'
const logDebug = (...args: unknown[]) => {
  if (DEBUG) {
    console.debug('[groupMembership]', ...args)
  }
}

export async function ensureMentorOwnsGroup(groupId: string, mentorId: string) {
  const { data, error } = await supabaseServer
    .from('groups')
    .select('id, name, teacher_id')
    .eq('id', groupId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to load group: ${error.message}`)
  }

  if (!data) {
    throw new Error('Group not found')
  }

  if (data.teacher_id !== mentorId) {
    throw new Error('You do not have permission to manage this group')
  }

  return data
}

export async function fetchActiveQuizInstances(groupId: string): Promise<QuizInstanceSummary[]> {
  const { data, error } = await supabaseServer
    .from('quiz_instances')
    .select('id, status, scheduled_at, quiz:quizzes(title)')
    .eq('group_id', groupId)
    .in('status', ['draft', 'scheduled', 'active'])

  if (error) {
    throw new Error(`Failed to load quiz instances: ${error.message}`)
  }

  return (data ?? []) as QuizInstanceSummary[]
}

export async function upsertGroupStudent(groupId: string, studentId: string) {
  const { data, error } = await supabaseServer
    .from('group_students')
    .upsert(
      [
        {
          group_id: groupId,
          student_id: studentId,
          status: 'active',
        },
      ],
      {
        onConflict: 'group_id,student_id',
        ignoreDuplicates: false,
      },
    )
    .select('id, group_id, student_id')

  if (error) {
    throw new Error(`Failed to upsert group membership: ${error.message}`)
  }

  return data ?? []
}

export async function createAssignmentsForStudent(
  quizInstances: QuizInstanceSummary[],
  studentId: string,
  mentorId: string,
  source: string,
): Promise<number> {
  if (!quizInstances.length) {
    console.info('createAssignmentsForStudent: no quiz instances available', {
      studentId,
      mentorId,
      source,
    })
    return 0
  }

  const payload = quizInstances.map((instance) => ({
    quiz_instance_id: instance.id,
    student_id: studentId,
    status: 'assigned',
    assignment_source: source,
  }))

  const { data, error } = await supabaseServer
    .from('quiz_assignments')
    .upsert(payload, { onConflict: 'quiz_instance_id,student_id', ignoreDuplicates: false })
    .select('quiz_instance_id, student_id')

  if (error) {
    throw new Error(`Failed to create quiz assignments: ${error.message}`)
  }

  const created = data?.length ?? 0
  console.info('createAssignmentsForStudent: upsert result', {
    studentId,
    mentorId,
    source,
    created,
    quizInstanceIds: data?.map((row) => row.quiz_instance_id) ?? [],
  })
  if (created > 0) {
    await trackEvent(mentorId, 'assignment_created', {
      student_id: studentId,
      quiz_instance_ids: data?.map((row) => row.quiz_instance_id),
      assignment_source: source,
    })
    logDebug('Assignments created', {
      studentId,
      quizInstanceIds: data?.map((row) => row.quiz_instance_id),
      source,
    })
  }

  return created
}
