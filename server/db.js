import mysql from 'mysql2/promise'

const {
  DB_HOST = 'localhost',
  DB_PORT = '3306',
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  DB_CONNECTION_LIMIT = '10',
} = process.env

// The pool is only created once the database credentials exist, so the API can
// boot before Phase 1 creates the schema.
export const isDbConfigured = Boolean(DB_USER && DB_NAME)

export const pool = isDbConfigured
  ? mysql.createPool({
      host: DB_HOST,
      port: Number(DB_PORT),
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: Number(DB_CONNECTION_LIMIT),
      queueLimit: 0,
      charset: 'utf8mb4',
      timezone: 'Z',
    })
  : null

export async function checkDatabase() {
  if (!pool) return 'not_configured'

  try {
    await pool.query('SELECT 1')
    return 'up'
  } catch (error) {
    console.error('[db] health check failed:', error.code || error.message)
    return 'down'
  }
}
