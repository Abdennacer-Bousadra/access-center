import fsp from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const libDir = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(libDir, '..', '..')

const CONTENT_TYPES = {
  '.mp4': 'video/mp4',
  '.m4v': 'video/mp4',
  '.webm': 'video/webm',
  '.ogv': 'video/ogg',
  '.ogg': 'video/ogg',
  '.mov': 'video/quicktime',
}

/**
 * Private video directory. `VIDEO_DIR` may be absolute (recommended on the
 * server: a folder outside public_html) or relative to the project root.
 */
export function getVideoDir() {
  const configured = String(process.env.VIDEO_DIR || '').trim()
  if (!configured) return null
  return path.resolve(projectRoot, configured)
}

/**
 * A stored `lessons.video_ref` must be a bare file name: no directory part,
 * no traversal, no control characters, and an allowed video extension.
 */
export function isValidVideoFileName(fileName) {
  if (typeof fileName !== 'string') return false
  const name = fileName.trim()
  if (!name || name !== fileName) return false
  if (name.length > 255) return false
  if (name === '.' || name === '..') return false
  if (/[\u0000-\u001f\u007f]/.test(name)) return false
  if (/[\\/]/.test(name)) return false
  if (path.basename(name) !== name) return false

  const extension = path.extname(name).toLowerCase()
  return Object.hasOwn(CONTENT_TYPES, extension)
}

/**
 * Turns a stored video file name into an absolute path inside VIDEO_DIR.
 * Returns null when the name is invalid, VIDEO_DIR is missing, or the
 * resolved path escapes the private directory.
 */
export function resolveVideoFile(fileName) {
  if (!isValidVideoFileName(fileName)) return null

  const videoDir = getVideoDir()
  if (!videoDir) return null

  const resolved = path.resolve(videoDir, fileName)
  const relative = path.relative(videoDir, resolved)
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) return null

  return {
    path: resolved,
    fileName,
    contentType: CONTENT_TYPES[path.extname(fileName).toLowerCase()],
  }
}

export function getVideoContentType(fileName) {
  if (typeof fileName !== 'string') return null
  return CONTENT_TYPES[path.extname(fileName).toLowerCase()] ?? null
}

/**
 * Lists the allowed video file names present in VIDEO_DIR. Returns
 * `configured: false` when VIDEO_DIR is missing from the environment and
 * `available: false` when the folder does not exist on disk.
 */
export async function listVideoFileNames() {
  const videoDir = getVideoDir()
  if (!videoDir) return { configured: false, available: false, names: [] }

  let entries
  try {
    entries = await fsp.readdir(videoDir, { withFileTypes: true })
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { configured: true, available: false, names: [] }
    }
    throw error
  }

  const names = entries
    .filter((entry) => entry.isFile() && isValidVideoFileName(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))

  return { configured: true, available: true, names }
}
