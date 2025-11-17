import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import type { Quiz } from '@/lib/types'

export const QuizListTable: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
  const resp = await fetch('/api/mentor/quizzes', { credentials: 'include' })
    const json = await resp.json()
    if (resp.ok) setQuizzes(json.quizzes)
    else setError(json.message || 'Failed to load quizzes')
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  if (loading) return <div className="text-gray-600">Loading quizzes...</div>
  if (error) return <div className="text-red-600">{error}</div>

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white rounded-lg shadow">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left p-3 text-sm font-medium text-gray-600">Title</th>
            <th className="text-left p-3 text-sm font-medium text-gray-600">Created</th>
            <th className="text-left p-3 text-sm font-medium text-gray-600">Updated</th>
            <th className="text-right p-3 text-sm font-medium text-gray-600">Actions</th>
          </tr>
        </thead>
        <tbody>
          {quizzes.map((q, i) => (
            <motion.tr key={q.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="border-t">
              <td className="p-3">{q.title}</td>
              <td className="p-3">{new Date(q.created_at).toLocaleDateString()}</td>
              <td className="p-3">{new Date(q.updated_at).toLocaleDateString()}</td>
              <td className="p-3 text-right">
                <Link href={`/mentor/quizzes/${q.id}`} className="rounded border border-primary-200 px-3 py-1 text-sm font-medium text-primary-600 hover:bg-primary-50">
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
