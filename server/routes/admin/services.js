import { Router } from 'express'
import { pool } from '../../db.js'
import { ApiError } from '../../lib/apiError.js'
import {
  mapAdminService,
  parseId,
  toBoolean,
  toCurrency,
  toNullablePrice,
  toOptionalText,
  toSortOrder,
  toText,
  validationError,
} from '../../lib/adminHelpers.js'

const router = Router()

function buildServiceValues(body, current = null) {
  const fields = {}
  const nameFr = toText(body.nameFr ?? current?.name_fr, 150)
  const nameAr = toText(body.nameAr ?? current?.name_ar, 150)

  if (!nameFr) fields.nameFr = 'NAME_FR_REQUIRED'
  if (!nameAr) fields.nameAr = 'NAME_AR_REQUIRED'

  const descriptionFr =
    typeof body.descriptionFr === 'string'
      ? body.descriptionFr.trim()
      : (current?.description_fr ?? '')
  const descriptionAr =
    typeof body.descriptionAr === 'string'
      ? body.descriptionAr.trim()
      : (current?.description_ar ?? '')

  const rawPrice =
    body.price === undefined
      ? (current?.price ?? null)
      : body.price
  const price = toNullablePrice(rawPrice)
  if (price === undefined) fields.price = 'PRICE_INVALID'

  const sortOrder = toSortOrder(
    body.sortOrder === undefined ? (current?.sort_order ?? 0) : body.sortOrder,
    current?.sort_order ?? 0
  )

  return {
    fields,
    values: {
      nameFr,
      nameAr,
      descriptionFr,
      descriptionAr,
      category: toOptionalText(body.category ?? current?.category, 50),
      icon: toOptionalText(body.icon ?? current?.icon, 50),
      image: toOptionalText(body.image ?? current?.image, 500),
      price,
      currency: toCurrency(body.currency ?? current?.currency),
      isActive: toBoolean(body.isActive, current ? Boolean(current.is_active) : true),
      sortOrder,
    },
  }
}

router.get('/', async (_req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name_fr, name_ar, description_fr, description_ar,
              category, icon, image, price, currency, is_active, sort_order,
              created_at, updated_at
         FROM services
        ORDER BY sort_order ASC, id ASC`
    )
    res.json({ services: rows.map(mapAdminService) })
  } catch (error) {
    next(error)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const { fields, values } = buildServiceValues(req.body ?? {})
    if (Object.keys(fields).length > 0) return next(validationError(fields))

    let sortOrder = values.sortOrder
    if (req.body?.sortOrder === undefined) {
      const [[row]] = await pool.query(
        'SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_order FROM services'
      )
      sortOrder = Number(row.next_order)
    }

    const [result] = await pool.execute(
      `INSERT INTO services
         (name_fr, name_ar, description_fr, description_ar, category, icon, image,
          price, currency, is_active, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        values.nameFr,
        values.nameAr,
        values.descriptionFr,
        values.descriptionAr,
        values.category,
        values.icon,
        values.image,
        values.price,
        values.currency,
        values.isActive ? 1 : 0,
        sortOrder,
      ]
    )

    const [rows] = await pool.execute(
      `SELECT id, name_fr, name_ar, description_fr, description_ar,
              category, icon, image, price, currency, is_active, sort_order,
              created_at, updated_at
         FROM services WHERE id = ? LIMIT 1`,
      [result.insertId]
    )

    res.status(201).json({ service: mapAdminService(rows[0]) })
  } catch (error) {
    next(error)
  }
})

router.put('/:id', async (req, res, next) => {
  const serviceId = parseId(req.params.id)
  if (!serviceId) return next(new ApiError(400, 'INVALID_SERVICE'))

  try {
    const [existingRows] = await pool.execute(
      `SELECT id, name_fr, name_ar, description_fr, description_ar,
              category, icon, image, price, currency, is_active, sort_order
         FROM services WHERE id = ? LIMIT 1`,
      [serviceId]
    )
    if (existingRows.length === 0) return next(new ApiError(404, 'SERVICE_NOT_FOUND'))

    const { fields, values } = buildServiceValues(req.body ?? {}, existingRows[0])
    if (Object.keys(fields).length > 0) return next(validationError(fields))

    await pool.execute(
      `UPDATE services
          SET name_fr = ?, name_ar = ?, description_fr = ?, description_ar = ?,
              category = ?, icon = ?, image = ?, price = ?, currency = ?,
              is_active = ?, sort_order = ?
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
        values.currency,
        values.isActive ? 1 : 0,
        values.sortOrder,
        serviceId,
      ]
    )

    const [rows] = await pool.execute(
      `SELECT id, name_fr, name_ar, description_fr, description_ar,
              category, icon, image, price, currency, is_active, sort_order,
              created_at, updated_at
         FROM services WHERE id = ? LIMIT 1`,
      [serviceId]
    )

    res.json({ service: mapAdminService(rows[0]) })
  } catch (error) {
    next(error)
  }
})

router.delete('/:id', async (req, res, next) => {
  const serviceId = parseId(req.params.id)
  if (!serviceId) return next(new ApiError(400, 'INVALID_SERVICE'))

  try {
    const [result] = await pool.execute('DELETE FROM services WHERE id = ?', [serviceId])
    if (result.affectedRows === 0) return next(new ApiError(404, 'SERVICE_NOT_FOUND'))
    res.status(204).end()
  } catch (error) {
    next(error)
  }
})

export default router
