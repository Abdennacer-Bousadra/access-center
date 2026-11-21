import fsp from 'node:fs/promises'
import path from 'node:path'
import { Router } from 'express'
import { getVideoDir, listVideoFileNames } from '../../lib/videoFiles.js'

const router = Router()

router.get('/', async (_req, res, next) => {
  try {
    const listing = await listVideoFileNames()
    if (!listing.configured) {
      return res.json({ configured: false, available: false, files: [] })
    }
    if (!listing.available) {
      return res.json({ configured: true, available: false, files: [] })
    }

    const videoDir = getVideoDir()
    const files = await Promise.all(
      listing.names.map(async (name) => {
        try {
          const stat = await fsp.stat(path.join(videoDir, name))
          return {
            name,
            size: stat.size,
            modifiedAt: stat.mtime.toISOString(),
          }
        } catch {
          return { name, size: null, modifiedAt: null }
        }
      })
    )

    res.json({ configured: true, available: true, files })
  } catch (error) {
    next(error)
  }
})

export default router
