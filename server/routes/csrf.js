import { Router } from 'express'
import { issueCsrfToken } from '../lib/csrf.js'

const router = Router()

router.get('/', (req, res) => {
  res.set('Cache-Control', 'no-store')
  res.json({ csrfToken: issueCsrfToken(req, res) })
})

export default router
