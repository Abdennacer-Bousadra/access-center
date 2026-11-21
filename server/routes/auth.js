import crypto from 'node:crypto'
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { pool } from '../db.js'
import { ApiError } from '../lib/apiError.js'
import { sendPasswordResetEmail, sendVerificationEmail } from '../lib/mailer.js'
import { clearSessionCookie, setSessionCookie } from '../lib/session.js'
import { findUserByEmail, toPublicUser } from '../lib/users.js'
import {
  isValidEmail,
  isValidVerificationToken,
  normalizeEmail,
  validateLogin,
  validateRegistration,
  validateResetPassword,
} from '../lib/validation.js'
import {
  forgotPasswordLimiter,
  loginLimiter,
  registerLimiter,
  resendLimiter,
  resetPasswordLimiter,
} from '../middleware/rateLimit.js'

const router = Router()

const parsedRounds = Number.parseInt(process.env.BCRYPT_ROUNDS ?? '12', 10)
const BCRYPT_ROUNDS =
  Number.isInteger(parsedRounds) && parsedRounds >= 4 && parsedRounds <= 15 ? parsedRounds : 12

// Keeps logins for unknown emails as slow as logins for real accounts.
const DUMMY_HASH = bcrypt.hashSync('accesscenter-dummy-password', 10)

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function createVerificationTokenValue() {
  return crypto.randomBytes(32).toString('hex')
}

function getAppUrl() {
  const configured = process.env.APP_URL || process.env.CLIENT_ORIGIN?.split(',')[0]?.trim()
  return (configured || 'http://localhost:5173').replace(/\/+$/, '')
}

function buildVerificationUrl(token) {
  return `${getAppUrl()}/verify-email?token=${encodeURIComponent(token)}`
}

async function insertVerificationToken(executor, userId) {
  const token = createVerificationTokenValue()
  await executor.execute(
    `INSERT INTO email_tokens (user_id, token_hash, purpose, expires_at)
     VALUES (?, ?, 'verify_email', DATE_ADD(NOW(), INTERVAL 24 HOUR))`,
    [userId, hashToken(token)]
  )
  return token
}

function buildResetUrl(token) {
  return `${getAppUrl()}/update-password?token=${encodeURIComponent(token)}`
}

async function insertResetToken(executor, userId) {
  const token = createVerificationTokenValue()
  await executor.execute(
    `INSERT INTO email_tokens (user_id, token_hash, purpose, expires_at)
     VALUES (?, ?, 'reset_password', DATE_ADD(NOW(), INTERVAL 1 HOUR))`,
    [userId, hashToken(token)]
  )
  return token
}

function validationError(fields) {
  return new ApiError(400, 'VALIDATION_ERROR', { fields })
}

async function rollbackQuietly(connection) {
  try {
    await connection.rollback()
  } catch {
    // The original error is more useful than a rollback failure.
  }
}

router.post('/register', registerLimiter, async (req, res) => {
  const { fields, values } = validateRegistration(req.body)
  if (Object.keys(fields).length > 0) throw validationError(fields)

  const existing = await findUserByEmail(values.email)
  if (existing) throw new ApiError(409, 'EMAIL_TAKEN')

  const passwordHash = await bcrypt.hash(values.password, BCRYPT_ROUNDS)

  const connection = await pool.getConnection()
  let userId
  let token

  try {
    await connection.beginTransaction()

    try {
      const [result] = await connection.execute(
        `INSERT INTO users (full_name, phone, address, email, password_hash)
         VALUES (?, ?, ?, ?, ?)`,
        [values.fullName, values.phone, values.address, values.email, passwordHash]
      )
      userId = result.insertId
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') throw new ApiError(409, 'EMAIL_TAKEN')
      throw error
    }

    token = await insertVerificationToken(connection, userId)
    await connection.commit()
  } catch (error) {
    await rollbackQuietly(connection)
    throw error
  } finally {
    connection.release()
  }

  const emailSent = await sendVerificationEmail({
    to: values.email,
    fullName: values.fullName,
    verificationUrl: buildVerificationUrl(token),
  })

  res.status(201).json({ message: 'ACCOUNT_CREATED', emailSent })
})

router.post('/login', loginLimiter, async (req, res) => {
  const { fields, values } = validateLogin(req.body)
  if (Object.keys(fields).length > 0) throw validationError(fields)

  const user = await findUserByEmail(values.email)
  if (!user) {
    await bcrypt.compare(values.password, DUMMY_HASH)
    throw new ApiError(401, 'INVALID_CREDENTIALS')
  }

  const passwordMatches = await bcrypt.compare(values.password, user.password_hash)
  if (!passwordMatches) throw new ApiError(401, 'INVALID_CREDENTIALS')
  if (!user.is_active) throw new ApiError(403, 'ACCOUNT_DISABLED')
  if (!user.email_verified) throw new ApiError(403, 'EMAIL_NOT_VERIFIED')

  setSessionCookie(res, user.id)
  res.json({ user: toPublicUser(user) })
})

router.post('/logout', (_req, res) => {
  clearSessionCookie(res)
  res.status(204).end()
})

router.post('/verify-email', async (req, res) => {
  const token = typeof req.body?.token === 'string' ? req.body.token.trim() : ''
  if (!isValidVerificationToken(token)) throw new ApiError(400, 'TOKEN_INVALID')

  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()

    const [rows] = await connection.execute(
      `SELECT id, user_id
       FROM email_tokens
       WHERE token_hash = ? AND purpose = 'verify_email' AND used_at IS NULL AND expires_at > NOW()
       LIMIT 1`,
      [hashToken(token)]
    )

    if (rows.length === 0) throw new ApiError(400, 'TOKEN_INVALID')

    const record = rows[0]
    await connection.execute('UPDATE users SET email_verified = 1 WHERE id = ?', [
      record.user_id,
    ])
    await connection.execute(
      `UPDATE email_tokens SET used_at = NOW()
       WHERE user_id = ? AND purpose = 'verify_email' AND used_at IS NULL`,
      [record.user_id]
    )

    await connection.commit()
  } catch (error) {
    await rollbackQuietly(connection)
    throw error
  } finally {
    connection.release()
  }

  res.json({ message: 'EMAIL_VERIFIED' })
})

router.post('/resend-verification', resendLimiter, async (req, res) => {
  const email = normalizeEmail(req.body?.email)
  if (!isValidEmail(email)) {
    throw validationError({ email: email ? 'EMAIL_INVALID' : 'EMAIL_REQUIRED' })
  }

  const user = await findUserByEmail(email)
  if (!user || user.email_verified) {
    return res.json({ message: 'VERIFICATION_EMAIL_SENT_IF_ACCOUNT_EXISTS' })
  }

  const connection = await pool.getConnection()
  let token
  try {
    await connection.beginTransaction()
    await connection.execute(
      `UPDATE email_tokens SET used_at = NOW()
       WHERE user_id = ? AND purpose = 'verify_email' AND used_at IS NULL`,
      [user.id]
    )
    token = await insertVerificationToken(connection, user.id)
    await connection.commit()
  } catch (error) {
    await rollbackQuietly(connection)
    throw error
  } finally {
    connection.release()
  }

  await sendVerificationEmail({
    to: user.email,
    fullName: user.full_name,
    verificationUrl: buildVerificationUrl(token),
  })

  return res.json({ message: 'VERIFICATION_EMAIL_SENT_IF_ACCOUNT_EXISTS' })
})

router.post('/forgot-password', forgotPasswordLimiter, async (req, res) => {
  const email = normalizeEmail(req.body?.email)
  if (!isValidEmail(email)) {
    throw validationError({ email: email ? 'EMAIL_INVALID' : 'EMAIL_REQUIRED' })
  }

  const user = await findUserByEmail(email)
  // Always answer the same way so the endpoint cannot be used to enumerate accounts.
  if (!user) return res.json({ message: 'RESET_EMAIL_SENT_IF_ACCOUNT_EXISTS' })

  const connection = await pool.getConnection()
  let token
  try {
    await connection.beginTransaction()
    await connection.execute(
      `UPDATE email_tokens SET used_at = NOW()
       WHERE user_id = ? AND purpose = 'reset_password' AND used_at IS NULL`,
      [user.id]
    )
    token = await insertResetToken(connection, user.id)
    await connection.commit()
  } catch (error) {
    await rollbackQuietly(connection)
    throw error
  } finally {
    connection.release()
  }

  await sendPasswordResetEmail({
    to: user.email,
    fullName: user.full_name,
    resetUrl: buildResetUrl(token),
  })

  return res.json({ message: 'RESET_EMAIL_SENT_IF_ACCOUNT_EXISTS' })
})

router.post('/reset-password', resetPasswordLimiter, async (req, res) => {
  const { fields, values } = validateResetPassword(req.body)
  if (Object.keys(fields).length > 0) throw validationError(fields)

  const passwordHash = await bcrypt.hash(values.password, BCRYPT_ROUNDS)

  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()

    const [rows] = await connection.execute(
      `SELECT id, user_id
       FROM email_tokens
       WHERE token_hash = ? AND purpose = 'reset_password' AND used_at IS NULL AND expires_at > NOW()
       LIMIT 1`,
      [hashToken(values.token)]
    )

    if (rows.length === 0) throw new ApiError(400, 'TOKEN_INVALID')

    const record = rows[0]
    await connection.execute('UPDATE users SET password_hash = ? WHERE id = ?', [
      passwordHash,
      record.user_id,
    ])
    await connection.execute(
      `UPDATE email_tokens SET used_at = NOW()
       WHERE user_id = ? AND purpose = 'reset_password' AND used_at IS NULL`,
      [record.user_id]
    )

    await connection.commit()
  } catch (error) {
    await rollbackQuietly(connection)
    throw error
  } finally {
    connection.release()
  }

  // Any old session could belong to whoever had access to the previous password.
  clearSessionCookie(res)
  res.json({ message: 'PASSWORD_RESET' })
})

export default router
