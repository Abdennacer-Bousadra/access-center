import crypto from 'node:crypto'

export const CSRF_COOKIE = 'ac_csrf'

const CSRF_TTL_MS = 7 * 24 * 60 * 60 * 1000
const isProduction = process.env.NODE_ENV === 'production'

export function issueCsrfToken(req, res) {
  const existing = req.cookies?.[CSRF_COOKIE]
  if (typeof existing === 'string' && existing.length >= 32) return existing

  const token = crypto.randomBytes(32).toString('base64url')
  res.cookie(CSRF_COOKIE, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: CSRF_TTL_MS,
  })
  return token
}

export function isValidCsrfToken(candidate, expected) {
  if (typeof candidate !== 'string' || typeof expected !== 'string') return false
  const left = Buffer.from(candidate)
  const right = Buffer.from(expected)
  return left.length === right.length && crypto.timingSafeEqual(left, right)
}
