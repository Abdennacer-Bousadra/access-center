import { Router } from 'express'
import { requireAuth } from '../../middleware/requireAuth.js'
import { requireAdmin } from '../../middleware/requireAdmin.js'
import overviewRoutes from './overview.js'
import userRoutes from './users.js'
import serviceRoutes from './services.js'
import courseRoutes from './courses.js'
import onlineCourseRoutes from './onlineCourses.js'
import videoRoutes from './videos.js'

const router = Router()

// Every admin endpoint reads the session, the current role and the active
// flag from the database (requireAuth + requireAdmin).
router.use(requireAuth, requireAdmin)
router.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store')
  next()
})

router.use(overviewRoutes)
router.use('/users', userRoutes)
router.use('/services', serviceRoutes)
router.use('/courses', courseRoutes)
router.use('/online-courses', onlineCourseRoutes)
router.use('/videos', videoRoutes)

export default router
