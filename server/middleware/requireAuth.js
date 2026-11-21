import { ApiError } from '../lib/apiError.js'
import { clearSessionCookie, SESSION_COOKIE, verifySessionToken } from '../lib/session.js'
import { findUserById } from '../lib/users.js'

export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.[SESSION_COOKIE]
    const payload = token ? verifySessionToken(token) : null

    if (!payload) return next(new ApiError(401, 'UNAUTHORIZED'))

    // Always read the current row: role and active state can change while a
    // session is still valid, so a blocked account loses access immediately.
    const user = await findUserById(payload.sub)
    if (!user) {
      clearSessionCookie(res)
      return next(new ApiError(401, 'UNAUTHORIZED'))
    }

    if (!user.is_active) {
      clearSessionCookie(res)
      return next(new ApiError(401, 'ACCOUNT_DISABLED'))
    }

    req.user = user
    return next()
  } catch (error) {
    return next(error)
  }
}
