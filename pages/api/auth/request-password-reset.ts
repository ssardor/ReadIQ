import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabaseClient'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ message: 'Email is required' })
    }

    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset`
    })

    if (error) {
      console.error('Password reset error:', error)
      return res.status(500).json({ 
        message: 'Failed to send password reset email',
        error: error.message 
      })
    }

    return res.status(200).json({
      message: 'Password reset email sent successfully'
    })

  } catch (error: any) {
    console.error('Request password reset API error:', error)
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    })
  }
}
