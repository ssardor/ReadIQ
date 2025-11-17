import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import type { Group } from '@/lib/types'

export const GroupListTable: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
  const resp = await fetch('/api/mentor/groups', { credentials: 'include' })
    const json = await resp.json()
    if (resp.ok) setGroups(json.groups)
    else setError(json.message || 'Failed to load groups')
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  if (loading) return <div className="text-gray-600">Loading groups...</div>
  if (error) return <div className="text-red-600">{error}</div>

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white rounded-lg shadow">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left p-3 text-sm font-medium text-gray-600">Group name</th>
            <th className="text-left p-3 text-sm font-medium text-gray-600">Term</th>
            <th className="text-left p-3 text-sm font-medium text-gray-600">Created</th>
            <th className="text-right p-3 text-sm font-medium text-gray-600">Actions</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((g, i) => (
            <motion.tr key={g.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="border-t">
              <td className="p-3">{g.name}</td>
              <td className="p-3">{g.term || '—'}</td>
              <td className="p-3">{new Date(g.created_at).toLocaleDateString()}</td>
              <td className="p-3 text-right">
                <Link href={`/mentor/groups/${g.id}`} className="rounded border border-primary-200 px-3 py-1 text-sm font-medium text-primary-600 hover:bg-primary-50">
                  Manage
                </Link>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
