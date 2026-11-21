import crypto from 'node:crypto'

export const SESSION_COOKIE = 'ac_session'

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000
const isProduction = process.env.NODE_ENV === 'production'

let devSecret = null

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET
  if (secret) {
    if (secret.length < 32) {
      throw new Error('SESSION_SECRET must be at least 32 characters long.')
    }
    return secret
  }

  if (isProduction) {
    throw new Error('SESSION_SECRET is required in production.')
  }

  if (!devSecret) {
    devSecret = crypto.randomBytes(48).toString('hex')
    console.warn(
      '[auth] SESSION_SECRET is not set — using an ephemeral development secret. Sessions reset when the server restarts.'
    )
  }
  return devSecret
}

export function assertSessionConfig() {
  getSessionSecret()
}

function safeEqual(leftValue, rightValue) {
  const left = Buffer.from(leftValue)
  const right = Buffer.from(rightValue)
  return left.length === right.length && crypto.timingSafeEqual(left, right)
}

function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = crypto
    .createHmac('sha256', getSessionSecret())
    .update(body)
    .digest('base64url')
  return `${body}.${signature}`
}

export function createSessionToken(userId) {
  const now = Date.now()
  return sign({ sub: String(userId), iat: now, exp: now + SESSION_TTL_MS })
}

export function verifySessionToken(token) {
  if (typeof token !== 'string') return null

  const parts = token.split('.')
  if (parts.length !== 2) return null

  const [body, signature] = parts
  const expected = crypto
    .createHmac('sha256', getSessionSecret())
    .update(body)
    .digest('base64url')

  if (!safeEqual(signature, expected)) return null

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
    if (!payload?.sub || !payload?.exp || payload.exp <= Date.now()) return null
    return payload
  } catch {
    return null
  }
}

function cookieOptions(maxAge) {
  const options = {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
  }
  if (maxAge) options.maxAge = maxAge
  return options
}

export function setSessionCookie(res, userId) {
  res.cookie(SESSION_COOKIE, createSessionToken(userId), cookieOptions(SESSION_TTL_MS))
}

export function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE, cookieOptions())
}
