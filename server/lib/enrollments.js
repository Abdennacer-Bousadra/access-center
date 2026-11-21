/**
 * Enrollment helpers shared by the subscribers screens and the course-side
 * subscriber tab. Access is granted only while `status = 'approved'` and the
 * optional `expires_at` is still in the future.
 */

export function toExpiresAt(value) {
  if (value === undefined || value === null || value === '') {
    return { ok: true, value: null }
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? { ok: false } : { ok: true, value }
  }
  if (typeof value !== 'string') return { ok: false }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return { ok: false }
  return { ok: true, value: date }
}

export async function saveEnrollment(executor, { userId, courseId, approved, expiresAt }) {
  const status = approved ? 'approved' : 'rejected'
  const expiry = approved ? (expiresAt ?? null) : null

  await executor.execute(
    `INSERT INTO enrollments (user_id, course_id, status, expires_at)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE status = VALUES(status), expires_at = VALUES(expires_at)`,
    [userId, courseId, status, expiry]
  )

  return { status, expiresAt: expiry }
}
