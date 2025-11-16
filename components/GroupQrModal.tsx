import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import QRCode from 'react-qr-code'
import { useToasts } from '@/components/ToastProvider'

export type GroupQrModalProps = {
  groupId: string
  isOpen: boolean
  onClose: () => void
  onRefreshRequested?: () => void
}

type QrSession = {
  id: string
  token: string
  status: 'active' | 'expired' | 'revoked'
  createdAt: string
  expiresAt: string
  consumedCount: number
  lastConsumedAt: string | null
  ttlSeconds: number
  joinUrl: string
}

type ApiResponse = {
  session: QrSession | null
  ttlMinutes: number
}

const REFRESH_INTERVAL = 10_000

const formatCountdown = (seconds: number) => {
  const clamped = Math.max(0, seconds)
  const m = Math.floor(clamped / 60)
  const s = clamped % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export const GroupQrModal: React.FC<GroupQrModalProps> = ({ groupId, isOpen, onClose, onRefreshRequested }) => {
  const { push } = useToasts()
  const [session, setSession] = useState<QrSession | null>(null)
  const [ttlSeconds, setTtlSeconds] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const joinUrl = session?.joinUrl ?? ''

  const loadSession = useCallback(
    async (mode: 'GET' | 'POST', opts?: { skipSpinner?: boolean }) => {
      if (!opts?.skipSpinner) {
        setIsLoading(true)
      }
      if (mode === 'POST') {
        setError(null)
      }
      try {
        const response = await fetch(`/api/mentor/groups/${groupId}/qr-session`, {
          method: mode,
          headers: { 'Content-Type': 'application/json' },
        })

        const payload: ApiResponse = await response.json()
        if (!response.ok) {
          throw new Error((payload as any)?.message || 'Не удалось создать QR-сессию')
        }

        if (!payload.session) {
          setSession(null)
          setTtlSeconds(0)
          setError('QR-сессия не активна. Попробуйте создать новую позже.')
          return null
        }

        setSession(payload.session)
        setTtlSeconds(payload.session.ttlSeconds)
        return payload.session
      } catch (err: any) {
        console.error('Failed to load QR session', err)
        setError(err?.message ?? 'Не удалось создать QR-сессию')
        return null
      } finally {
        if (!opts?.skipSpinner) {
          setIsLoading(false)
        }
      }
    },
    [groupId],
  )

  useEffect(() => {
    if (!isOpen) {
      setSession(null)
      setError(null)
      setTtlSeconds(0)
      return
    }

    let canceled = false
    const bootstrap = async () => {
  const active = await loadSession('POST')
      if (!active || canceled) return
      if (active.status !== 'active') {
        setError('QR-сессия недоступна')
      }
    }
    bootstrap()

    return () => {
      canceled = true
    }
  }, [isOpen, loadSession])

  useEffect(() => {
    if (!isOpen || !session) return

    const tick = setInterval(() => {
      setTtlSeconds((prev) => Math.max(0, prev - 1))
    }, 1000)

    return () => clearInterval(tick)
  }, [isOpen, session])

  useEffect(() => {
    if (!isOpen || !session) return

    const poll = setInterval(() => {
      loadSession('GET', { skipSpinner: true })
    }, REFRESH_INTERVAL)

    return () => clearInterval(poll)
  }, [isOpen, session, loadSession])

  const handleCopy = useCallback(async () => {
    if (!joinUrl) return
    try {
      await navigator.clipboard.writeText(joinUrl)
      push('Ссылка скопирована в буфер обмена', 'success')
    } catch (err) {
      console.error('Copy link failed', err)
      push('Не удалось скопировать ссылку', 'error')
    }
  }, [joinUrl, push])

  const handleClose = useCallback(() => {
    onClose()
    onRefreshRequested?.()
  }, [onClose, onRefreshRequested])

  const handleRevoke = useCallback(async () => {
    if (!session) {
      handleClose()
      return
    }

    try {
      const response = await fetch(`/api/mentor/groups/${groupId}/qr-session`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.id }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.message || 'Не удалось завершить сессию')
      }

      push('QR-сессия завершена', 'info')
      setSession(null)
      setTtlSeconds(0)
      handleClose()
    } catch (err: any) {
      console.error('Revoke QR session failed', err)
      push(err?.message ?? 'Не удалось завершить сессию', 'error')
    }
  }, [session, groupId, handleClose, push])

  const countdownLabel = useMemo(() => {
    if (!session) return '00:00'
    return formatCountdown(ttlSeconds)
  }, [session, ttlSeconds])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="relative w-full max-w-xl rounded-lg bg-white shadow-xl" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}>
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">QR-присоединение к группе</h2>
                <p className="text-xs text-gray-500">Покажите студентам QR-код, чтобы они могли вступить в группу без приглашения.</p>
              </div>
              <button onClick={handleClose} className="rounded p-1 text-gray-500 hover:bg-gray-100" aria-label="Закрыть">
                ✕
              </button>
            </div>

            <div className="space-y-6 px-6 py-5">
              {error && (
                <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {session && !error && (
                <div className="grid gap-6 md:grid-cols-[minmax(0,240px)_1fr]">
                  <div className="flex flex-col items-center gap-3">
                    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                      <QRCode value={joinUrl} size={200} bgColor="#FFFFFF" fgColor="#111827" />
                    </div>
                    <div className="flex w-full items-center justify-center gap-2 text-sm text-gray-600">
                      <span className="font-medium text-gray-800">Осталось:</span>
                      <span className="rounded bg-gray-100 px-2 py-1 font-mono text-sm text-gray-700">{countdownLabel}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800">Ссылка для присоединения</h3>
                      <p className="mt-1 break-all rounded border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700">{joinUrl}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button type="button" onClick={handleCopy} className="rounded bg-primary-600 px-3 py-2 text-xs font-medium text-white hover:bg-primary-700">
                          Скопировать ссылку
                        </button>
                        <a href={joinUrl} target="_blank" rel="noopener noreferrer" className="rounded border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100">
                          Открыть в новой вкладке
                        </a>
                      </div>
                    </div>

                    <div className="grid gap-3 rounded border border-gray-100 bg-gray-50 p-4 text-sm text-gray-700">
                      <div className="flex items-center justify-between">
                        <span>Всего переходов</span>
                        <span className="font-semibold text-gray-900">{session.consumedCount}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Последнее использование</span>
                        <span className="font-medium text-gray-800">{session.lastConsumedAt ? new Date(session.lastConsumedAt).toLocaleString() : '—'}</span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-500">
                      QR-сессия автоматически истекает через {Math.ceil(ttlSeconds / 60) || 0} минут после создания. При необходимости вы можете завершить её вручную.
                    </p>
                  </div>
                </div>
              )}

              {isLoading && !session && !error && (
                <div className="flex flex-col items-center gap-2 py-6 text-sm text-gray-600">
                  <span className="animate-pulse">Подготавливаем QR-код…</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t bg-gray-50 px-6 py-4">
              <p className="text-xs text-gray-500">Советуйте студентам авторизоваться как студенты перед сканированием QR-кода.</p>
              <div className="flex items-center gap-2">
                <button onClick={handleRevoke} disabled={!session} className="rounded border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50">
                  Завершить сессию
                </button>
                <button onClick={handleClose} className="rounded bg-primary-600 px-3 py-2 text-xs font-medium text-white hover:bg-primary-700">
                  Закрыть
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
