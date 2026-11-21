import { Router } from 'express'
import { pool } from '../../db.js'
import { ApiError } from '../../lib/apiError.js'
import { saveEnrollment, toExpiresAt } from '../../lib/enrollments.js'
import {
  mapAdminUser,
  parseId,
  toBoolean,
  toText,
  validationError,
} from '../../lib/adminHelpers.js'

const router = Router()

const USER_STATUS_FILTERS = new Set(['all', 'verified', 'unverified', 'active', 'blocked'])

const USER_SELECT = `
  SELECT u.id, u.full_name, u.phone, u.address, u.email, u.role,
         u.email_verified, u.is_active, u.created_at,
         (SELECT COUNT(*) FROM enrollments e
            JOIN courses c ON c.id = e.course_id
           WHERE e.user_id = u.id AND e.status = 'approved' AND c.is_online = 1
             AND (e.expires_at IS NULL OR e.expires_at > NOW())) AS approved_count,
         (SELECT COUNT(*) FROM enrollments e
            JOIN courses c ON c.id = e.course_id
           WHERE e.user_id = u.id AND e.status = 'pending' AND c.is_online = 1) AS pending_count,
         (SELECT COUNT(*) FROM lesson_progress lp
           WHERE lp.user_id = u.id AND lp.is_completed = 1) AS completed_lessons
    FROM users u
`

router.get('/', async (req, res, next) => {
  try {
    const search = toText(req.query.search, 100)
    const status = USER_STATUS_FILTERS.has(String(req.query.status))
      ? String(req.query.status)
      : 'all'
    const courseId = req.query.courseId ? parseId(req.query.courseId) : null

    if (req.query.courseId && !courseId) {
      return next(new ApiError(400, 'INVALID_COURSE'))
    }

    const conditions = []
    const params = []

    if (search) {
      const like = `%${search}%`
      conditions.push('(u.full_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)')
      params.push(like, like, like)
    }

    if (status === 'verified') conditions.push('u.email_verified = 1')
    if (status === 'unverified') conditions.push('u.email_verified = 0')
    if (status === 'active') conditions.push('u.is_active = 1')
    if (status === 'blocked') conditions.push('u.is_active = 0')

    if (courseId) {
      conditions.push(
        `EXISTS (SELECT 1 FROM enrollments e
                   JOIN courses c ON c.id = e.course_id
                  WHERE e.user_id = u.id AND e.course_id = ? AND e.status = 'approved'
                    AND c.is_online = 1
                    AND (e.expires_at IS NULL OR e.expires_at > NOW()))`
      )
      params.push(courseId)
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const [rows] = await pool.execute(
      `${USER_SELECT} ${where} ORDER BY u.created_at DESC, u.id DESC LIMIT 200`,
      params
    )

    res.json({ users: rows.map(mapAdminUser) })
  } catch (error) {
    next(error)
  }
})

router.get('/:id', async (req, res, next) => {
  const userId = parseId(req.params.id)
  if (!userId) return next(new ApiError(400, 'INVALID_USER'))

  try {
    const [rows] = await pool.execute(`${USER_SELECT} WHERE u.id = ? LIMIT 1`, [userId])
    if (rows.length === 0) return next(new ApiError(404, 'USER_NOT_FOUND'))

    const [enrollmentRows] = await pool.execute(
      `SELECT e.course_id, e.status, e.expires_at, e.created_at, e.updated_at
         FROM enrollments e
         JOIN courses c ON c.id = e.course_id
        WHERE e.user_id = ? AND c.is_online = 1
        ORDER BY e.course_id ASC`,
      [userId]
    )

    res.json({
      user: mapAdminUser(rows[0]),
      enrollments: enrollmentRows.map((row) => ({
        courseId: Number(row.course_id),
        status: row.status,
        expiresAt: row.expires_at ?? null,
        isExpired:
          row.status === 'approved' &&
          row.expires_at !== null &&
          new Date(row.expires_at).getTime() <= Date.now(),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
    })
  } catch (error) {
    next(error)
  }
})

router.patch('/:id', async (req, res, next) => {
  const userId = parseId(req.params.id)
  if (!userId) return next(new ApiError(400, 'INVALID_USER'))

  const value = req.body?.isActive
  if (typeof value !== 'boolean' && value !== 0 && value !== 1) {
    return next(validationError({ isActive: 'BOOLEAN_REQUIRED' }))
  }

  const isActive = toBoolean(value)
  if (!isActive && userId === Number(req.user.id)) {
    return next(new ApiError(400, 'CANNOT_BLOCK_SELF'))
  }

  try {
    const [result] = await pool.execute('UPDATE users SET is_active = ? WHERE id = ?', [
      isActive ? 1 : 0,
      userId,
    ])

    if (result.affectedRows === 0) return next(new ApiError(404, 'USER_NOT_FOUND'))

    const [rows] = await pool.execute(`${USER_SELECT} WHERE u.id = ? LIMIT 1`, [userId])
    res.json({ user: mapAdminUser(rows[0]) })
  } catch (error) {
    next(error)
  }
})

router.put('/:id/enrollments/:courseId', async (req, res, next) => {
  const userId = parseId(req.params.id)
  const courseId = parseId(req.params.courseId)
  if (!userId) return next(new ApiError(400, 'INVALID_USER'))
  if (!courseId) return next(new ApiError(400, 'INVALID_COURSE'))

  const value = req.body?.approved
  if (typeof value !== 'boolean' && value !== 0 && value !== 1) {
    return next(validationError({ approved: 'BOOLEAN_REQUIRED' }))
  }

  const approved = toBoolean(value)

  const expiry = toExpiresAt(req.body?.expiresAt)
  if (!expiry.ok) return next(new ApiError(400, 'INVALID_EXPIRY'))

  try {
    const [userRows] = await pool.execute('SELECT id FROM users WHERE id = ? LIMIT 1', [userId])
    if (userRows.length === 0) return next(new ApiError(404, 'USER_NOT_FOUND'))

    const [courseRows] = await pool.execute(
      'SELECT id, is_online FROM courses WHERE id = ? LIMIT 1',
      [courseId]
    )
    if (courseRows.length === 0) return next(new ApiError(404, 'COURSE_NOT_FOUND'))
    if (approved && !courseRows[0].is_online) {
      return next(new ApiError(400, 'COURSE_NOT_ONLINE'))
    }

    const saved = await saveEnrollment(pool, {
      userId,
      courseId,
      approved,
      expiresAt: expiry.value,
    })

    res.json({
      userId,
      courseId,
      status: saved.status,
      expiresAt: saved.expiresAt,
    })
  } catch (error) {
    next(error)
  }
})

export default router
