import readline from 'node:readline/promises'
import { stdin, stdout } from 'node:process'
import bcrypt from 'bcryptjs'
import '../config.js'
import { pool } from '../db.js'
import {
  isStrongPassword,
  isValidEmail,
  normalizeEmail,
  normalizeText,
  validateRegistration,
} from '../lib/validation.js'

const parsedRounds = Number.parseInt(process.env.BCRYPT_ROUNDS ?? '12', 10)
const BCRYPT_ROUNDS =
  Number.isInteger(parsedRounds) && parsedRounds >= 4 && parsedRounds <= 15 ? parsedRounds : 12

const promote = process.argv.includes('--promote')

function closeReadline(rl) {
  try {
    rl.close()
  } catch {
    /* already closed */
  }
}

function validateProfile(values) {
  const { fields } = validateRegistration({
    ...values,
    password: 'ValidPass123!',
    confirmPassword: 'ValidPass123!',
  })
  return { fields }
}

function printFieldErrors(fields) {
  const labels = {
    fullName: 'Full name',
    email: 'Email',
    phone: 'Phone',
    address: 'Address',
    password: 'Password',
    confirmPassword: 'Password confirmation',
  }
  for (const [field, code] of Object.entries(fields)) {
    console.error(`  - ${labels[field] ?? field}: ${code}`)
  }
}

async function askText(rl, question, validate) {
  for (;;) {
    const value = normalizeText(await rl.question(question))
    const fields = validate(value)
    if (Object.keys(fields).length === 0) return value
    console.error('Invalid value:')
    printFieldErrors(fields)
  }
}

function askHidden(question) {
  return new Promise((resolve, reject) => {
    if (!stdin.isTTY) {
      // Non-interactive fallback (CI / piped input): read a visible line.
      const rl = readline.createInterface({ input: stdin, output: stdout })
      rl.question(question)
        .then((answer) => {
          rl.close()
          resolve(answer)
        })
        .catch((error) => {
          rl.close()
          reject(error)
        })
      return
    }

    let value = ''
    let done = false

    const cleanup = () => {
      if (done) return
      done = true
      stdin.removeListener('data', onData)
      stdin.setRawMode(false)
      stdin.pause()
      stdout.write('\n')
    }

    const onData = (chunk) => {
      for (const char of String(chunk)) {
        if (char === '\u0003') {
          cleanup()
          process.exit(130)
        }
        if (char === '\r' || char === '\n') {
          cleanup()
          resolve(value)
          return
        }
        if (char === '\u007f' || char === '\b') {
          if (value.length > 0) {
            value = value.slice(0, -1)
            stdout.write('\b \b')
          }
          continue
        }
        if (char === '\u001b') continue
        value += char
        stdout.write('*')
      }
    }

    stdout.write(question)
    stdin.resume()
    stdin.setEncoding('utf8')
    stdin.setRawMode(true)
    stdin.on('data', onData)
  })
}

async function askPassword() {
  for (;;) {
    const password = await askHidden('Password (hidden): ')
    if (!isStrongPassword(password)) {
      console.error(
        'Password must be at least 8 characters and include uppercase, lowercase, a digit and a symbol.'
      )
      continue
    }

    const confirmPassword = await askHidden('Confirm password (hidden): ')
    if (password !== confirmPassword) {
      console.error('Passwords do not match.')
      continue
    }

    return password
  }
}

async function ensureColumns() {
  const [tables] = await pool.execute(
    `SELECT 1 FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' LIMIT 1`,
    [process.env.DB_NAME]
  )
  if (tables.length === 0) {
    throw new Error('The "users" table does not exist. Run "npm run db:migrate" first.')
  }

  const [columns] = await pool.execute(
    `SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'is_active' LIMIT 1`,
    [process.env.DB_NAME]
  )
  if (columns.length === 0) {
    throw new Error('Column users.is_active is missing. Run "npm run db:migrate" first.')
  }
}

async function main() {
  if (!pool) {
    throw new Error('Database is not configured. Fill DB_* values in .env first.')
  }

  await ensureColumns()

  const rl = readline.createInterface({ input: stdin, output: stdout })
  let values
  try {
    console.log('Create the first ACCESS CENTER administrator (never via the public form).')
    if (promote) {
      console.log('Mode: --promote (existing account will become admin).')
    }

    const fullName = await askText(rl, 'Full name: ', (value) => {
      const { fields } = validateProfile({ fullName: value, email: 'x@x.co', phone: '+212600000000', address: 'Loudaya, Marrakech' })
      return fields.fullName ? { fullName: fields.fullName } : {}
    })

    const email = await askText(rl, 'Email: ', (value) => {
      if (!isValidEmail(value)) return { email: 'EMAIL_INVALID' }
      return {}
    })

    const phone = await askText(rl, 'Phone: ', (value) => {
      const { fields } = validateProfile({ fullName, email, phone: value, address: 'Loudaya, Marrakech' })
      return fields.phone ? { phone: fields.phone } : {}
    })

    const address = await askText(rl, 'Address: ', (value) => {
      const { fields } = validateProfile({ fullName, email, phone, address: value })
      return fields.address ? { address: fields.address } : {}
    })

    values = { fullName, email: normalizeEmail(email), phone, address }
  } finally {
    closeReadline(rl)
  }

  const password = await askPassword()
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)

  const [existingRows] = await pool.execute(
    'SELECT id, role, email FROM users WHERE email = ? LIMIT 1',
    [values.email]
  )

  if (existingRows.length > 0) {
    const existing = existingRows[0]
    if (!promote) {
      console.error(
        `An account already exists for ${values.email} (role: ${existing.role}).\n` +
          'Re-run with --promote to turn that account into an administrator and reset its password:\n' +
          '  npm run create-admin -- --promote'
      )
      process.exitCode = 1
      return
    }

    await pool.execute(
      `UPDATE users
          SET full_name = ?, phone = ?, address = ?, password_hash = ?,
              role = 'admin', email_verified = 1, is_active = 1
        WHERE id = ?`,
      [values.fullName, values.phone, values.address, passwordHash, existing.id]
    )
    console.log(`Existing account promoted to administrator: ${values.email}`)
    return
  }

  await pool.execute(
    `INSERT INTO users
       (full_name, phone, address, email, password_hash, role, email_verified, is_active)
     VALUES (?, ?, ?, ?, ?, 'admin', 1, 1)`,
    [values.fullName, values.phone, values.address, values.email, passwordHash]
  )

  console.log(`Administrator created: ${values.email}`)
}

main()
  .catch((error) => {
    console.error('create-admin failed:', error.message)
    process.exitCode = 1
  })
  .finally(async () => {
    if (pool) await pool.end().catch(() => {})
  })
