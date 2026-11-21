import fs from 'node:fs'
import fsp from 'node:fs/promises'
import { Router } from 'express'
import { pool } from '../db.js'
import { ApiError } from '../lib/apiError.js'
import { resolveVideoFile } from '../lib/videoFiles.js'
import { requireAuth } from '../middleware/requireAuth.js'

const router = Router()

const COMPLETION_TOLERANCE_SECONDS = 2.5
const MAX_VIDEO_DURATION_SECONDS = 24 * 60 * 60

function parsePositiveId(value) {
  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

async function hasApprovedEnrollment(userId, courseId) {
  const [rows] = await pool.execute(
    `SELECT id
       FROM enrollments
      WHERE user_id = ? AND course_id = ? AND status = 'approved'
        AND (expires_at IS NULL OR expires_at > NOW())
      LIMIT 1`,
    [userId, courseId]
  )
  return rows.length > 0
}

async function getLessonPosition(courseId, lessonId) {
  const [rows] = await pool.execute(
    `SELECT l.id
       FROM lessons l
       JOIN course_axes a ON a.id = l.axis_id AND a.course_id = l.course_id
      WHERE l.course_id = ? AND l.is_active = 1
      ORDER BY a.position ASC, a.id ASC, l.position ASC, l.id ASC`,
    [courseId]
  )

  const ids = rows.map((row) => Number(row.id))
  const index = ids.indexOf(lessonId)
  return {
    index,
    previousId: index > 0 ? ids[index - 1] : null,
  }
}

async function isLessonCompleted(userId, lessonId) {
  const [rows] = await pool.execute(
    `SELECT is_completed
       FROM lesson_progress
      WHERE user_id = ? AND lesson_id = ?
      LIMIT 1`,
    [userId, lessonId]
  )
  return Boolean(rows[0]?.is_completed)
}

function parseByteRange(rangeHeader, size) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(String(rangeHeader).trim())
  if (!match) return null

  const [, startText, endText] = match
  if (startText === '' && endText === '') return null

  let start
  let end

  if (startText === '') {
    const suffixLength = Number(endText)
    if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) return null
    start = Math.max(size - suffixLength, 0)
    end = size - 1
  } else {
    start = Number(startText)
    end = endText === '' ? size - 1 : Number(endText)
  }

  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end)) return null
  if (start < 0 || start >= size || end < start) return null

  return { start, end: Math.min(end, size - 1) }
}

/**
 * Public preview for an online course: description, axes and lesson titles
 * only, plus the total lesson count. No video data, durations or playback
 * references are selected or returned here.
 */
router.get('/:courseId/preview', async (req, res, next) => {
  const courseId = parsePositiveId(req.params.courseId)
  if (!courseId) return next(new ApiError(400, 'INVALID_COURSE'))

  try {
    const [courseRows] = await pool.execute(
      `SELECT id, name_fr, name_ar, description_fr, description_ar
         FROM courses
        WHERE id = ? AND is_active = 1 AND is_online = 1
        LIMIT 1`,
      [courseId]
    )

    if (courseRows.length === 0) return next(new ApiError(404, 'COURSE_NOT_FOUND'))

    const [axisRows] = await pool.execute(
      `SELECT id, title_fr, title_ar
         FROM course_axes
        WHERE course_id = ?
        ORDER BY position ASC, id ASC`,
      [courseId]
    )

    const [lessonRows] = await pool.execute(
      `SELECT id, axis_id, title_fr, title_ar
         FROM lessons
        WHERE course_id = ? AND axis_id IS NOT NULL AND is_active = 1
        ORDER BY position ASC, id ASC`,
      [courseId]
    )

    const axisIds = new Set(axisRows.map((axis) => Number(axis.id)))
    const lessonsByAxis = new Map()
    let lessonCount = 0

    for (const row of lessonRows) {
      const axisId = Number(row.axis_id)
      if (!axisIds.has(axisId)) continue
      if (!lessonsByAxis.has(axisId)) lessonsByAxis.set(axisId, [])
      lessonsByAxis.get(axisId).push({
        id: Number(row.id),
        titleFr: row.title_fr,
        titleAr: row.title_ar,
      })
      lessonCount += 1
    }

    const course = courseRows[0]
    res.set('Cache-Control', 'no-store')
    res.json({
      course: {
        id: Number(course.id),
        nameFr: course.name_fr,
        nameAr: course.name_ar,
        descriptionFr: course.description_fr,
        descriptionAr: course.description_ar,
      },
      lessonCount,
      axes: axisRows.map((axis) => ({
        id: Number(axis.id),
        titleFr: axis.title_fr,
        titleAr: axis.title_ar,
        lessons: lessonsByAxis.get(Number(axis.id)) ?? [],
      })),
    })
  } catch (error) {
    next(error)
  }
})

/**
 * Protected online-course content. Only approved enrollments can read the
 * curriculum. `video_ref` is never sent to the client; the player receives
 * lesson state and streams media through the protected endpoint below.
 */
router.get('/:courseId', requireAuth, async (req, res, next) => {
  const courseId = parsePositiveId(req.params.courseId)
  if (!courseId) return next(new ApiError(400, 'INVALID_COURSE'))

  try {
    const [courseRows] = await pool.execute(
      `SELECT id, name_fr, name_ar, description_fr, description_ar,
              category, icon, image, price, currency, duration_months
         FROM courses
        WHERE id = ? AND is_active = 1 AND is_online = 1
        LIMIT 1`,
      [courseId]
    )

    if (courseRows.length === 0) return next(new ApiError(404, 'COURSE_NOT_FOUND'))

    if (!(await hasApprovedEnrollment(req.user.id, courseId))) {
      return next(new ApiError(403, 'NOT_ENROLLED'))
    }

    const [axisRows] = await pool.execute(
      `SELECT id, title_fr, title_ar, position
         FROM course_axes
        WHERE course_id = ?
        ORDER BY position ASC, id ASC`,
      [courseId]
    )

    const [lessonRows] = await pool.execute(
      `SELECT id, axis_id, title_fr, title_ar, video_ref, position, duration
         FROM lessons
        WHERE course_id = ? AND is_active = 1
        ORDER BY axis_id ASC, position ASC, id ASC`,
      [courseId]
    )

    const [progressRows] = await pool.execute(
      `SELECT lp.lesson_id, lp.position_seconds, lp.is_completed
         FROM lesson_progress lp
         JOIN lessons l ON l.id = lp.lesson_id
        WHERE lp.user_id = ? AND l.course_id = ?`,
      [req.user.id, courseId]
    )

    const progressByLesson = new Map(
      progressRows.map((row) => [
        Number(row.lesson_id),
        {
          positionSeconds: Number(row.position_seconds),
          isCompleted: Boolean(row.is_completed),
        },
      ])
    )

    const lessonsByAxis = new Map()
    for (const row of lessonRows) {
      const key = row.axis_id === null ? null : Number(row.axis_id)
      if (!lessonsByAxis.has(key)) lessonsByAxis.set(key, [])
      lessonsByAxis.get(key).push({
        id: Number(row.id),
        titleFr: row.title_fr,
        titleAr: row.title_ar,
        position: Number(row.position),
        duration: row.duration === null ? null : Number(row.duration),
        hasVideo: Boolean(row.video_ref),
      })
    }

    // Progression follows the visible curriculum order: axis position, then
    // lesson position. The first lesson is always unlocked; each following
    // lesson unlocks only after the previous one is completed on the server.
    const orderedLessons = []
    for (const axis of axisRows) {
      orderedLessons.push(...(lessonsByAxis.get(Number(axis.id)) ?? []))
    }

    let previousCompleted = true
    for (const lesson of orderedLessons) {
      const progress = progressByLesson.get(lesson.id)
      lesson.isCompleted = Boolean(progress?.isCompleted)
      lesson.positionSeconds = progress?.positionSeconds ?? 0
      lesson.isUnlocked = previousCompleted
      previousCompleted = lesson.isCompleted
    }

    const course = courseRows[0]
    res.set('Cache-Control', 'no-store')
    res.json({
      course: {
        id: Number(course.id),
        nameFr: course.name_fr,
        nameAr: course.name_ar,
        descriptionFr: course.description_fr,
        descriptionAr: course.description_ar,
        category: course.category,
        icon: course.icon,
        image: course.image,
        price: course.price === null ? null : Number(course.price),
        currency: course.currency,
        durationMonths:
          course.duration_months === null ? null : Number(course.duration_months),
      },
      axes: axisRows.map((axis) => ({
        id: Number(axis.id),
        titleFr: axis.title_fr,
        titleAr: axis.title_ar,
        position: Number(axis.position),
        lessons: lessonsByAxis.get(Number(axis.id)) ?? [],
      })),
    })
  } catch (error) {
    next(error)
  }
})

/**
 * Authenticated video stream with HTTP Range support. The file lives outside
 * any public/static directory and is only opened after checking the session,
 * the approved enrollment, the lesson order and the stored file name.
 */
router.get('/:courseId/lessons/:lessonId/stream', requireAuth, async (req, res, next) => {
  const courseId = parsePositiveId(req.params.courseId)
  const lessonId = parsePositiveId(req.params.lessonId)
  if (!courseId || !lessonId) return next(new ApiError(400, 'INVALID_LESSON'))

  try {
    const [lessonRows] = await pool.execute(
      `SELECT l.id, l.course_id, l.video_ref, l.is_active AS lesson_active,
              c.is_active, c.is_online
         FROM lessons l
         JOIN courses c ON c.id = l.course_id
        WHERE l.id = ? AND l.course_id = ?
        LIMIT 1`,
      [lessonId, courseId]
    )

    const lesson = lessonRows[0]
    if (!lesson || !lesson.is_active || !lesson.is_online || !lesson.lesson_active) {
      return next(new ApiError(404, 'LESSON_NOT_FOUND'))
    }

    if (!(await hasApprovedEnrollment(req.user.id, courseId))) {
      return next(new ApiError(403, 'NOT_ENROLLED'))
    }

    const { index, previousId } = await getLessonPosition(courseId, lessonId)
    if (index < 0) return next(new ApiError(404, 'LESSON_NOT_FOUND'))

    if (previousId && !(await isLessonCompleted(req.user.id, previousId))) {
      return next(new ApiError(403, 'LESSON_LOCKED'))
    }

    const file = resolveVideoFile(lesson.video_ref)
    if (!file) return next(new ApiError(404, 'VIDEO_NOT_FOUND'))

    let stat
    try {
      stat = await fsp.stat(file.path)
    } catch {
      return next(new ApiError(404, 'VIDEO_NOT_FOUND'))
    }
    if (!stat.isFile()) return next(new ApiError(404, 'VIDEO_NOT_FOUND'))

    const size = stat.size
    const range = req.headers.range ? parseByteRange(req.headers.range, size) : null

    if (req.headers.range && !range) {
      res.status(416).set('Content-Range', `bytes */${size}`).end()
      return
    }

    const commonHeaders = {
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'private, no-store',
      'Content-Disposition': 'inline',
      'Content-Type': file.contentType,
      'X-Content-Type-Options': 'nosniff',
    }

    if (range) {
      res.status(206).set({
        ...commonHeaders,
        'Content-Length': range.end - range.start + 1,
        'Content-Range': `bytes ${range.start}-${range.end}/${size}`,
      })
    } else {
      res.status(200).set({
        ...commonHeaders,
        'Content-Length': size,
      })
    }

    if (req.method === 'HEAD') {
      res.end()
      return
    }

    const stream = range
      ? fs.createReadStream(file.path, { start: range.start, end: range.end })
      : fs.createReadStream(file.path)

    stream.on('error', (error) => {
      console.error('[video] stream failed:', error.message)
      if (res.headersSent) res.destroy()
      else next(new ApiError(500, 'VIDEO_STREAM_FAILED'))
    })
    res.on('close', () => stream.destroy())
    stream.pipe(res)
  } catch (error) {
    next(error)
  }
})

/**
 * Save watch progress. A lesson is marked completed only when the client sends
 * the real `ended` event AND the reported position is at the end of the video.
 * The previous lesson must also be completed on the server, so a crafted
 * request cannot skip ahead.
 */
router.post('/:courseId/lessons/:lessonId/progress', requireAuth, async (req, res, next) => {
  const courseId = parsePositiveId(req.params.courseId)
  const lessonId = parsePositiveId(req.params.lessonId)
  if (!courseId || !lessonId) return next(new ApiError(400, 'INVALID_LESSON'))

  try {
    const [lessonRows] = await pool.execute(
      `SELECT l.id, l.course_id, l.video_ref, l.duration, l.is_active AS lesson_active,
              c.is_active, c.is_online
         FROM lessons l
         JOIN courses c ON c.id = l.course_id
        WHERE l.id = ? AND l.course_id = ?
        LIMIT 1`,
      [lessonId, courseId]
    )

    const lesson = lessonRows[0]
    if (!lesson || !lesson.is_active || !lesson.is_online || !lesson.lesson_active) {
      return next(new ApiError(404, 'LESSON_NOT_FOUND'))
    }

    if (!(await hasApprovedEnrollment(req.user.id, courseId))) {
      return next(new ApiError(403, 'NOT_ENROLLED'))
    }

    const { index, previousId } = await getLessonPosition(courseId, lessonId)
    if (index < 0) return next(new ApiError(404, 'LESSON_NOT_FOUND'))

    if (previousId && !(await isLessonCompleted(req.user.id, previousId))) {
      return next(new ApiError(403, 'LESSON_LOCKED'))
    }

    if (!lesson.video_ref) return next(new ApiError(400, 'VIDEO_NOT_AVAILABLE'))

    const position = Number(req.body?.positionSeconds)
    const clientDuration = Number(req.body?.durationSeconds)
    const ended = req.body?.ended === true

    if (
      !Number.isFinite(position) ||
      position < 0 ||
      !Number.isFinite(clientDuration) ||
      clientDuration <= 0 ||
      clientDuration > MAX_VIDEO_DURATION_SECONDS
    ) {
      return next(new ApiError(400, 'INVALID_PROGRESS'))
    }

    const lessonDuration =
      lesson.duration === null || lesson.duration === undefined
        ? null
        : Number(lesson.duration)
    const expectedDuration =
      lessonDuration && lessonDuration > 0 ? lessonDuration : clientDuration
    const storedPosition = Math.min(
      Math.round(position),
      Math.round(expectedDuration)
    )
    const nearEnd =
      expectedDuration > 0 &&
      position >= expectedDuration - COMPLETION_TOLERANCE_SECONDS
    const canComplete = ended && nearEnd

    const [existingRows] = await pool.execute(
      `SELECT position_seconds, is_completed, completed_at
         FROM lesson_progress
        WHERE user_id = ? AND lesson_id = ?
        LIMIT 1`,
      [req.user.id, lessonId]
    )

    const existing = existingRows[0] ?? null
    const finalPosition = Math.max(
      Number(existing?.position_seconds ?? 0),
      storedPosition
    )
    const alreadyCompleted = Boolean(existing?.is_completed)
    const isCompleted = alreadyCompleted || canComplete
    const completedAt = isCompleted
      ? existing?.completed_at ?? new Date()
      : null

    await pool.execute(
      `INSERT INTO lesson_progress
         (user_id, lesson_id, position_seconds, is_completed, completed_at)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         position_seconds = VALUES(position_seconds),
         is_completed = VALUES(is_completed),
         completed_at = VALUES(completed_at)`,
      [req.user.id, lessonId, finalPosition, isCompleted ? 1 : 0, completedAt]
    )

    res.set('Cache-Control', 'no-store')
    res.json({
      lessonId,
      positionSeconds: finalPosition,
      isCompleted,
      completedNow: !alreadyCompleted && isCompleted,
    })
  } catch (error) {
    next(error)
  }
})

export default router
