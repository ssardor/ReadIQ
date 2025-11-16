import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import type { Group, Question } from '@/lib/types'

type Props = {
  onCreated?: (quizId: string) => void
}

export const QuizBuilderWizard: React.FC<Props> = ({ onCreated }) => {
  const [step, setStep] = useState(1)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(false)
  const [aiGenerating, setAiGenerating] = useState(false)
  const [creationMode, setCreationMode] = useState<'manual' | 'ai-text' | 'ai-file'>('manual')
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiQuestionCount, setAiQuestionCount] = useState(5)
  const [aiFile, setAiFile] = useState<File | null>(null)
  const [aiFileError, setAiFileError] = useState('')
  const [groups, setGroups] = useState<Group[]>([])
  const [groupsLoading, setGroupsLoading] = useState(true)
  const [groupsError, setGroupsError] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const MAX_AI_FILE_SIZE_BYTES = 12 * 1024 * 1024

  useEffect(() => {
    const loadGroups = async () => {
      setGroupsLoading(true)
      setGroupsError('')
      try {
        const response = await fetch('/api/mentor/groups')
        const payload = await response.json()
        if (!response.ok) throw new Error(payload?.message || 'Не удалось загрузить группы')
        setGroups(payload.groups ?? [])
      } catch (error: any) {
        setGroupsError(error?.message || 'Ошибка при загрузке групп')
      } finally {
        setGroupsLoading(false)
      }
    }
    loadGroups()
  }, [])

  const addQuestion = () => setQuestions(prev => [...prev, { text: '', choices: ['A','B','C','D'], correct_indexes: [0] }])

  const resetWizard = () => {
    setStep(1)
    setTitle('')
    setDescription('')
    setQuestions([])
    setSelectedGroupId('')
    setCreationMode('manual')
    setAiPrompt('')
    setAiQuestionCount(5)
    setAiGenerating(false)
    setAiFile(null)
    setAiFileError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleGenerateQuestionsFromText = async () => {
    setAiGenerating(true)
    try {
      const response = await fetch('/api/mentor/quizzes/generate-from-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt, questionCount: aiQuestionCount }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.message || 'Не удалось сгенерировать вопросы')
      if (!Array.isArray(payload.questions) || payload.questions.length === 0) {
        throw new Error('AI не вернул вопросы. Попробуйте уточнить описание.')
      }
      setQuestions(payload.questions)
      setStep(2)
    } catch (error: any) {
      alert(error?.message || 'Ошибка AI генерации')
    } finally {
      setAiGenerating(false)
    }
  }

  const handleGenerateQuestionsFromFile = async () => {
    if (!aiFile) {
      alert('Загрузите PDF файл перед генерацией')
      return
    }
    setAiGenerating(true)
    setAiFileError('')
    try {
      const payload = new FormData()
      payload.append('file', aiFile)
      payload.append('questionCount', String(aiQuestionCount))

      const response = await fetch('/api/mentor/quizzes/generate-from-file', {
        method: 'POST',
        body: payload,
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.message || 'Не удалось сгенерировать вопросы')
      if (!Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error('AI не вернул вопросы. Попробуйте другой документ.')
      }
      setQuestions(data.questions)
      setStep(2)
    } catch (error: any) {
      const message = error?.message || 'Ошибка AI генерации'
      setAiFileError(message)
      alert(message)
    } finally {
      setAiGenerating(false)
    }
  }

  const handleAiFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAiFileError('')
    const file = event.target.files?.[0]
    if (!file) {
      setAiFile(null)
      event.target.value = ''
      return
    }
    if (!file.type?.includes('pdf')) {
      setAiFile(null)
      setAiFileError('Поддерживаются только PDF файлы')
      event.target.value = ''
      return
    }
    if (file.size > MAX_AI_FILE_SIZE_BYTES) {
      setAiFile(null)
      setAiFileError('Файл слишком большой (максимум 12 МБ)')
      event.target.value = ''
      return
    }
    setAiFile(file)
  }

  const clearAiFile = () => {
    setAiFile(null)
    setAiFileError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleNextFromStep1 = async () => {
    if (creationMode === 'manual') {
      if (questions.length === 0) {
        setQuestions([{ text: '', choices: ['A', 'B', 'C', 'D'], correct_indexes: [0] }])
      }
      setStep(2)
      return
    }

    if (creationMode === 'ai-text') {
      if (!aiPrompt.trim()) {
        alert('Опишите тему квиза для AI')
        return
      }
      await handleGenerateQuestionsFromText()
      return
    }

    if (!aiFile) {
      alert('Загрузите PDF файл для AI')
      return
    }

    await handleGenerateQuestionsFromFile()
  }

  const createQuiz = async () => {
    if (!selectedGroupId) {
      alert('Выберите группу для квиза')
      return
    }
    setLoading(true)
    try {
      const quizResponse = await fetch('/api/mentor/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, questions }),
      })
      const quizPayload = await quizResponse.json()
      if (!quizResponse.ok) throw new Error(quizPayload?.message || 'Не удалось создать квиз')

      const quizId = quizPayload.quiz.id
      const instanceResponse = await fetch(`/api/mentor/quizzes/${quizId}/instances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_id: selectedGroupId, status: 'scheduled', duration_seconds: 300 }),
      })
      const instancePayload = await instanceResponse.json().catch(() => ({}))
      if (!instanceResponse.ok) {
        throw new Error(instancePayload?.message || 'Квиз создан, но не удалось привязать группу')
      }

      onCreated?.(quizId)
      resetWizard()
    } catch (error: any) {
      alert(error?.message || 'Ошибка при создании квиза')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
        <span className={step>=1? 'font-semibold text-primary-600':''}>1. Basic</span> →
        <span className={step>=2? 'font-semibold text-primary-600':''}>2. Questions</span> →
        <span className={step>=3? 'font-semibold text-primary-600':''}>3. Review</span>
      </div>
      {step === 1 && (
        <motion.div initial={{ opacity:0, y:10}} animate={{ opacity:1, y:0 }}>
          <div className="space-y-3">
            <div>
              <label className="block text-sm mb-1">Title</label>
              <input value={title} onChange={e=>setTitle(e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm mb-1">Description</label>
              <textarea value={description} onChange={e=>setDescription(e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm mb-1">Способ создания</label>
              <div className="grid gap-2 md:grid-cols-3">
                <button
                  type="button"
                  onClick={() => setCreationMode('manual')}
                  className={`rounded border px-3 py-2 text-left text-sm transition ${creationMode === 'manual' ? 'border-primary-400 bg-primary-50 text-primary-700' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <div className="font-semibold">Ручной режим</div>
                  <div className="text-xs text-gray-500">Самостоятельно заполните вопросы и ответы.</div>
                </button>
                <button
                  type="button"
                  onClick={() => setCreationMode('ai-text')}
                  className={`rounded border px-3 py-2 text-left text-sm transition ${creationMode === 'ai-text' ? 'border-primary-400 bg-primary-50 text-primary-700' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <div className="font-semibold">AI из текста</div>
                  <div className="text-xs text-gray-500">Опишите материал — AI подготовит квиз.</div>
                </button>
                <button
                  type="button"
                  onClick={() => setCreationMode('ai-file')}
                  className={`rounded border px-3 py-2 text-left text-sm transition ${creationMode === 'ai-file' ? 'border-primary-400 bg-primary-50 text-primary-700' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <div className="font-semibold">AI из PDF</div>
                  <div className="text-xs text-gray-500">Загрузите документ — AI извлечёт текст и создаст квиз.</div>
                </button>
              </div>
            </div>
            {creationMode === 'ai-text' && (
              <div className="space-y-3 rounded border border-primary-100 bg-primary-50/50 p-4">
                <div>
                  <label className="block text-sm mb-1">Описание для AI</label>
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    rows={4}
                    className="w-full rounded border px-3 py-2"
                    placeholder="Например: прочитай текст о круговороте воды и подготовь вопросы для проверки понимания"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Количество вопросов</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={aiQuestionCount}
                    onChange={(e) => setAiQuestionCount(Number(e.target.value) || 1)}
                    className="w-32 rounded border px-3 py-2"
                  />
                </div>
                <p className="text-xs text-gray-500">AI сгенерирует тест и его можно будет отредактировать на следующем шаге.</p>
              </div>
            )}
            {creationMode === 'ai-file' && (
              <div className="space-y-3 rounded border border-primary-100 bg-primary-50/50 p-4">
                <div>
                  <label className="block text-sm mb-1">PDF документ</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={handleAiFileChange}
                    className="w-full rounded border bg-white px-3 py-2"
                  />
                  {aiFile && (
                    <div className="mt-2 flex items-center justify-between rounded border border-dashed border-primary-200 bg-white px-3 py-2 text-xs text-primary-700">
                      <span className="truncate" title={aiFile.name}>{aiFile.name}</span>
                      <button type="button" onClick={clearAiFile} className="ml-2 text-primary-500 hover:text-primary-700">Удалить</button>
                    </div>
                  )}
                  {aiFileError && <div className="mt-1 text-xs text-red-600">{aiFileError}</div>}
                </div>
                <div>
                  <label className="block text-sm mb-1">Количество вопросов</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={aiQuestionCount}
                    onChange={(e) => setAiQuestionCount(Number(e.target.value) || 1)}
                    className="w-32 rounded border px-3 py-2"
                  />
                </div>
                <p className="text-xs text-gray-500">Документ будет преобразован в текст, после чего AI сгенерирует вопросы. При необходимости отредактируйте их на следующем шаге.</p>
              </div>
            )}
            <div>
              <label className="block text-sm mb-1">Assign to group</label>
              {groupsLoading ? (
                <div className="text-sm text-gray-500">Загрузка групп…</div>
              ) : groupsError ? (
                <div className="text-sm text-red-600">{groupsError}</div>
              ) : groups.length === 0 ? (
                <div className="rounded border border-dashed border-gray-300 bg-gray-50 p-3 text-sm text-gray-500">
                  Пока нет доступных групп. <Link href="/mentor/groups" className="font-medium text-primary-600">Создайте группу</Link>, затем вернитесь.
                </div>
              ) : (
                <select value={selectedGroupId} onChange={(e) => setSelectedGroupId(e.target.value)} className="w-full rounded border px-3 py-2">
                  <option value="">Выберите группу…</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}{group.term ? ` • ${group.term}` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
          <div className="mt-6 text-right">
            <button
              onClick={handleNextFromStep1}
              disabled={!title.trim() || !selectedGroupId || groupsLoading || groups.length === 0 || aiGenerating}
              className="px-4 py-2 rounded bg-primary-600 text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {aiGenerating ? 'Генерация…' : 'Next'}
            </button>
          </div>
        </motion.div>
      )}
      {step === 2 && (
        <motion.div initial={{ opacity:0, y:10}} animate={{ opacity:1, y:0 }}>
          <div className="mb-3 flex justify-between items-center">
            <h3 className="text-lg font-semibold">Questions</h3>
            <button onClick={addQuestion} className="px-3 py-2 rounded bg-gray-100">Add Question</button>
          </div>
          <div className="space-y-4">
            {questions.map((q, idx) => (
              <div key={idx} className="border rounded p-3">
                <input value={q.text} onChange={e=>{
                  const v = e.target.value; setQuestions(prev=> prev.map((qq,i)=> i===idx? { ...qq, text: v }: qq))
                }} placeholder={`Question #${idx+1}`} className="w-full border rounded px-3 py-2 mb-2" />
                <div className="grid md:grid-cols-2 gap-2">
                  {q.choices.map((c, ci)=> (
                    <input key={ci} value={c} onChange={e=>{
                      const v = e.target.value; setQuestions(prev=> prev.map((qq,i)=> i===idx? { ...qq, choices: qq.choices.map((cc,cci)=> cci===ci? v: cc)}: qq))
                    }} className="w-full border rounded px-3 py-2" />
                  ))}
                </div>
              </div>
            ))}
            {questions.length === 0 && <div className="text-gray-500">No questions yet. Click “Add Question”.</div>}
          </div>
          <div className="mt-6 flex justify-between">
            <button onClick={()=>setStep(1)} className="px-3 py-2 rounded border">Back</button>
            <button
              onClick={() => {
                if (!questions.length) {
                  alert('Добавьте минимум один вопрос')
                  return
                }
                setStep(3)
              }}
              className="px-4 py-2 rounded bg-primary-600 text-white"
            >
              Next
            </button>
          </div>
        </motion.div>
      )}
      {step === 3 && (
        <motion.div initial={{ opacity:0, y:10}} animate={{ opacity:1, y:0 }}>
          <div>
            <div className="text-sm text-gray-600 mb-2">Review</div>
            <div className="font-semibold">{title}</div>
            <div className="text-gray-600">{description || '—'}</div>
            <div className="mt-2 text-sm text-gray-600">Группа: {groups.find((g) => g.id === selectedGroupId)?.name || '—'}</div>
            <div className="mt-4 text-sm">Questions: {questions.length}</div>
          </div>
          <div className="mt-6 flex justify-between">
            <button onClick={()=>setStep(2)} className="px-3 py-2 rounded border">Back</button>
            <button onClick={createQuiz} disabled={loading} className="px-4 py-2 rounded bg-green-600 text-white">{loading? 'Creating...':'Create Quiz'}</button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
