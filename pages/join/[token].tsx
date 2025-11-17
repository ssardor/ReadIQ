import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'

const JoinGroupPage: React.FC = () => {
  const router = useRouter()
  const { token } = router.query
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'already' | 'error' | 'redirect'>('idle')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token || typeof token !== 'string') return

    const join = async () => {
      setStatus('loading')
      setMessage('Подключение к группе…')
      try {
        const response = await fetch('/api/student/groups/join-with-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ token }),
        })

        const payload = await response.json().catch(() => ({}))

        if (response.status === 401) {
          setStatus('redirect')
          setMessage('Перенаправляем на регистрацию студента…')
          if (typeof window !== 'undefined') {
            window.localStorage.setItem('pending-join-token', token)
          }
          router.replace(`/signup?joinToken=${encodeURIComponent(token)}&role=student`)
          return
        }

        if (!response.ok) {
          setStatus('error')
          setMessage(payload?.message || 'Не удалось присоединиться к группе')
          return
        }

        if (payload.alreadyMember) {
          setStatus('already')
          setMessage(payload.message || 'Вы уже состоите в группе.')
              setTimeout(() => router.push('/dashboard'), 2500)
          return
        }

        setStatus('success')
        setMessage(payload.message || 'Добро пожаловать!')
            setTimeout(() => router.push('/dashboard'), 2500)
      } catch (error: any) {
        console.error('Join group error', error)
        setStatus('error')
        setMessage('Произошла ошибка. Попробуйте позже или обратитесь к преподавателю.')
      }
    }

    join()
  }, [token, router])

  return (
    <>
      <Head>
        <title>Присоединение к группе • ReadIQ</title>
      </Head>
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow">
          <h1 className="text-xl font-semibold text-gray-900">Присоединение к группе</h1>
          <p className="mt-2 text-sm text-gray-600">
            {status === 'idle' && 'Подготавливаем подключение…'}
            {status === 'loading' && 'Проверяем QR-код и подключаем к группе…'}
            {status === 'success' && message}
            {status === 'already' && message}
            {status === 'redirect' && message}
            {status === 'error' && message}
          </p>
          {(status === 'success' || status === 'already') && (
            <p className="mt-4 text-sm text-gray-500">Сейчас вы будете перенаправлены в панель студента…</p>
          )}
        </div>
      </div>
    </>
  )
}

export default JoinGroupPage
