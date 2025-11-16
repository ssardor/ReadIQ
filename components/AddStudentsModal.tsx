import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useToasts } from '@/components/ToastProvider'

export type AddStudentsModalProps = {
  groupId: string
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export type EmailResult = {
  email: string
  status: 'added' | 'already_member' | 'invited' | 'already_invited' | 'failed'
  notes?: string
  reason?: string
}

function extractEmails(raw: string): string[] {
  return raw
    .split(/\r?\n|,|;/)
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.length > 0)
}

function mergeEmailLists(...lists: string[][]) {
  const set = new Set<string>()
  lists.flat().forEach((email) => {
    if (email) set.add(email)
  })
  return Array.from(set)
}

function statusChip(result: EmailResult) {
  const base = 'px-2 py-1 rounded text-xs font-medium'
  switch (result.status) {
    case 'added':
      return <span className={`${base} bg-green-100 text-green-700`}>Добавлен</span>
    case 'invited':
      return <span className={`${base} bg-amber-100 text-amber-700`}>Приглашён</span>
    case 'already_member':
      return <span className={`${base} bg-blue-100 text-blue-700`}>Уже в группе</span>
    case 'already_invited':
      return <span className={`${base} bg-gray-100 text-gray-600`}>Приглашение отправлено ранее</span>
    case 'failed':
    default:
      return <span className={`${base} bg-red-100 text-red-700`}>Ошибка</span>
  }
}

export const AddStudentsModal: React.FC<AddStudentsModalProps> = ({ groupId, isOpen, onClose, onSuccess }) => {
  const { push } = useToasts()
  const [singleEmail, setSingleEmail] = useState('')
  const [bulkEmails, setBulkEmails] = useState('')
  const [csvSummary, setCsvSummary] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [results, setResults] = useState<EmailResult[]>([])

  const selectionPreview = useMemo(() => {
    return mergeEmailLists(singleEmail ? [singleEmail.trim()] : [], extractEmails(bulkEmails), csvSummary)
  }, [singleEmail, bulkEmails, csvSummary])

  const handleCsvUpload: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : ''
      const rows = extractEmails(text)
      setCsvSummary(rows)
      push(`Импортировано из CSV: ${rows.length} email`, 'info')
    }
    reader.onerror = () => push('Не удалось прочитать CSV файл', 'error')
    reader.readAsText(file)
  }

  const handleSubmit: React.FormEventHandler = async (event) => {
    event.preventDefault()
    const emails = mergeEmailLists(singleEmail ? [singleEmail] : [], extractEmails(bulkEmails), csvSummary)

    if (!emails.length) {
      push('Добавьте хотя бы один email', 'error')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/mentor/groups/${groupId}/add-students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails }),
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.message || 'Не удалось добавить студентов')
      }

      setResults(payload.results ?? [])
      if (payload.summary?.added || payload.summary?.invited) {
        push(`Добавлено ${payload.summary.added || 0}, приглашено ${payload.summary.invited || 0}`, 'success')
      } else {
        push('Нет новых студентов. Проверьте статусы.', 'info')
      }

      setSingleEmail('')
      setBulkEmails('')
      setCsvSummary([])
      onSuccess?.()
    } catch (error: any) {
      push(error?.message ?? 'Ошибка при добавлении студентов', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResendInvite = async (email: string) => {
    // Placeholder for resend invite endpoint when implemented
    push(`Повторная отправка приглашения ${email} пока недоступна`, 'info')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="w-full max-w-3xl rounded-lg bg-white shadow-xl" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}>
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-xl font-semibold">Добавить студентов</h2>
                <p className="text-sm text-gray-500">Укажите email студентов или загрузите CSV файл. Поддерживается массовое добавление.</p>
              </div>
              <button onClick={onClose} className="rounded-md p-2 text-gray-500 hover:bg-gray-100" aria-label="Закрыть">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 px-6 py-5">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-gray-700">Один email</span>
                  <input type="email" value={singleEmail} onChange={(e) => setSingleEmail(e.target.value)} placeholder="student@university.edu" className="w-full rounded border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-gray-700">CSV список</span>
                  <input type="file" accept=".csv" onChange={handleCsvUpload} className="w-full text-sm text-gray-600 file:mr-4 file:rounded file:border file:border-primary-200 file:bg-primary-50 file:px-3 file:py-2 file:text-primary-700 hover:file:bg-primary-100" />
                  {csvSummary.length > 0 && <span className="text-xs text-gray-500">Загружено адресов: {csvSummary.length}</span>}
                </label>
              </div>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-gray-700">Несколько email (по одному на строке)</span>
                <textarea value={bulkEmails} onChange={(e) => setBulkEmails(e.target.value)} rows={6} placeholder="student1@university.edu\nstudent2@college.edu" className="w-full rounded border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
              </label>

              {selectionPreview.length > 0 && (
                <div className="rounded border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
                  <strong className="font-semibold text-gray-700">Будут обработаны ({selectionPreview.length}):</strong>
                  <div className="mt-2 grid gap-1 md:grid-cols-2">
                    {selectionPreview.slice(0, 12).map((email) => (
                      <span key={email} className="truncate">{email}</span>
                    ))}
                  </div>
                  {selectionPreview.length > 12 && <div className="mt-2 text-xs text-gray-500">и ещё {selectionPreview.length - 12}</div>}
                </div>
              )}

              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">Повторное добавление email не создаёт дубликаты: существующие студенты будут пропущены, приглашения обновлены.</p>
                <button type="submit" disabled={isSubmitting} className="rounded bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50">
                  {isSubmitting ? 'Обработка…' : 'Отправить приглашения'}
                </button>
              </div>
            </form>

            {results.length > 0 && (
              <div className="px-6 pb-6">
                <h3 className="mb-3 text-sm font-semibold text-gray-700">Результаты</h3>
                <div className="max-h-64 overflow-y-auto rounded border border-gray-200">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      <tr>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Статус</th>
                        <th className="px-4 py-3">Комментарий</th>
                        <th className="px-4 py-3 text-right">Действия</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {results.map((result) => (
                        <tr key={result.email} className="bg-white">
                          <td className="px-4 py-3 font-medium text-gray-800">{result.email}</td>
                          <td className="px-4 py-3">{statusChip(result)}</td>
                          <td className="px-4 py-3 text-gray-600">{result.notes || result.reason || '—'}</td>
                          <td className="px-4 py-3 text-right">
                            {result.status === 'invited' && (
                              <button type="button" onClick={() => handleResendInvite(result.email)} className="text-xs font-medium text-primary-600 hover:text-primary-700">
                                Отправить повторно
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
