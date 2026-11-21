import { ApiError } from '../lib/apiError.js'
import { CSRF_COOKIE, isValidCsrfToken } from '../lib/csrf.js'

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

export function csrfProtection(req, _res, next) {
  if (SAFE_METHODS.has(req.method)) return next()

  const cookieToken = req.cookies?.[CSRF_COOKIE]
  const headerToken = req.get('x-csrf-token')

  if (!isValidCsrfToken(headerToken, cookieToken)) {
    return next(new ApiError(403, 'CSRF_INVALID'))
  }

  return next()
}
