import { ApiError } from './apiError.js'

export function parseId(value) {
  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

export function toText(value, maxLength) {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, maxLength)
}

export function toOptionalText(value, maxLength) {
  if (typeof value !== 'string') return null
  const text = value.trim()
  return text ? text.slice(0, maxLength) : null
}

export function toBoolean(value, fallback = false) {
  if (typeof value === 'boolean') return value
  if (value === 1 || value === '1' || value === 'true') return true
  if (value === 0 || value === '0' || value === 'false') return false
  return fallback
}

export function toSortOrder(value, fallback = 0) {
  const number = Number(value)
  if (!Number.isSafeInteger(number) || number < -100000 || number > 100000) return fallback
  return number
}

export function toNullablePrice(value) {
  if (value === null || value === undefined || value === '') return null
  const number = Number(value)
  if (!Number.isFinite(number) || number < 0 || number > 99999999.99) return undefined
  return Math.round(number * 100) / 100
}

export function toCurrency(value, fallback = 'MAD') {
  const currency = toText(value, 3).toUpperCase()
  return /^[A-Z]{3}$/.test(currency) ? currency : fallback
}

export function toNullableMonths(value) {
  if (value === null || value === undefined || value === '') return null
  const number = Number(value)
  if (!Number.isSafeInteger(number) || number < 1 || number > 255) return undefined
  return number
}

export function toDuration(value) {
  if (value === null || value === undefined || value === '') return null
  const number = Number(value)
  if (!Number.isSafeInteger(number) || number < 0 || number > 2147483647) return undefined
  return number
}

export function validationError(fields) {
  return new ApiError(400, 'VALIDATION_ERROR', { fields })
}

export function mapAdminUser(row) {
  return {
    id: Number(row.id),
    fullName: row.full_name,
    phone: row.phone,
    address: row.address,
    email: row.email,
    role: row.role,
    emailVerified: Boolean(row.email_verified),
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    approvedCount: row.approved_count === undefined ? undefined : Number(row.approved_count),
    pendingCount: row.pending_count === undefined ? undefined : Number(row.pending_count),
    completedLessons:
      row.completed_lessons === undefined ? undefined : Number(row.completed_lessons),
  }
}

export function mapAdminService(row) {
  return {
    id: Number(row.id),
    nameFr: row.name_fr,
    nameAr: row.name_ar,
    descriptionFr: row.description_fr,
    descriptionAr: row.description_ar,
    category: row.category,
    icon: row.icon,
    image: row.image,
    price: row.price === null || row.price === undefined ? null : Number(row.price),
    currency: row.currency,
    isActive: Boolean(row.is_active),
    sortOrder: Number(row.sort_order),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapAdminCourse(row) {
  return {
    id: Number(row.id),
    nameFr: row.name_fr,
    nameAr: row.name_ar,
    descriptionFr: row.description_fr,
    descriptionAr: row.description_ar,
    category: row.category,
    icon: row.icon,
    image: row.image,
    price: row.price === null || row.price === undefined ? null : Number(row.price),
    currency: row.currency,
    durationMonths:
      row.duration_months === null || row.duration_months === undefined
        ? null
        : Number(row.duration_months),
    isOnline: Boolean(row.is_online),
    isActive: Boolean(row.is_active),
    sortOrder: Number(row.sort_order),
    axisCount: row.axis_count === undefined ? undefined : Number(row.axis_count),
    lessonCount: row.lesson_count === undefined ? undefined : Number(row.lesson_count),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapAdminAxis(row) {
  return {
    id: Number(row.id),
    courseId: Number(row.course_id),
    titleFr: row.title_fr,
    titleAr: row.title_ar,
    position: Number(row.position),
  }
}

export function mapAdminLesson(row) {
  return {
    id: Number(row.id),
    courseId: Number(row.course_id),
    axisId: row.axis_id === null || row.axis_id === undefined ? null : Number(row.axis_id),
    titleFr: row.title_fr,
    titleAr: row.title_ar,
    descriptionFr: row.description_fr,
    descriptionAr: row.description_ar,
    videoRef: row.video_ref,
    position: Number(row.position),
    duration: row.duration === null || row.duration === undefined ? null : Number(row.duration),
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
