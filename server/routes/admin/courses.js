import { Router } from 'express'
import { pool } from '../../db.js'
import { ApiError } from '../../lib/apiError.js'
import {
  mapAdminAxis,
  mapAdminCourse,
  mapAdminLesson,
  parseId,
  toBoolean,
  toCurrency,
  toDuration,
  toNullableMonths,
  toNullablePrice,
  toOptionalText,
  toSortOrder,
  toText,
  validationError,
} from '../../lib/adminHelpers.js'
import { isValidVideoFileName } from '../../lib/videoFiles.js'

const router = Router()

const COURSE_SELECT = `
  SELECT c.id, c.name_fr, c.name_ar, c.description_fr, c.description_ar,
         c.category, c.icon, c.image, c.price, c.duration_months, c.currency,
         c.is_online, c.is_active, c.sort_order, c.created_at, c.updated_at,
         (SELECT COUNT(*) FROM course_axes a WHERE a.course_id = c.id) AS axis_count,
         (SELECT COUNT(*) FROM lessons l WHERE l.course_id = c.id) AS lesson_count
    FROM courses c
`

function buildCourseValues(body, current = null) {
  const fields = {}
  const nameFr = toText(body.nameFr ?? current?.name_fr, 150)
  const nameAr = toText(body.nameAr ?? current?.name_ar, 150)

  if (!nameFr) fields.nameFr = 'NAME_FR_REQUIRED'
  if (!nameAr) fields.nameAr = 'NAME_AR_REQUIRED'

  const rawPrice = body.price === undefined ? (current?.price ?? null) : body.price
  const price = toNullablePrice(rawPrice)
  if (price === undefined) fields.price = 'PRICE_INVALID'

  const rawMonths =
    body.durationMonths === undefined ? (current?.duration_months ?? null) : body.durationMonths
  const durationMonths = toNullableMonths(rawMonths)
  if (durationMonths === undefined) fields.durationMonths = 'DURATION_INVALID'

  return {
    fields,
    values: {
      nameFr,
      nameAr,
      descriptionFr:
        typeof body.descriptionFr === 'string'
          ? body.descriptionFr.trim()
          : (current?.description_fr ?? ''),
      descriptionAr:
        typeof body.descriptionAr === 'string'
          ? body.descriptionAr.trim()
          : (current?.description_ar ?? ''),
      category: toOptionalText(body.category ?? current?.category, 50),
      icon: toOptionalText(body.icon ?? current?.icon, 50),
      image: toOptionalText(body.image ?? current?.image, 500),
      price,
      durationMonths,
      currency: toCurrency(body.currency ?? current?.currency),
      isOnline: toBoolean(body.isOnline, current ? Boolean(current.is_online) : false),
      isActive: toBoolean(body.isActive, current ? Boolean(current.is_active) : true),
      sortOrder: toSortOrder(
        body.sortOrder === undefined ? (current?.sort_order ?? 0) : body.sortOrder,
        current?.sort_order ?? 0
      ),
    },
  }
}

function buildAxisValues(body, current = null) {
  const fields = {}
  const titleFr = toText(body.titleFr ?? current?.title_fr, 150)
  const titleAr = toText(body.titleAr ?? current?.title_ar, 150)
  if (!titleFr) fields.titleFr = 'TITLE_FR_REQUIRED'
  if (!titleAr) fields.titleAr = 'TITLE_AR_REQUIRED'
  return { fields, values: { titleFr, titleAr } }
}

function buildLessonValues(body, current = null) {
  const fields = {}
  const titleFr = toText(body.titleFr ?? current?.title_fr, 200)
  const titleAr = toText(body.titleAr ?? current?.title_ar, 200)
  if (!titleFr) fields.titleFr = 'TITLE_FR_REQUIRED'
  if (!titleAr) fields.titleAr = 'TITLE_AR_REQUIRED'

  const rawVideo =
    body.videoRef === undefined ? (current?.video_ref ?? null) : body.videoRef
  let videoRef = null
  if (typeof rawVideo === 'string' && rawVideo.trim()) {
    videoRef = rawVideo.trim()
    if (!isValidVideoFileName(videoRef)) fields.videoRef = 'VIDEO_REF_INVALID'
  } else if (rawVideo !== null && rawVideo !== undefined && rawVideo !== '') {
    fields.videoRef = 'VIDEO_REF_INVALID'
  }

  const rawDuration =
    body.duration === undefined ? (current?.duration ?? null) : body.duration
  const duration = toDuration(rawDuration)
  if (duration === undefined) fields.duration = 'DURATION_INVALID'

  return {
    fields,
    values: {
      titleFr,
      titleAr,
      descriptionFr:
        typeof body.descriptionFr === 'string'
          ? body.descriptionFr.trim()
          : (current?.description_fr ?? null),
      descriptionAr:
        typeof body.descriptionAr === 'string'
          ? body.descriptionAr.trim()
          : (current?.description_ar ?? null),
      videoRef,
      duration,
      isActive: toBoolean(body.isActive, current ? Boolean(current.is_active) : true),
    },
  }
}

async function getCourseRow(courseId) {
  const [rows] = await pool.execute(`${COURSE_SELECT} WHERE c.id = ? LIMIT 1`, [courseId])
  return rows[0] ?? null
}

async function assertCourse(courseId) {
  const row = await getCourseRow(courseId)
  if (!row) throw new ApiError(404, 'COURSE_NOT_FOUND')
  return row
}

/**
 * Axes and lessons only exist for online courses. Formations (is_online = 0)
 * are details-only and must never receive course content.
 */
async function assertOnlineCourse(courseId) {
  const course = await assertCourse(courseId)
  if (!course.is_online) throw new ApiError(400, 'COURSE_CONTENT_ONLINE_ONLY')
  return course
}

/**
 * `is_online` is chosen at creation and can never change afterwards.
 * A request that omits it (or repeats the current value) is allowed.
 */
function assertOnlineImmutable(body, current) {
  if (body?.isOnline === undefined) return
  if (toBoolean(body.isOnline) !== Boolean(current.is_online)) {
    throw new ApiError(400, 'IS_ONLINE_IMMUTABLE')
  }
}

router.get('/', async (_req, res, next) => {
  try {
    const [rows] = await pool.query(`${COURSE_SELECT} ORDER BY c.sort_order ASC, c.id ASC`)
    res.json({ courses: rows.map(mapAdminCourse) })
  } catch (error) {
    next(error)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const { fields, values } = buildCourseValues(req.body ?? {})
    if (Object.keys(fields).length > 0) return next(validationError(fields))

    let sortOrder = values.sortOrder
    if (req.body?.sortOrder === undefined) {
      const [[row]] = await pool.query(
        'SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_order FROM courses'
      )
      sortOrder = Number(row.next_order)
    }

    const [result] = await pool.execute(
      `INSERT INTO courses
         (name_fr, name_ar, description_fr, description_ar, category, icon, image,
          price, duration_months, currency, is_online, is_active, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        values.nameFr,
        values.nameAr,
        values.descriptionFr,
        values.descriptionAr,
        values.category,
        values.icon,
        values.image,
        values.price,
        values.durationMonths,
        values.currency,
        values.isOnline ? 1 : 0,
        values.isActive ? 1 : 0,
        sortOrder,
      ]
    )

    const course = await getCourseRow(result.insertId)
    res.status(201).json({ course: mapAdminCourse(course) })
  } catch (error) {
    next(error)
  }
})

router.get('/:courseId', async (req, res, next) => {
  const courseId = parseId(req.params.courseId)
  if (!courseId) return next(new ApiError(400, 'INVALID_COURSE'))

  try {
    const course = await assertCourse(courseId)

    const [axisRows] = await pool.execute(
      `SELECT id, course_id, title_fr, title_ar, \`position\`
         FROM course_axes
        WHERE course_id = ?
        ORDER BY \`position\` ASC, id ASC`,
      [courseId]
    )

    const [lessonRows] = await pool.execute(
      `SELECT id, course_id, axis_id, title_fr, title_ar, description_fr, description_ar,
              video_ref, \`position\`, duration, is_active, created_at, updated_at
         FROM lessons
        WHERE course_id = ?
        ORDER BY axis_id ASC, \`position\` ASC, id ASC`,
      [courseId]
    )

    const lessonsByAxis = new Map()
    const ungroupedLessons = []
    for (const row of lessonRows) {
      const lesson = mapAdminLesson(row)
      if (lesson.axisId === null) {
        ungroupedLessons.push(lesson)
        continue
      }
      if (!lessonsByAxis.has(lesson.axisId)) lessonsByAxis.set(lesson.axisId, [])
      lessonsByAxis.get(lesson.axisId).push(lesson)
    }

    res.json({
      course: mapAdminCourse(course),
      axes: axisRows.map((row) => ({
        ...mapAdminAxis(row),
        lessons: lessonsByAxis.get(Number(row.id)) ?? [],
      })),
      ungroupedLessons,
    })
  } catch (error) {
    next(error)
  }
})

router.put('/:courseId', async (req, res, next) => {
  const courseId = parseId(req.params.courseId)
  if (!courseId) return next(new ApiError(400, 'INVALID_COURSE'))

  try {
    const existing = await assertCourse(courseId)
    assertOnlineImmutable(req.body ?? {}, existing)
    const { fields, values } = buildCourseValues(req.body ?? {}, existing)
    if (Object.keys(fields).length > 0) return next(validationError(fields))

    await pool.execute(
      `UPDATE courses
          SET name_fr = ?, name_ar = ?, description_fr = ?, description_ar = ?,
              category = ?, icon = ?, image = ?, price = ?, duration_months = ?,
              currency = ?, is_online = ?, is_active = ?, sort_order = ?
        WHERE id = ?`,
      [
        values.nameFr,
        values.nameAr,
        values.descriptionFr,
        values.descriptionAr,
        values.category,
        values.icon,
        values.image,
        values.price,
        values.durationMonths,
        values.currency,
        values.isOnline ? 1 : 0,
        values.isActive ? 1 : 0,
        values.sortOrder,
        courseId,
      ]
    )

    const course = await getCourseRow(courseId)
    res.json({ course: mapAdminCourse(course) })
  } catch (error) {
    next(error)
  }
})

router.patch('/:courseId/status', async (req, res, next) => {
  const courseId = parseId(req.params.courseId)
  if (!courseId) return next(new ApiError(400, 'INVALID_COURSE'))

  const value = req.body?.isActive
  if (typeof value !== 'boolean' && value !== 0 && value !== 1) {
    return next(validationError({ isActive: 'BOOLEAN_REQUIRED' }))
  }

  try {
    const existing = await assertCourse(courseId)
    assertOnlineImmutable(req.body ?? {}, existing)
    await pool.execute('UPDATE courses SET is_active = ? WHERE id = ?', [
      toBoolean(value) ? 1 : 0,
      courseId,
    ])
    const course = await getCourseRow(courseId)
    res.json({ course: mapAdminCourse(course) })
  } catch (error) {
    next(error)
  }
})

router.delete('/:courseId', async (req, res, next) => {
  const courseId = parseId(req.params.courseId)
  if (!courseId) return next(new ApiError(400, 'INVALID_COURSE'))

  try {
    const [result] = await pool.execute('DELETE FROM courses WHERE id = ?', [courseId])
    if (result.affectedRows === 0) return next(new ApiError(404, 'COURSE_NOT_FOUND'))
    res.status(204).end()
  } catch (error) {
    next(error)
  }
})

/* --------------------------------- Axes --------------------------------- */

router.post('/:courseId/axes', async (req, res, next) => {
  const courseId = parseId(req.params.courseId)
  if (!courseId) return next(new ApiError(400, 'INVALID_COURSE'))

  try {
    await assertOnlineCourse(courseId)
    const { fields, values } = buildAxisValues(req.body ?? {})
    if (Object.keys(fields).length > 0) return next(validationError(fields))

    const [[row]] = await pool.execute(
      'SELECT COALESCE(MAX(`position`), 0) + 1 AS next_position FROM course_axes WHERE course_id = ?',
      [courseId]
    )

    const [result] = await pool.execute(
      `INSERT INTO course_axes (course_id, title_fr, title_ar, \`position\`)
       VALUES (?, ?, ?, ?)`,
      [courseId, values.titleFr, values.titleAr, Number(row.next_position)]
    )

    const [rows] = await pool.execute(
      `SELECT id, course_id, title_fr, title_ar, \`position\`
         FROM course_axes WHERE id = ? LIMIT 1`,
      [result.insertId]
    )

    res.status(201).json({ axis: mapAdminAxis(rows[0]) })
  } catch (error) {
    next(error)
  }
})

router.put('/:courseId/axes/:axisId', async (req, res, next) => {
  const courseId = parseId(req.params.courseId)
  const axisId = parseId(req.params.axisId)
  if (!courseId) return next(new ApiError(400, 'INVALID_COURSE'))
  if (!axisId) return next(new ApiError(400, 'INVALID_AXIS'))

  try {
    await assertOnlineCourse(courseId)
    const [existingRows] = await pool.execute(
      `SELECT id, course_id, title_fr, title_ar, \`position\`
         FROM course_axes WHERE id = ? AND course_id = ? LIMIT 1`,
      [axisId, courseId]
    )
    if (existingRows.length === 0) return next(new ApiError(404, 'AXIS_NOT_FOUND'))

    const { fields, values } = buildAxisValues(req.body ?? {}, existingRows[0])
    if (Object.keys(fields).length > 0) return next(validationError(fields))

    await pool.execute('UPDATE course_axes SET title_fr = ?, title_ar = ? WHERE id = ?', [
      values.titleFr,
      values.titleAr,
      axisId,
    ])

    const [rows] = await pool.execute(
      `SELECT id, course_id, title_fr, title_ar, \`position\`
         FROM course_axes WHERE id = ? LIMIT 1`,
      [axisId]
    )
    res.json({ axis: mapAdminAxis(rows[0]) })
  } catch (error) {
    next(error)
  }
})

router.delete('/:courseId/axes/:axisId', async (req, res, next) => {
  const courseId = parseId(req.params.courseId)
  const axisId = parseId(req.params.axisId)
  if (!courseId) return next(new ApiError(400, 'INVALID_COURSE'))
  if (!axisId) return next(new ApiError(400, 'INVALID_AXIS'))

  try {
    await assertOnlineCourse(courseId)
    const [existingRows] = await pool.execute(
      'SELECT id FROM course_axes WHERE id = ? AND course_id = ? LIMIT 1',
      [axisId, courseId]
    )
    if (existingRows.length === 0) return next(new ApiError(404, 'AXIS_NOT_FOUND'))

    const [[countRow]] = await pool.execute(
      'SELECT COUNT(*) AS total FROM lessons WHERE axis_id = ?',
      [axisId]
    )
    if (Number(countRow.total) > 0) return next(new ApiError(409, 'AXIS_NOT_EMPTY'))

    await pool.execute('DELETE FROM course_axes WHERE id = ?', [axisId])
    res.status(204).end()
  } catch (error) {
    next(error)
  }
})

router.post('/:courseId/axes/reorder', async (req, res, next) => {
  const courseId = parseId(req.params.courseId)
  if (!courseId) return next(new ApiError(400, 'INVALID_COURSE'))

  const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(parseId) : []
  if (ids.length === 0 || ids.some((id) => !id)) {
    return next(validationError({ ids: 'ORDER_REQUIRED' }))
  }

  try {
    await assertOnlineCourse(courseId)
  } catch (error) {
    return next(error)
  }

  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const [rows] = await connection.execute(
      'SELECT id FROM course_axes WHERE course_id = ? FOR UPDATE',
      [courseId]
    )
    const existing = new Set(rows.map((row) => Number(row.id)))
    if (existing.size !== ids.length || ids.some((id) => !existing.has(id))) {
      throw new ApiError(400, 'INVALID_ORDER')
    }

    for (const [index, id] of ids.entries()) {
      await connection.execute('UPDATE course_axes SET `position` = ? WHERE id = ?', [
        index + 1,
        id,
      ])
    }

    await connection.commit()
    res.json({ reordered: true })
  } catch (error) {
    await connection.rollback().catch(() => {})
    next(error)
  } finally {
    connection.release()
  }
})

/* -------------------------------- Lessons -------------------------------- */

router.post('/:courseId/lessons', async (req, res, next) => {
  const courseId = parseId(req.params.courseId)
  if (!courseId) return next(new ApiError(400, 'INVALID_COURSE'))

  const axisId = parseId(req.body?.axisId)
  if (!axisId) return next(validationError({ axisId: 'AXIS_REQUIRED' }))

  try {
    await assertOnlineCourse(courseId)
    const [axisRows] = await pool.execute(
      'SELECT id FROM course_axes WHERE id = ? AND course_id = ? LIMIT 1',
      [axisId, courseId]
    )
    if (axisRows.length === 0) return next(new ApiError(400, 'INVALID_AXIS'))

    const { fields, values } = buildLessonValues(req.body ?? {})
    if (Object.keys(fields).length > 0) return next(validationError(fields))

    const [[row]] = await pool.execute(
      `SELECT COALESCE(MAX(\`position\`), 0) + 1 AS next_position
         FROM lessons WHERE course_id = ? AND axis_id = ?`,
      [courseId, axisId]
    )

    const [result] = await pool.execute(
      `INSERT INTO lessons
         (course_id, axis_id, title_fr, title_ar, description_fr, description_ar,
          video_ref, \`position\`, duration, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        courseId,
        axisId,
        values.titleFr,
        values.titleAr,
        values.descriptionFr,
        values.descriptionAr,
        values.videoRef,
        Number(row.next_position),
        values.duration,
        values.isActive ? 1 : 0,
      ]
    )

    const [rows] = await pool.execute(
      `SELECT id, course_id, axis_id, title_fr, title_ar, description_fr, description_ar,
              video_ref, \`position\`, duration, is_active, created_at, updated_at
         FROM lessons WHERE id = ? LIMIT 1`,
      [result.insertId]
    )

    res.status(201).json({ lesson: mapAdminLesson(rows[0]) })
  } catch (error) {
    next(error)
  }
})

router.put('/:courseId/lessons/:lessonId', async (req, res, next) => {
  const courseId = parseId(req.params.courseId)
  const lessonId = parseId(req.params.lessonId)
  if (!courseId) return next(new ApiError(400, 'INVALID_COURSE'))
  if (!lessonId) return next(new ApiError(400, 'INVALID_LESSON'))

  try {
    await assertOnlineCourse(courseId)
    const [existingRows] = await pool.execute(
      `SELECT id, course_id, axis_id, title_fr, title_ar, description_fr, description_ar,
              video_ref, \`position\`, duration, is_active
         FROM lessons WHERE id = ? AND course_id = ? LIMIT 1`,
      [lessonId, courseId]
    )
    if (existingRows.length === 0) return next(new ApiError(404, 'LESSON_NOT_FOUND'))

    const current = existingRows[0]
    const targetAxisId =
      req.body?.axisId === undefined ? current.axis_id : parseId(req.body.axisId)
    if (!targetAxisId) return next(validationError({ axisId: 'AXIS_REQUIRED' }))

    const [axisRows] = await pool.execute(
      'SELECT id FROM course_axes WHERE id = ? AND course_id = ? LIMIT 1',
      [targetAxisId, courseId]
    )
    if (axisRows.length === 0) return next(new ApiError(400, 'INVALID_AXIS'))

    const { fields, values } = buildLessonValues(req.body ?? {}, current)
    if (Object.keys(fields).length > 0) return next(validationError(fields))

    const moved = Number(current.axis_id) !== Number(targetAxisId)
    let position = Number(current.position)
    if (moved) {
      const [[row]] = await pool.execute(
        `SELECT COALESCE(MAX(\`position\`), 0) + 1 AS next_position
           FROM lessons WHERE course_id = ? AND axis_id = ?`,
        [courseId, targetAxisId]
      )
      position = Number(row.next_position)
    }

    await pool.execute(
      `UPDATE lessons
          SET axis_id = ?, title_fr = ?, title_ar = ?, description_fr = ?,
              description_ar = ?, video_ref = ?, \`position\` = ?, duration = ?, is_active = ?
        WHERE id = ?`,
      [
        targetAxisId,
        values.titleFr,
        values.titleAr,
        values.descriptionFr,
        values.descriptionAr,
        values.videoRef,
        position,
        values.duration,
        values.isActive ? 1 : 0,
        lessonId,
      ]
    )

    const [rows] = await pool.execute(
      `SELECT id, course_id, axis_id, title_fr, title_ar, description_fr, description_ar,
              video_ref, \`position\`, duration, is_active, created_at, updated_at
         FROM lessons WHERE id = ? LIMIT 1`,
      [lessonId]
    )
    res.json({ lesson: mapAdminLesson(rows[0]) })
  } catch (error) {
    next(error)
  }
})

router.patch('/:courseId/lessons/:lessonId/status', async (req, res, next) => {
  const courseId = parseId(req.params.courseId)
  const lessonId = parseId(req.params.lessonId)
  if (!courseId) return next(new ApiError(400, 'INVALID_COURSE'))
  if (!lessonId) return next(new ApiError(400, 'INVALID_LESSON'))

  const value = req.body?.isActive
  if (typeof value !== 'boolean' && value !== 0 && value !== 1) {
    return next(validationError({ isActive: 'BOOLEAN_REQUIRED' }))
  }

  try {
    await assertOnlineCourse(courseId)
    const [result] = await pool.execute(
      'UPDATE lessons SET is_active = ? WHERE id = ? AND course_id = ?',
      [toBoolean(value) ? 1 : 0, lessonId, courseId]
    )
    if (result.affectedRows === 0) return next(new ApiError(404, 'LESSON_NOT_FOUND'))

    const [rows] = await pool.execute(
      `SELECT id, course_id, axis_id, title_fr, title_ar, description_fr, description_ar,
              video_ref, \`position\`, duration, is_active, created_at, updated_at
         FROM lessons WHERE id = ? LIMIT 1`,
      [lessonId]
    )
    res.json({ lesson: mapAdminLesson(rows[0]) })
  } catch (error) {
    next(error)
  }
})

router.delete('/:courseId/lessons/:lessonId', async (req, res, next) => {
  const courseId = parseId(req.params.courseId)
  const lessonId = parseId(req.params.lessonId)
  if (!courseId) return next(new ApiError(400, 'INVALID_COURSE'))
  if (!lessonId) return next(new ApiError(400, 'INVALID_LESSON'))

  try {
    await assertOnlineCourse(courseId)
    const [result] = await pool.execute(
      'DELETE FROM lessons WHERE id = ? AND course_id = ?',
      [lessonId, courseId]
    )
    if (result.affectedRows === 0) return next(new ApiError(404, 'LESSON_NOT_FOUND'))
    res.status(204).end()
  } catch (error) {
    next(error)
  }
})

router.post('/:courseId/lessons/reorder', async (req, res, next) => {
  const courseId = parseId(req.params.courseId)
  const axisId = parseId(req.body?.axisId)
  if (!courseId) return next(new ApiError(400, 'INVALID_COURSE'))
  if (!axisId) return next(validationError({ axisId: 'AXIS_REQUIRED' }))

  const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(parseId) : []
  if (ids.length === 0 || ids.some((id) => !id)) {
    return next(validationError({ ids: 'ORDER_REQUIRED' }))
  }

  try {
    await assertOnlineCourse(courseId)
  } catch (error) {
    return next(error)
  }

  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const [rows] = await connection.execute(
      `SELECT id FROM lessons
        WHERE course_id = ? AND axis_id = ?
        FOR UPDATE`,
      [courseId, axisId]
    )
    const existing = new Set(rows.map((row) => Number(row.id)))
    if (existing.size !== ids.length || ids.some((id) => !existing.has(id))) {
      throw new ApiError(400, 'INVALID_ORDER')
    }

    for (const [index, id] of ids.entries()) {
      await connection.execute('UPDATE lessons SET `position` = ? WHERE id = ?', [
        index + 1,
        id,
      ])
    }

    await connection.commit()
    res.json({ reordered: true })
  } catch (error) {
    await connection.rollback().catch(() => {})
    next(error)
  } finally {
    connection.release()
  }
})

export default router
