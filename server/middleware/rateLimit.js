import { rateLimit } from 'express-rate-limit'

const isProduction = process.env.NODE_ENV === 'production'
// Keep local development usable while the production limits stay strict.
const multiplier = isProduction ? 1 : 10

const baseOptions = {
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler(_req, res) {
    res.status(429).json({ error: 'RATE_LIMITED' })
  },
}

export const loginLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  limit: 10 * multiplier,
  skipSuccessfulRequests: true,
})

export const registerLimiter = rateLimit({
  ...baseOptions,
  windowMs: 60 * 60 * 1000,
  limit: 5 * multiplier,
})

export const resendLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  limit: 3 * multiplier,
})

export const forgotPasswordLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  limit: 3 * multiplier,
})

export const resetPasswordLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  limit: 5 * multiplier,
})
