import { ApiError } from '../lib/apiError.js'
import { clearSessionCookie } from '../lib/session.js'
import { findUserById } from '../lib/users.js'

/**
 * Admin guard. The database is read again on every admin request so a role
 * change or a blocked account takes effect immediately, even with an old
 * session cookie. `requireAuth` runs first and already rejects disabled users;
 * this second read is the explicit role + active check for the admin API.
 */
export async function requireAdmin(req, res, next) {
  try {
    const user = req.user ? await findUserById(req.user.id) : null

    if (!user) {
      clearSessionCookie(res)
      return next(new ApiError(401, 'UNAUTHORIZED'))
    }

    if (!user.is_active) {
      clearSessionCookie(res)
      return next(new ApiError(401, 'ACCOUNT_DISABLED'))
    }

    if (user.role !== 'admin') {
      return next(new ApiError(403, 'FORBIDDEN'))
    }

    req.user = user
    return next()
  } catch (error) {
    return next(error)
  }
}
