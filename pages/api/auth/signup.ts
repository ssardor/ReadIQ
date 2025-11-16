import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseServer } from '@/lib/supabaseServer'

type SignUpRequestBody = {
  userId: string
  fullName: string
  role: 'student' | 'mentor'
  university?: string | null
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('=== SIGNUP API CALLED ===')
  console.log('Method:', req.method)
  console.log('Body:', JSON.stringify(req.body, null, 2))
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { userId, fullName, role, university }: SignUpRequestBody = req.body

    console.log('Parsed data:', { userId, fullName, role, university })

    // Validate required fields
    if (!userId || !fullName || !role) {
      console.log('❌ Missing required fields')
      return res.status(400).json({ 
        message: 'Missing required fields: userId, fullName, role' 
      })
    }

    if (!['student', 'mentor'].includes(role)) {
      console.log('❌ Invalid role:', role)
      return res.status(400).json({ 
        message: 'Invalid role. Must be student or mentor' 
      })
    }

    console.log('✅ Validation passed')

    // New strategy: attempt direct upsert and retry on foreign key violation instead of polling admin API.
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
  const maxAttempts = 20
  const baseDelay = 600 // ms
    let lastError: any = null
    let profileRow: any = null

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`🔄 Profile upsert attempt ${attempt}/${maxAttempts}`)
      const { data, error } = await supabaseServer
        .from('users_profiles')
        .upsert([
          {
            id: userId,
            full_name: fullName,
            role: role,
            university: university || null,
            email_verified: false
          }
        ], { onConflict: 'id' })
        .select()

      if (!error && data && data[0]) {
        profileRow = data[0]
        console.log('✅ Profile created on attempt', attempt)
        break
      }

      lastError = error
      const code = (error as any)?.code
      console.log(`Attempt ${attempt} failed. Code=${code} message=${error?.message}`)

      // Foreign key violation means auth user not visible yet; retry
      if (code === '23503') {
        const jitter = Math.floor(Math.random() * 250)
        const delay = Math.min(baseDelay * Math.pow(1.35, attempt - 1) + jitter, 5000)
        console.log(`⏳ FK violation (auth user not ready). Waiting ${Math.round(delay)}ms before retry.`)
        await sleep(delay)
        continue
      }

      // Other errors: break early
      console.log('❌ Non-retryable error during upsert. Aborting.')
      break
    }

    if (!profileRow) {
      // Provide clearer messaging for eventual consistency case
      if ((lastError as any)?.code === '23503') {
        res.setHeader('Retry-After', '3')
        return res.status(503).json({
          message: 'User record not propagated yet. Please retry in a few seconds.',
          retryable: true
        })
      }
      return res.status(500).json({
        message: 'Failed to create user profile',
        error: lastError?.message || 'Unknown error',
        code: (lastError as any)?.code || null
      })
    }

    return res.status(201).json({
      message: 'Profile created successfully',
      profile: profileRow
    })

  } catch (error: any) {
    console.error('❌ Sign up API error:', error)
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    })
  }
}
