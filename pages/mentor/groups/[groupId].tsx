import React, { useCallback, useState } from 'react'
import Head from 'next/head'
import type { GetServerSideProps } from 'next'
import { requireMentor } from '@/utils/roleGuard'
import { supabaseServer } from '@/lib/supabaseServer'
import { AddStudentsModal } from '@/components/AddStudentsModal'
import { useToasts } from '@/components/ToastProvider'
import type { Group } from '@/lib/types'
import { BackButton } from '@/components/BackButton'
import { GroupQrModal } from '@/components/GroupQrModal'

type GroupDetailProps = {
  initialGroup: Group
  initialRoster: Array<{
    student_id: string
    status: string | null
    joined_at: string | null
    profile: {
      full_name: string | null
      role: string | null
      university: string | null
    } | null
  }>
  initialInvites: Array<{
    id: string
    email: string
    status: string
    created_at: string
    expires_at: string
  }>
  initialStats: {
    students: number
  }
}

const formatDate = (value?: string | null) => {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString()
}

const MentorGroupDetail: React.FC<GroupDetailProps> = ({ initialGroup, initialRoster, initialInvites, initialStats }) => {
  const { push } = useToasts()
  const [group, setGroup] = useState(initialGroup)
  const [roster, setRoster] = useState(initialRoster)
  const [invites, setInvites] = useState(initialInvites)
  const [stats, setStats] = useState(initialStats)
  const [isModalOpen, setModalOpen] = useState(false)
  const [isQrModalOpen, setQrModalOpen] = useState(false)
  const [isRefreshing, setRefreshing] = useState(false)

  const refreshData = useCallback(async () => {
    setRefreshing(true)
    try {
  const response = await fetch(`/api/mentor/groups/${group.id}`, { credentials: 'include' })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.message || 'Не удалось обновить информацию группы')
      }
      const payload = await response.json()
      setGroup(payload.group)
      setRoster(payload.roster)
      setInvites(payload.pendingInvites)
      setStats(payload.stats)
    } catch (error: any) {
      push(error?.message || 'Ошибка при обновлении данных', 'error')
    } finally {
      setRefreshing(false)
    }
  }, [group.id, push])

  return (
    <>
      <Head>
        <title>{group.name} • Mentor Group</title>
      </Head>
      <div className="mx-auto max-w-7xl px-6 py-6">
        <BackButton href="/mentor/groups" label="← Назад к группам" className="mb-4" />
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{group.name}</h1>
            <p className="text-sm text-gray-500">Создана {formatDate(group.created_at)} • {stats.students} студентов</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => refreshData()} disabled={isRefreshing} className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60">
              {isRefreshing ? 'Обновление…' : 'Обновить'}
            </button>
            <button onClick={() => setQrModalOpen(true)} className="rounded border border-primary-600 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50">
              Показать QR
            </button>
            <button onClick={() => setModalOpen(true)} className="rounded bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-primary-700">
              Добавить студентов
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Терм</h3>
            <p className="mt-1 text-lg font-semibold text-gray-900">{group.term || 'Не указан'}</p>
          </div>
          <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Вместимость</h3>
            <p className="mt-1 text-lg font-semibold text-gray-900">{group.capacity ? `${group.capacity}` : 'Без ограничения'}</p>
          </div>
          <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Статус</h3>
            <p className="mt-1 text-lg font-semibold text-gray-900">{group.is_archived ? 'Архив' : 'Активна'}</p>
          </div>
        </div>

        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Состав группы</h2>
            <span className="text-sm text-gray-500">{roster.length} участников</span>
          </div>
          <div className="mt-3 overflow-x-auto rounded-lg border border-gray-100 bg-white shadow">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">ФИО</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">ID студента</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Университет</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Статус</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Дата присоединения</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {roster.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">В группе пока нет студентов</td>
                  </tr>
                )}
                {roster.map((entry) => (
                  <tr key={entry.student_id}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{entry.profile?.full_name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{entry.student_id}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{entry.profile?.university || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{entry.status || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{entry.joined_at ? formatDate(entry.joined_at) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Ожидают приглашение</h2>
            <span className="text-sm text-gray-500">{invites.length} отправлено</span>
          </div>
          <div className="mt-3 overflow-x-auto rounded-lg border border-gray-100 bg-white shadow">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Статус</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Отправлено</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Истекает</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {invites.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">Новых приглашений нет</td>
                  </tr>
                )}
                {invites.map((invite) => (
                  <tr key={invite.id}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{invite.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{invite.status}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDate(invite.created_at)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDate(invite.expires_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <AddStudentsModal
        groupId={group.id}
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          setModalOpen(false)
          refreshData()
        }}
      />
      <GroupQrModal
        groupId={group.id}
        isOpen={isQrModalOpen}
        onClose={() => setQrModalOpen(false)}
        onRefreshRequested={refreshData}
      />
    </>
  )
}

export const getServerSideProps: GetServerSideProps<GroupDetailProps> = async (ctx) => {
  const mentor = await requireMentor(ctx)
  if ('redirect' in mentor) return mentor as any

  const { groupId } = ctx.params ?? {}
  if (typeof groupId !== 'string') {
    return { notFound: true }
  }

  const { data: group, error: groupError } = await supabaseServer
    .from('groups')
    .select('id,name,term,capacity,is_archived,created_at,teacher_id')
    .eq('id', groupId)
    .single()

  if (groupError || !group || group.teacher_id !== mentor.user.id) {
    return { notFound: true }
  }

  const { teacher_id: _teacherId, ...groupData } = group

  const [{ data: roster, error: rosterError }, { data: invites, error: inviteError }, { count }] = await Promise.all([
    supabaseServer
      .from('group_students')
      .select('student_id,status,joined_at,profile:users_profiles(full_name,role,university)')
      .eq('group_id', groupId),
    supabaseServer
      .from('pending_invites')
      .select('id,email,status,created_at,expires_at')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false }),
    supabaseServer
      .from('group_students')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', groupId),
  ])

  return {
    props: {
      initialGroup: groupData,
      initialRoster: roster ?? [],
      initialInvites: invites ?? [],
      initialStats: { students: count ?? 0 },
    },
  }
}

export default MentorGroupDetail
