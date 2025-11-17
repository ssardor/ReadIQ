import type { NextApiRequest, NextApiResponse } from 'next'
import { requireMentorApi } from '@/utils/apiAuth'
import {
  DEFAULT_QUESTION_COUNT,
  MAX_QUESTION_COUNT,
  MIN_QUESTION_COUNT,
  generateQuizQuestionsFromText,
} from '@/lib/ai/quizGenerator'

const ALLOWED_DIFFICULTIES = ['easy', 'medium', 'hard'] as const

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const origin = req.headers.origin || process.env.NEXT_PUBLIC_SITE_URL || ''
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
    res.setHeader('Access-Control-Allow-Credentials', 'true')
  }

  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    return res.status(204).end()
  }

  const mentor = await requireMentorApi(req, res)
  if (!mentor) return

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS')
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { prompt, questionCount, difficulty } = req.body || {}
  const normalizedDifficulty = typeof difficulty === 'string' ? difficulty.toLowerCase() : ''
  const difficultyValue = (ALLOWED_DIFFICULTIES as readonly string[]).includes(normalizedDifficulty)
    ? (normalizedDifficulty as 'easy' | 'medium' | 'hard')
    : 'medium'

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ message: 'Prompt is required' })
  }

  const count = Number.isInteger(questionCount)
    ? Math.min(Math.max(questionCount, MIN_QUESTION_COUNT), MAX_QUESTION_COUNT)
    : DEFAULT_QUESTION_COUNT

  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    console.error('Missing DEEPSEEK_API_KEY in environment', {
      envMatch: Object.keys(process.env).filter((key) => key.toUpperCase().includes('DEEPSEEK')),
      rawValueLength: process.env.DEEPSEEK_API_KEY?.length ?? null,
    })
    return res.status(500).json({ message: 'AI configuration missing. Contact support.' })
  }

  try {
  const questions = await generateQuizQuestionsFromText({ prompt: prompt.trim(), questionCount: count, apiKey, difficulty: difficultyValue })
    return res.status(200).json({ questions })
  } catch (error: any) {
    console.error('AI generation error:', error)
    return res.status(500).json({ message: error?.message || 'Не удалось сгенерировать квиз' })
  }
}
