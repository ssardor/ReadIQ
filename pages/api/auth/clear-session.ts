import type { NextApiRequest, NextApiResponse } from 'next'

function clearCookieString(name: string) {
  const isProd = process.env.NODE_ENV === 'production'
  const parts = [
    `${name}=; Path=/`,
    'Max-Age=0',
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
    res.setHeader('Set-Cookie', [
      clearCookieString('sb-access-token'),
      clearCookieString('sb-refresh-token'),
    ])
    return res.status(200).json({ ok: true })
  } catch (e: any) {
    console.error('clear-session error:', e)
    return res.status(500).json({ message: 'Internal server error', error: e?.message })
  }
}
