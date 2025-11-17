import type { NextApiRequest, NextApiResponse } from 'next'
import formidable, { type Fields, type Files, type File as FormidableFile } from 'formidable'
import fs from 'node:fs/promises'
import { PDFParse } from 'pdf-parse'
import { requireMentorApi } from '@/utils/apiAuth'
import {
  DEFAULT_QUESTION_COUNT,
  MAX_QUESTION_COUNT,
  MIN_QUESTION_COUNT,
  generateQuizQuestionsFromText,
} from '@/lib/ai/quizGenerator'

export const config = {
  api: {
    bodyParser: false,
  },
}

const MAX_PDF_TEXT_LENGTH = 45000
const MAX_UPLOAD_SIZE = 30 * 1024 * 1024 // 30MB
const ALLOWED_DIFFICULTIES = ['easy', 'medium', 'hard'] as const

async function parseMultipart(req: NextApiRequest) {
  const form = formidable({
    multiples: false,
    keepExtensions: false,
    maxFileSize: MAX_UPLOAD_SIZE,
  })

  return new Promise<{ fields: Fields; files: Files }>((resolve, reject) => {
    form.parse(req, (err: Error | null, fields: Fields, files: Files) => {
      if (err) reject(err)
      else resolve({ fields, files })
    })
  })
}

function coerceQuestionCount(raw: string | string[] | undefined) {
  const value = Array.isArray(raw) ? raw[0] : raw
  const parsed = value ? Number.parseInt(String(value), 10) : Number.NaN
  return Number.isInteger(parsed)
    ? Math.min(Math.max(parsed, MIN_QUESTION_COUNT), MAX_QUESTION_COUNT)
    : DEFAULT_QUESTION_COUNT
}

function coerceDifficulty(raw: string | string[] | undefined) {
  const value = Array.isArray(raw) ? raw[0] : raw
  if (!value) return 'medium'
  const normalized = String(value).toLowerCase()
  return (ALLOWED_DIFFICULTIES as readonly string[]).includes(normalized)
    ? (normalized as 'easy' | 'medium' | 'hard')
    : 'medium'
}

function pickFile(fileField: Files['file'] | undefined): FormidableFile | null {
  const file = Array.isArray(fileField) ? fileField[0] : fileField
  if (!file) return null
  return file as FormidableFile
}

function normalizeSourceText(input: string) {
  const collapsed = input.replace(/\r/g, '').replace(/\n{3,}/g, '\n\n')
  if (collapsed.length <= MAX_PDF_TEXT_LENGTH) {
    return collapsed.trim()
  }
  return `${collapsed.slice(0, MAX_PDF_TEXT_LENGTH)}...`
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    return res.status(204).end()
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS')
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const mentor = await requireMentorApi(req, res)
  if (!mentor) return

  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    console.error('Missing DEEPSEEK_API_KEY in environment', {
      envMatch: Object.keys(process.env).filter((key) => key.toUpperCase().includes('DEEPSEEK')),
      rawValueLength: process.env.DEEPSEEK_API_KEY?.length ?? null,
    })
    return res.status(500).json({ message: 'AI configuration missing. Contact support.' })
  }

  try {
    const { fields, files } = await parseMultipart(req)
    const uploaded = pickFile(files.file)
    if (!uploaded) {
      return res.status(400).json({ message: 'Файл не получен' })
    }
    if (!uploaded.mimetype || !uploaded.mimetype.includes('pdf')) {
      return res.status(400).json({ message: 'Поддерживаются только PDF файлы' })
    }

  const questionCount = coerceQuestionCount(fields.questionCount)
  const difficulty = coerceDifficulty(fields.difficulty)
    const buffer = await fs.readFile(uploaded.filepath)
    await fs.unlink(uploaded.filepath).catch(() => {})

    const parser = new PDFParse({ data: buffer })
    let extractedText: string | undefined
    try {
      const textResult = await parser.getText()
      extractedText = textResult.text?.trim()
    } finally {
      await parser.destroy().catch(() => {})
    }
  if (!extractedText) {
      return res.status(400).json({ message: 'Не удалось извлечь текст из PDF' })
    }

    const sourceText = normalizeSourceText(extractedText)
    const prompt = `Use the following text extracted from a PDF document to craft assessment questions:\n\n${sourceText}`

  const questions = await generateQuizQuestionsFromText({ prompt, questionCount, apiKey, difficulty })
    return res.status(200).json({ questions })
  } catch (error: any) {
    console.error('AI file generation error:', error)
    const message = error?.message || 'Не удалось сгенерировать квиз'
    const statusCode = error?.httpCode && Number.isInteger(error.httpCode) ? error.httpCode : 500
    return res.status(statusCode).json({ message })
  }
}
