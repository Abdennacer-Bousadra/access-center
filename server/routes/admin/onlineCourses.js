import { Router } from 'express'
import { pool } from '../../db.js'
import { ApiError } from '../../lib/apiError.js'
import { parseId, toBoolean, toText, validationError } from '../../lib/adminHelpers.js'
import { saveEnrollment, toExpiresAt } from '../../lib/enrollments.js'
import { listVideoFileNames } from '../../lib/videoFiles.js'

const router = Router()

const MAX_BULK = 200

async function getOnlineCourse(courseId) {
  const [rows] = await pool.execute(
    `SELECT id, name_fr, name_ar, is_active
       FROM courses
      WHERE id = ? AND is_online = 1
      LIMIT 1`,
    [courseId]
  )
  return rows[0] ?? null
}

function parseApproved(value) {
  if (typeof value !== 'boolean' && value !== 0 && value !== 1) return null
  return toBoolean(value)
}

function parseUserIds(value) {
  const raw = Array.isArray(value) ? value : []
  const ids = [...new Set(raw.map(parseId).filter(Boolean))]
  if (ids.length === 0 || ids.length > MAX_BULK) return null
  return ids
}

/* ---------------------------------- List --------------------------------- */

router.get('/', async (_req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT c.id, c.name_fr, c.name_ar, c.is_active, c.sort_order,
              (SELECT COUNT(*) FROM lessons l WHERE l.course_id = c.id) AS lesson_count,
              (SELECT COUNT(*) FROM enrollments e
                WHERE e.course_id = c.id AND e.status = 'approved'
                  AND (e.expires_at IS NULL OR e.expires_at > NOW())) AS subscribers_count
         FROM courses c
        WHERE c.is_online = 1
        ORDER BY c.sort_order ASC, c.id ASC`
    )

    const courseIds = rows.map((row) => Number(row.id))
    const refsByCourse = new Map()

    if (courseIds.length > 0) {
      const placeholders = courseIds.map(() => '?').join(', ')
      const [lessonRows] = await pool.execute(
        `SELECT course_id, video_ref
           FROM lessons
          WHERE course_id IN (${placeholders})`,
        courseIds
      )

      for (const lesson of lessonRows) {
        if (!lesson.video_ref) continue
        const key = Number(lesson.course_id)
        if (!refsByCourse.has(key)) refsByCourse.set(key, [])
        refsByCourse.get(key).push(lesson.video_ref)
      }
    }

    let videosConfigured = false
    let fileSet = new Set()
    try {
      const listing = await listVideoFileNames()
      videosConfigured = listing.configured
      fileSet = new Set(listing.names)
    } catch (error) {
      console.error('[admin] unable to list VIDEO_DIR:', error.message)
    }

    res.json({
      videosConfigured,
      courses: rows.map((row) => {
        const refs = refsByCourse.get(Number(row.id)) ?? []
        const videosFound = refs.filter((ref) => fileSet.has(ref)).length
        return {
          id: Number(row.id),
          nameFr: row.name_fr,
          nameAr: row.name_ar,
          isActive: Boolean(row.is_active),
          sortOrder: Number(row.sort_order),
          lessonCount: Number(row.lesson_count),
          videosFound,
          videosMissing: refs.length - videosFound,
          subscribersCount: Number(row.subscribers_count),
        }
      }),
    })
  } catch (error) {
    next(error)
  }
})

/* ------------------------------ Subscribers ------------------------------ */

router.get('/:courseId/subscribers', async (req, res, next) => {
  const courseId = parseId(req.params.courseId)
  if (!courseId) return next(new ApiError(400, 'INVALID_COURSE'))

  const search = toText(req.query.search, 100)

  try {
    const course = await getOnlineCourse(courseId)
    if (!course) return next(new ApiError(404, 'COURSE_NOT_FOUND'))

    const conditions = []
    const params = [courseId, courseId, courseId]

    if (search) {
      const like = `%${search}%`
      conditions.push('(u.full_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)')
      params.push(like, like, like)
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const [rows] = await pool.execute(
      `SELECT u.id, u.full_name, u.email, u.phone, u.email_verified, u.is_active,
              e.status, e.expires_at,
              CASE WHEN e.status = 'approved'
                    AND (e.expires_at IS NULL OR e.expires_at > NOW())
                   THEN 1 ELSE 0 END AS has_access,
              (SELECT COUNT(*) FROM lesson_progress lp
                 JOIN lessons l ON l.id = lp.lesson_id
                WHERE lp.user_id = u.id AND l.course_id = ? AND lp.is_completed = 1)
                AS completed_lessons,
              (SELECT MAX(lp.updated_at) FROM lesson_progress lp
                 JOIN lessons l ON l.id = lp.lesson_id
                WHERE lp.user_id = u.id AND l.course_id = ?) AS last_activity
         FROM users u
         LEFT JOIN enrollments e ON e.user_id = u.id AND e.course_id = ?
         ${where}
         ORDER BY has_access DESC, u.full_name ASC, u.id ASC
         LIMIT 200`,
      params
    )

    const [[lessonRow]] = await pool.execute(
      'SELECT COUNT(*) AS total FROM lessons WHERE course_id = ?',
      [courseId]
    )

    res.set('Cache-Control', 'no-store')
    res.json({
      course: {
        id: Number(course.id),
        nameFr: course.name_fr,
        nameAr: course.name_ar,
        isActive: Boolean(course.is_active),
        isOnline: true,
      },
      totalLessons: Number(lessonRow.total),
      subscribers: rows.map((row) => {
        const expiresAt = row.expires_at ?? null
        const status = row.status ?? null
        return {
          id: Number(row.id),
          fullName: row.full_name,
          email: row.email,
          phone: row.phone,
          emailVerified: Boolean(row.email_verified),
          isActive: Boolean(row.is_active),
          status,
          expiresAt,
          hasAccess: Boolean(row.has_access),
          isExpired: status === 'approved' && expiresAt !== null && !row.has_access,
          completedLessons: Number(row.completed_lessons),
          lastActivity: row.last_activity ?? null,
        }
      }),
    })
  } catch (error) {
    next(error)
  }
})

router.put('/:courseId/subscribers/:userId', async (req, res, next) => {
  const courseId = parseId(req.params.courseId)
  const userId = parseId(req.params.userId)
  if (!courseId) return next(new ApiError(400, 'INVALID_COURSE'))
  if (!userId) return next(new ApiError(400, 'INVALID_USER'))

  const approved = parseApproved(req.body?.approved)
  if (approved === null) return next(validationError({ approved: 'BOOLEAN_REQUIRED' }))

  const expiry = toExpiresAt(req.body?.expiresAt)
  if (!expiry.ok) return next(new ApiError(400, 'INVALID_EXPIRY'))

  try {
    const course = await getOnlineCourse(courseId)
    if (!course) return next(new ApiError(404, 'COURSE_NOT_FOUND'))

    const [userRows] = await pool.execute('SELECT id FROM users WHERE id = ? LIMIT 1', [userId])
    if (userRows.length === 0) return next(new ApiError(404, 'USER_NOT_FOUND'))

    const saved = await saveEnrollment(pool, {
      userId,
      courseId,
      approved,
      expiresAt: expiry.value,
    })

    res.json({ userId, courseId, status: saved.status, expiresAt: saved.expiresAt })
  } catch (error) {
    next(error)
  }
})

router.post('/:courseId/subscribers/bulk', async (req, res, next) => {
  const courseId = parseId(req.params.courseId)
  if (!courseId) return next(new ApiError(400, 'INVALID_COURSE'))

  const approved = parseApproved(req.body?.approved)
  if (approved === null) return next(validationError({ approved: 'BOOLEAN_REQUIRED' }))

  const userIds = parseUserIds(req.body?.userIds)
  if (!userIds) return next(new ApiError(400, 'INVALID_USER_IDS'))

  const expiry = toExpiresAt(req.body?.expiresAt)
  if (!expiry.ok) return next(new ApiError(400, 'INVALID_EXPIRY'))

  try {
    const course = await getOnlineCourse(courseId)
    if (!course) return next(new ApiError(404, 'COURSE_NOT_FOUND'))

    const placeholders = userIds.map(() => '?').join(', ')
    const [userRows] = await pool.execute(
      `SELECT id FROM users WHERE id IN (${placeholders})`,
      userIds
    )
    if (userRows.length !== userIds.length) {
      return next(new ApiError(400, 'INVALID_USER_IDS'))
    }

    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()
      for (const userId of userIds) {
        await saveEnrollment(connection, {
          userId,
          courseId,
          approved,
          expiresAt: expiry.value,
        })
      }
      await connection.commit()
    } catch (error) {
      await connection.rollback().catch(() => {})
      throw error
    } finally {
      connection.release()
    }

    res.json({
      updated: userIds.length,
      status: approved ? 'approved' : 'rejected',
      expiresAt: approved ? expiry.value : null,
    })
  } catch (error) {
    next(error)
  }
})

export default router
