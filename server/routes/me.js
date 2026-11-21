import { Router } from 'express'
import { pool } from '../db.js'
import { toPublicUser } from '../lib/users.js'
import { requireAuth } from '../middleware/requireAuth.js'

const router = Router()

router.get('/', requireAuth, (req, res) => {
  res.set('Cache-Control', 'no-store')
  res.json({ user: toPublicUser(req.user) })
})

// Approved course access for the signed-in user (used by the online courses UI).
router.get('/enrollments', requireAuth, async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT course_id
         FROM enrollments
        WHERE user_id = ? AND status = 'approved'
          AND (expires_at IS NULL OR expires_at > NOW())
        ORDER BY course_id ASC`,
      [req.user.id]
    )

    res.set('Cache-Control', 'no-store')
    res.json({ courseIds: rows.map((row) => Number(row.course_id)) })
  } catch (error) {
    next(error)
  }
})

export default router
