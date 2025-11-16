import type { NextApiRequest, NextApiResponse } from 'next'

function cookieString(name: string, value: string, maxAgeSeconds: number) {
  const isProd = process.env.NODE_ENV === 'production'
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    `Max-Age=${maxAgeSeconds}`,
    'HttpOnly',
    'SameSite=Lax',
  ]
  if (isProd) parts.push('Secure')
  return parts.join('; ')
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { access_token, refresh_token, expires_in } = req.body || {}

    if (!access_token || !refresh_token) {
      return res.status(400).json({ message: 'Missing access_token or refresh_token' })
    }

    const maxAge = typeof expires_in === 'number' && expires_in > 0 ? expires_in : 60 * 60 * 24 * 7 // 7 days

    res.setHeader('Set-Cookie', [
      cookieString('sb-access-token', access_token, maxAge),
      cookieString('sb-refresh-token', refresh_token, maxAge),
    ])

    return res.status(200).json({ ok: true })
  } catch (e: any) {
    console.error('set-session error:', e)
    return res.status(500).json({ message: 'Internal server error', error: e?.message })
  }
}
