import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import mysql from 'mysql2/promise'
import '../config.js'

const dbDir = path.dirname(fileURLToPath(import.meta.url))
const schemaPath = path.join(dbDir, 'schema.sql')

/**
 * Idempotent column migration for databases created before the column existed.
 * information_schema keeps this portable across MySQL and MariaDB (unlike
 * `ADD COLUMN IF NOT EXISTS`, which MySQL does not support).
 */
async function ensureColumn(connection, table, column, definition) {
  const [rows] = await connection.execute(
    `SELECT 1
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?
      LIMIT 1`,
    [process.env.DB_NAME, table, column]
  )

  if (rows.length > 0) return

  await connection.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`)
  console.log(`Migration: added ${table}.${column}.`)
}

async function main() {
  const schema = await fs.readFile(schemaPath, 'utf8')

  // multipleStatements is limited to this static migration file only.
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: 'utf8mb4',
    multipleStatements: true,
  })

  try {
    await connection.query(schema)
    await ensureColumn(connection, 'courses', 'is_online', 'TINYINT(1) NOT NULL DEFAULT 0')
    await ensureColumn(connection, 'users', 'is_active', 'TINYINT(1) NOT NULL DEFAULT 1')
    await ensureColumn(connection, 'lessons', 'description_fr', 'TEXT NULL')
    await ensureColumn(connection, 'lessons', 'description_ar', 'TEXT NULL')
    await ensureColumn(connection, 'lessons', 'is_active', 'TINYINT(1) NOT NULL DEFAULT 1')
    await ensureColumn(connection, 'enrollments', 'expires_at', 'DATETIME NULL')
    console.log(`Schema applied to database "${process.env.DB_NAME}".`)
  } finally {
    await connection.end()
  }
}

main().catch((error) => {
  console.error('Migration failed:', error.message)
  process.exitCode = 1
})
