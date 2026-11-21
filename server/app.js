import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import { checkDatabase } from './db.js'
import authRoutes from './routes/auth.js'
import catalogRoutes from './routes/catalog.js'
import csrfRoutes from './routes/csrf.js'
import meRoutes from './routes/me.js'
import onlineCoursesRoutes from './routes/onlineCourses.js'
import adminRoutes from './routes/admin/index.js'
import { csrfProtection } from './middleware/csrf.js'

const DEFAULT_CLIENT_ORIGIN = 'http://localhost:5173'

function parseOrigins(value) {
  return String(value || DEFAULT_CLIENT_ORIGIN)
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
}

export function createApp() {
  const app = express()
  const allowedOrigins = parseOrigins(process.env.CLIENT_ORIGIN)

  app.disable('x-powered-by')
  app.set('trust proxy', 1)

  app.use(
    cors({
      origin(origin, callback) {
        // No Origin header: same-origin request, Vite proxy, curl or server-to-server.
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
        return callback(new Error('Not allowed by CORS'))
      },
      credentials: true,
    })
  )

  app.use(helmet())
  app.use(express.json({ limit: '100kb' }))
  app.use(express.urlencoded({ extended: false, limit: '100kb' }))
  app.use(cookieParser())

  app.get('/api/health', async (_req, res) => {
    const db = await checkDatabase()
    res.json({
      status: db === 'down' ? 'degraded' : 'ok',
      db,
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    })
  })

  app.use('/api', csrfProtection)
  app.use('/api/csrf', csrfRoutes)
  app.use('/api', catalogRoutes)
  app.use('/api/auth', authRoutes)
  app.use('/api/me', meRoutes)
  app.use('/api/online-courses', onlineCoursesRoutes)
  app.use('/api/admin', adminRoutes)

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Not found' })
  })

  // eslint-disable-next-line no-unused-vars
  app.use((error, _req, res, _next) => {
    if (error.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'INVALID_JSON' })
    }

    const status = error.status || (error.message === 'Not allowed by CORS' ? 403 : 500)
    const code =
      error.code ||
      (error.message === 'Not allowed by CORS'
        ? 'CORS_NOT_ALLOWED'
        : status >= 500
          ? 'INTERNAL_ERROR'
          : 'REQUEST_FAILED')

    if (status >= 500) console.error(error)

    const payload = { error: code }
    if (error.details) Object.assign(payload, error.details)

    return res.status(status).json(payload)
  })

  return app
}
