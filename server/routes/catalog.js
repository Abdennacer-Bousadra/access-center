import { Router } from 'express'
import { pool } from '../db.js'

const router = Router()

const SERVICE_COLUMNS = `
  id, name_fr, name_ar, description_fr, description_ar,
  category, icon, image, price, currency, sort_order
`

const COURSE_COLUMNS = `
  ${SERVICE_COLUMNS}, duration_months, is_online
`

/**
 * DECIMAL columns are returned as strings by mysql2; the frontend needs numbers
 * (or null for "price on request").
 */
function toPrice(value) {
  if (value === null || value === undefined) return null
  const price = Number(value)
  return Number.isFinite(price) ? price : null
}

function toService(row) {
  return {
    id: row.id,
    nameFr: row.name_fr,
    nameAr: row.name_ar,
    descriptionFr: row.description_fr,
    descriptionAr: row.description_ar,
    category: row.category,
    icon: row.icon,
    image: row.image,
    price: toPrice(row.price),
    currency: row.currency,
    sortOrder: row.sort_order,
  }
}

function toCourse(row) {
  return {
    ...toService(row),
    durationMonths: row.duration_months === null ? null : Number(row.duration_months),
    isOnline: Boolean(row.is_online),
  }
}

router.get('/services', async (_req, res, next) => {
  if (!pool) return res.status(503).json({ error: 'DB_NOT_CONFIGURED' })

  try {
    const [rows] = await pool.execute(
      `SELECT ${SERVICE_COLUMNS}
         FROM services
        WHERE is_active = 1
        ORDER BY sort_order ASC, id ASC`
    )

    res.json({ services: rows.map(toService) })
  } catch (error) {
    next(error)
  }
})

router.get('/courses', async (_req, res, next) => {
  if (!pool) return res.status(503).json({ error: 'DB_NOT_CONFIGURED' })

  try {
    const [rows] = await pool.execute(
      `SELECT ${COURSE_COLUMNS}
         FROM courses
        WHERE is_active = 1
        ORDER BY sort_order ASC, id ASC`
    )

    res.json({ courses: rows.map(toCourse) })
  } catch (error) {
    next(error)
  }
})

export default router
