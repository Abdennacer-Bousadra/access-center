import { pool } from '../db.js'

const PUBLIC_COLUMNS =
  'id, full_name, phone, address, email, role, email_verified, is_active, created_at'

export async function findUserByEmail(email) {
  const [rows] = await pool.execute(
    `SELECT ${PUBLIC_COLUMNS}, password_hash FROM users WHERE email = ? LIMIT 1`,
    [email]
  )
  return rows[0] ?? null
}

export async function findUserById(id) {
  const [rows] = await pool.execute(
    `SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = ? LIMIT 1`,
    [id]
  )
  return rows[0] ?? null
}

export function toPublicUser(row) {
  return {
    id: Number(row.id),
    fullName: row.full_name,
    phone: row.phone,
    address: row.address,
    email: row.email,
    role: row.role,
    emailVerified: Boolean(row.email_verified),
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
  }
}
