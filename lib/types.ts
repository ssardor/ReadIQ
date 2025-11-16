export interface UserProfile {
  id: string
  full_name: string
  role: 'student' | 'mentor'
  university?: string
  email_verified: boolean
  created_at: string
  updated_at: string
}

export interface SignUpData {
  full_name: string
  email: string
  password: string
  role: 'student' | 'mentor'
  university?: string
}

// Mentor domain models
export interface Group {
  id: string
  name: string
  term?: string | null
  capacity?: number | null
  is_archived: boolean
  created_at: string
}

export interface Quiz {
  id: string
  title: string
  description?: string | null
  is_template: boolean
  created_at: string
  updated_at: string
}

export interface StudentAssignment {
  id: string
  status: 'assigned' | 'notified' | 'completed' | 'cancelled'
  created_at: string
  quiz_instance: {
    id: string
    status: 'draft' | 'scheduled' | 'active' | 'closed'
    scheduled_at: string | null
    duration_seconds: number | null
    quiz: {
      id: string
      title: string
      description?: string | null
    } | null
    group: {
      id: string
      name: string
      term?: string | null
    } | null
  } | null
}

export interface Question {
  id?: string
  quiz_id?: string
  text: string
  choices: string[]
  correct_indexes: number[]
  source_slide_index?: number | null
  difficulty?: 'easy' | 'medium' | 'hard' | null
}

export interface GroupAnalytics {
  id: string
  name: string
  term?: string | null
  studentCount: number
  quizCount: number
  totalAssignments: number
  completedAssignments: number
  completionRate: number
  averageScore: number | null
  upcomingInstances: number
}

export interface QuizAnalytics {
  id: string
  title: string
  assignmentCount: number
  completedAssignments: number
  completionRate: number
  averageScore: number | null
  bestScore: number | null
  worstScore: number | null
  groupsInvolved: number
}

export interface StudentHistoryEntry {
  assignmentId: string
  quizTitle: string
  groupName: string
  status: string
  score: number | null
  submittedAt: string | null
}

export interface StudentAnalytics {
  id: string
  fullName: string
  university?: string | null
  groupNames: string[]
  averageScore: number | null
  completedAssignments: number
  pendingAssignments: number
  lastActivity: string | null
  history: StudentHistoryEntry[]
}

export interface MentorAnalyticsSummary {
  totalAssignments: number
  completedAssignments: number
  averageScore: number | null
}

export interface MentorAnalytics {
  summary: MentorAnalyticsSummary
  groups: GroupAnalytics[]
  quizzes: QuizAnalytics[]
  students: StudentAnalytics[]
}
