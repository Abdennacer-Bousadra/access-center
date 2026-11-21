import { Router } from 'express'
import { pool } from '../../db.js'
import { mapAdminUser } from '../../lib/adminHelpers.js'

const router = Router()

router.get('/overview', async (_req, res, next) => {
  try {
    const [[stats]] = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM users) AS users,
         (SELECT COUNT(*) FROM users WHERE email_verified = 1) AS verified_users,
         (SELECT COUNT(*) FROM users WHERE is_active = 1) AS active_users,
         (SELECT COUNT(*) FROM users WHERE is_active = 0) AS blocked_users,
         (SELECT COUNT(*) FROM enrollments WHERE status = 'approved') AS approved_enrollments,
         (SELECT COUNT(*) FROM enrollments WHERE status = 'pending') AS pending_enrollments,
         (SELECT COUNT(*) FROM courses WHERE is_online = 0) AS courses,
         (SELECT COUNT(*) FROM courses WHERE is_online = 1) AS online_courses,
         (SELECT COUNT(*) FROM courses WHERE is_active = 1) AS active_courses,
         (SELECT COUNT(*) FROM services) AS services,
         (SELECT COUNT(*) FROM services WHERE is_active = 1) AS active_services`
    )

    const [recentRows] = await pool.query(
      `SELECT id, full_name, phone, address, email, role, email_verified, is_active, created_at
         FROM users
        ORDER BY created_at DESC, id DESC
        LIMIT 8`
    )

    res.json({
      stats: {
        users: Number(stats.users),
        verifiedUsers: Number(stats.verified_users),
        activeUsers: Number(stats.active_users),
        blockedUsers: Number(stats.blocked_users),
        approvedEnrollments: Number(stats.approved_enrollments),
        pendingEnrollments: Number(stats.pending_enrollments),
        courses: Number(stats.courses),
        onlineCourses: Number(stats.online_courses),
        activeCourses: Number(stats.active_courses),
        services: Number(stats.services),
        activeServices: Number(stats.active_services),
      },
      recentUsers: recentRows.map(mapAdminUser),
    })
  } catch (error) {
    next(error)
  }
})

export default router
