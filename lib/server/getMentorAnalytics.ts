import { supabaseServer } from '@/lib/supabaseServer'
import type {
  GroupAnalytics,
  MentorAnalytics,
  MentorAnalyticsSummary,
  QuizAnalytics,
  StudentAnalytics,
  StudentHistoryEntry,
} from '@/lib/types'

const toPercent = (value: number) => Math.round(value * 1000) / 1000

function calculateAverage(values: number[]): number | null {
  if (!values.length) return null
  const sum = values.reduce((acc, value) => acc + value, 0)
  return sum / values.length
}

function getLatestTimestamp(values: (string | null | undefined)[]): string | null {
  const timestamps = values
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => b.getTime() - a.getTime())
  return timestamps[0]?.toISOString() ?? null
}

type GroupRow = {
  id: string
  name: string
  term?: string | null
}

type QuizRow = {
  id: string
  title: string
  description?: string | null
  created_at: string
  updated_at: string
}

type InstanceRow = {
  id: string
  quiz_id: string
  group_id: string
  status: string
  scheduled_at: string | null
  started_at: string | null
  ended_at: string | null
  duration_seconds: number | null
}

type AssignmentRow = {
  id: string
  student_id: string
  quiz_instance_id: string
  status: string
  created_at: string
  completed_at: string | null
}

type AttemptRow = {
  id: string
  quiz_instance_id: string
  student_id: string
  score: number | null
  submitted_at: string | null
  duration_seconds: number | null
}

type GroupStudentRow = {
  group_id: string
  student_id: string
  status: string | null
}

type ProfileRow = {
  id: string
  full_name: string
  university?: string | null
}

export async function getMentorAnalytics(mentorId: string): Promise<MentorAnalytics> {
  const [{ data: groups, error: groupsError }, { data: quizzes, error: quizzesError }] = await Promise.all([
    supabaseServer
      .from('groups')
      .select('id,name,term')
      .eq('teacher_id', mentorId)
      .order('created_at', { ascending: true }),
    supabaseServer
      .from('quizzes')
      .select('id,title,description,created_at,updated_at')
      .eq('creator_id', mentorId)
      .order('created_at', { ascending: true }),
  ])

  if (groupsError) throw new Error(`Failed to load groups: ${groupsError.message}`)
  if (quizzesError) throw new Error(`Failed to load quizzes: ${quizzesError.message}`)

  const groupRows: GroupRow[] = groups ?? []
  const quizRows: QuizRow[] = quizzes ?? []
  const groupIds = groupRows.map((group) => group.id)

  const [{ data: instances, error: instancesError }, { data: groupStudents, error: groupStudentsError }] = await Promise.all([
    groupIds.length
      ? supabaseServer
          .from('quiz_instances')
          .select('id,quiz_id,group_id,status,scheduled_at,started_at,ended_at,duration_seconds')
          .in('group_id', groupIds)
      : { data: [], error: null },
    groupIds.length
      ? supabaseServer
          .from('group_students')
          .select('group_id,student_id,status')
          .in('group_id', groupIds)
      : { data: [], error: null },
  ])

  if (instancesError) throw new Error(`Failed to load quiz instances: ${instancesError.message}`)
  if (groupStudentsError) throw new Error(`Failed to load group students: ${groupStudentsError.message}`)

  const instanceRows: InstanceRow[] = instances ?? []
  const instanceIds = instanceRows.map((instance) => instance.id)

  const assignmentsPromise = instanceIds.length
    ? supabaseServer
        .from('quiz_assignments')
        .select('id,student_id,quiz_instance_id,status,created_at,completed_at')
        .in('quiz_instance_id', instanceIds)
    : Promise.resolve({ data: [] as AssignmentRow[], error: null })

  const [assignmentsResult, attemptsResult] = await Promise.all([
    assignmentsPromise,
    instanceIds.length
      ? supabaseServer
          .from('attempts')
          .select('id,quiz_instance_id,student_id,score,submitted_at,duration_seconds')
          .in('quiz_instance_id', instanceIds)
      : Promise.resolve({ data: [] as AttemptRow[], error: null }),
  ])

  if (assignmentsResult.error) throw new Error(`Failed to load assignments: ${assignmentsResult.error.message}`)
  if (attemptsResult.error) throw new Error(`Failed to load attempts: ${attemptsResult.error.message}`)

  const assignmentRows: AssignmentRow[] = assignmentsResult.data ?? []
  const attemptRows: AttemptRow[] = attemptsResult.data ?? []

  const studentIds = Array.from(
    new Set([
      ...groupStudents?.map((row: GroupStudentRow) => row.student_id) ?? [],
      ...assignmentRows.map((row) => row.student_id),
    ]),
  )

  const { data: profiles, error: profilesError } = studentIds.length
    ? await supabaseServer
        .from('users_profiles')
        .select('id,full_name,university')
        .in('id', studentIds)
    : { data: [], error: null }

  if (profilesError) throw new Error(`Failed to load student profiles: ${profilesError.message}`)

  const profileMap = new Map<string, ProfileRow>()
  profiles?.forEach((profile) => profileMap.set(profile.id, profile))

  const instanceById = new Map<string, InstanceRow>()
  instanceRows.forEach((instance) => instanceById.set(instance.id, instance))

  const groupById = new Map<string, GroupRow>()
  groupRows.forEach((group) => groupById.set(group.id, group))

  const quizById = new Map<string, QuizRow>()
  quizRows.forEach((quiz) => quizById.set(quiz.id, quiz))

  const attemptMap = new Map<string, AttemptRow[]>()
  attemptRows.forEach((attempt) => {
    const key = `${attempt.quiz_instance_id}::${attempt.student_id}`
    const entries = attemptMap.get(key)
    if (entries) entries.push(attempt)
    else attemptMap.set(key, [attempt])
  })

  attemptMap.forEach((entries, key) => {
    entries.sort((a, b) => {
      const aTime = new Date(a.submitted_at ?? 0).getTime()
      const bTime = new Date(b.submitted_at ?? 0).getTime()
      return bTime - aTime
    })
    attemptMap.set(key, entries)
  })

  const groupStudentsMap = new Map<string, Set<string>>()
  ;(groupStudents ?? []).forEach((entry: GroupStudentRow) => {
    if (entry.status && entry.status !== 'active') return
    const set = groupStudentsMap.get(entry.group_id)
    if (set) set.add(entry.student_id)
    else groupStudentsMap.set(entry.group_id, new Set([entry.student_id]))
  })

  const assignmentsByGroup = new Map<string, AssignmentRow[]>()
  const assignmentsByQuiz = new Map<string, AssignmentRow[]>()
  const assignmentsByStudent = new Map<string, AssignmentRow[]>()

  assignmentRows.forEach((assignment) => {
    const instance = instanceById.get(assignment.quiz_instance_id)
    if (!instance) return

    const groupList = assignmentsByGroup.get(instance.group_id)
    if (groupList) groupList.push(assignment)
    else assignmentsByGroup.set(instance.group_id, [assignment])

    const quizList = assignmentsByQuiz.get(instance.quiz_id)
    if (quizList) quizList.push(assignment)
    else assignmentsByQuiz.set(instance.quiz_id, [assignment])

    const studentList = assignmentsByStudent.get(assignment.student_id)
    if (studentList) studentList.push(assignment)
    else assignmentsByStudent.set(assignment.student_id, [assignment])
  })

  const allScores: number[] = []
  let completedAssignmentsTotal = 0

  const groupsAnalytics: GroupAnalytics[] = groupRows.map((group) => {
    const studentsInGroup = groupStudentsMap.get(group.id)
    const groupAssignments = assignmentsByGroup.get(group.id) ?? []
    const completedAssignments = groupAssignments.filter((assignment) => assignment.status === 'completed')
    completedAssignmentsTotal += completedAssignments.length

    const scores: number[] = []
    groupAssignments.forEach((assignment) => {
      const instance = instanceById.get(assignment.quiz_instance_id)
      if (!instance) return
      const key = `${instance.id}::${assignment.student_id}`
      const attempt = attemptMap.get(key)?.[0]
      if (attempt?.score != null) {
        scores.push(attempt.score)
        allScores.push(attempt.score)
      }
    })

    const uniqueQuizIds = new Set<string>()
    groupAssignments.forEach((assignment) => {
      const instance = instanceById.get(assignment.quiz_instance_id)
      if (instance) uniqueQuizIds.add(instance.quiz_id)
    })

    const upcomingInstances = instanceRows.filter(
      (instance) => instance.group_id === group.id && ['scheduled', 'active'].includes(instance.status),
    ).length

    return {
      id: group.id,
      name: group.name,
      term: group.term ?? null,
      studentCount: studentsInGroup?.size ?? 0,
      quizCount: uniqueQuizIds.size,
      totalAssignments: groupAssignments.length,
      completedAssignments: completedAssignments.length,
      completionRate: groupAssignments.length ? toPercent(completedAssignments.length / groupAssignments.length) : 0,
      averageScore: calculateAverage(scores),
      upcomingInstances,
    }
  })

  const quizzesAnalytics: QuizAnalytics[] = quizRows.map((quiz) => {
    const quizAssignments = assignmentsByQuiz.get(quiz.id) ?? []
    const completed = quizAssignments.filter((assignment) => assignment.status === 'completed')

    const scores = quizAssignments
      .map((assignment) => {
        const instance = instanceById.get(assignment.quiz_instance_id)
        if (!instance) return null
        const key = `${instance.id}::${assignment.student_id}`
        const attempt = attemptMap.get(key)?.[0]
        return attempt?.score ?? null
      })
      .filter((value): value is number => value != null)

    const groupsInvolved = new Set<string>()
    quizAssignments.forEach((assignment) => {
      const instance = instanceById.get(assignment.quiz_instance_id)
      if (instance) groupsInvolved.add(instance.group_id)
    })

    const averageScore = calculateAverage(scores)
    const bestScore = scores.length ? Math.max(...scores) : null
    const worstScore = scores.length ? Math.min(...scores) : null

    return {
      id: quiz.id,
      title: quiz.title,
      assignmentCount: quizAssignments.length,
      completedAssignments: completed.length,
      completionRate: quizAssignments.length ? toPercent(completed.length / quizAssignments.length) : 0,
      averageScore,
      bestScore,
      worstScore,
      groupsInvolved: groupsInvolved.size,
    }
  })

  const studentsAnalytics: StudentAnalytics[] = studentIds.map((studentId) => {
    const studentAssignments = assignmentsByStudent.get(studentId) ?? []
    const history: StudentHistoryEntry[] = []
    let completedCount = 0
    const scores: number[] = []

    studentAssignments.forEach((assignment) => {
      const instance = instanceById.get(assignment.quiz_instance_id)
      if (!instance) return
      const quiz = quizById.get(instance.quiz_id)
      const group = groupById.get(instance.group_id)
      const key = `${instance.id}::${assignment.student_id}`
      const attempt = attemptMap.get(key)?.[0]
      const normalizedScore = attempt?.score ?? null

      if (assignment.status === 'completed') {
        completedCount += 1
        if (normalizedScore != null) scores.push(normalizedScore)
      }

      history.push({
        assignmentId: assignment.id,
  quizTitle: quiz?.title ?? 'Untitled',
        groupName: group?.name ?? '—',
        status: assignment.status,
        score: normalizedScore,
        submittedAt: attempt?.submitted_at ?? assignment.completed_at ?? null,
      })
    })

    history.sort((a, b) => {
      const aTime = new Date(a.submittedAt ?? a.assignmentId).getTime()
      const bTime = new Date(b.submittedAt ?? b.assignmentId).getTime()
      return bTime - aTime
    })

    const profile = profileMap.get(studentId)
    const groupNames = Array.from(new Set(history.map((entry) => entry.groupName).filter(Boolean)))
    const lastActivity = getLatestTimestamp(history.map((entry) => entry.submittedAt ?? null))

    return {
      id: studentId,
      fullName: profile?.full_name ?? '—',
      university: profile?.university ?? null,
      groupNames,
      averageScore: calculateAverage(scores),
      completedAssignments: completedCount,
      pendingAssignments: studentAssignments.length - completedCount,
      lastActivity,
      history,
    }
  })

  studentsAnalytics.sort((a, b) => (
    (b.lastActivity ? new Date(b.lastActivity).getTime() : 0) - (a.lastActivity ? new Date(a.lastActivity).getTime() : 0)
  ))

  const summary: MentorAnalyticsSummary = {
    totalAssignments: assignmentRows.length,
    completedAssignments: completedAssignmentsTotal,
    averageScore: calculateAverage(allScores),
  }

  return {
    summary,
    groups: groupsAnalytics,
    quizzes: quizzesAnalytics,
    students: studentsAnalytics,
  }
}
