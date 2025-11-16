import type { Question } from '@/lib/types'

const DEEPSEEK_ENDPOINT = 'https://api.deepseek.com/v1/chat/completions'
const DEEPSEEK_MODEL = 'deepseek-chat'

export const DEFAULT_QUESTION_COUNT = 5
export const MIN_QUESTION_COUNT = 1
export const MAX_QUESTION_COUNT = 10

const systemPrompt = `You are an assistant that creates multiple-choice reading comprehension quizzes.

Requirements:
- Produce exactly the number of questions requested.
- Each question must be concise and tied to the provided topic/summary.
- Each question must include exactly four answer choices labelled A-D (strings in an array).
- Provide the index (0-based) of the correct choice in \"correct_index\".
- Respond ONLY with JSON using this schema:
{
  "questions": [
     {
       "text": "Question text",
       "choices": ["Choice A", "Choice B", "Choice C", "Choice D"],
       "correct_index": 0
     }
  ]
}
- Do not include markdown, commentary, or code fences.`

interface GenerateOptions {
  prompt: string
  questionCount: number
  apiKey: string
}

export async function requestQuizContentFromDeepseek({ prompt, questionCount, apiKey }: GenerateOptions) {
  const payload = {
    model: DEEPSEEK_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Topic / summary: ${prompt}\n\nNumber of questions: ${questionCount}`,
      },
    ],
    temperature: 0.8,
    top_p: 0.95,
    max_tokens: 1024,
  }

  const response = await fetch(DEEPSEEK_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`DeepSeek API error: ${response.status} ${errorText}`)
  }

  const json = await response.json()
  const content = json?.choices?.[0]?.message?.content
  if (typeof content !== 'string') {
    throw new Error('DeepSeek API returned an unexpected response')
  }

  return content
}

export function extractJsonPayload(raw: string) {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced && fenced[1]) {
    return fenced[1].trim()
  }

  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start !== -1 && end !== -1 && end > start) {
    return raw.slice(start, end + 1).trim()
  }

  return raw.trim()
}

export function parseQuestionsFromContent(raw: string): Question[] {
  try {
    const payload = extractJsonPayload(raw)
    const parsed = JSON.parse(payload)
    if (!parsed || !Array.isArray(parsed.questions)) {
      throw new Error('Malformed response: missing questions array')
    }
    const questions = parsed.questions.map((entry: any, index: number) => {
      if (!entry || typeof entry.text !== 'string') {
        throw new Error(`Question ${index + 1} missing text`)
      }
      if (!Array.isArray(entry.choices) || entry.choices.length !== 4) {
        throw new Error(`Question ${index + 1} must include exactly 4 choices`)
      }
      const sanitizedChoices = entry.choices.map((choice: any, choiceIndex: number) => {
        if (typeof choice !== 'string' || !choice.trim()) {
          throw new Error(`Question ${index + 1}, choice ${choiceIndex + 1} is invalid`)
        }
        return choice.trim()
      })
      const correctIndex = Number.isInteger(entry.correct_index)
        ? Number(entry.correct_index)
        : Number.isFinite(Number(entry.correct_index))
          ? Number(entry.correct_index)
          : 0
      const normalizedCorrect = correctIndex >= 0 && correctIndex < sanitizedChoices.length ? correctIndex : 0
      return {
        text: entry.text.trim(),
        choices: sanitizedChoices,
        correct_indexes: [normalizedCorrect],
      }
    })
    return questions
  } catch (error: any) {
    throw new Error(`Failed to parse AI response: ${error.message}`)
  }
}

export async function generateQuizQuestionsFromText(options: GenerateOptions) {
  const raw = await requestQuizContentFromDeepseek(options)
  return parseQuestionsFromContent(raw)
}
