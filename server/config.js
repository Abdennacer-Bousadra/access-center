import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const serverDir = path.dirname(fileURLToPath(import.meta.url))

// One .env for the whole project, kept at the repository root (outside /server).
// ENV_FILE can override the location (useful on cPanel).
dotenv.config({
  path: process.env.ENV_FILE || path.resolve(serverDir, '..', '.env'),
  quiet: true,
})
