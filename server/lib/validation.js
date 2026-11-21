const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

export function normalizeEmail(value) {
  return normalizeText(value).toLowerCase()
}

export function isValidEmail(email) {
  return typeof email === 'string' && email.length <= 191 && EMAIL_RE.test(email)
}

export function isStrongPassword(value) {
  return (
    typeof value === 'string' &&
    value.length >= 8 &&
    value.length <= 72 &&
    Buffer.byteLength(value, 'utf8') <= 72 &&
    /[a-z]/.test(value) &&
    /[A-Z]/.test(value) &&
    /\d/.test(value) &&
    /[^A-Za-z0-9]/.test(value)
  )
}

export function validateRegistration(body = {}) {
  const fields = {}

  const fullName = normalizeText(body.fullName)
  if (!fullName) fields.fullName = 'FULL_NAME_REQUIRED'
  else if (fullName.length < 2 || fullName.length > 100 || !/\p{L}/u.test(fullName)) {
    fields.fullName = 'FULL_NAME_INVALID'
  }

  const phone = normalizeText(body.phone)
  const phoneDigits = phone.replace(/\D/g, '')
  if (!phone) fields.phone = 'PHONE_REQUIRED'
  else if (
    phone.length > 30 ||
    !/^\+?[\d\s().-]+$/.test(phone) ||
    phoneDigits.length < 9 ||
    phoneDigits.length > 15
  ) {
    fields.phone = 'PHONE_INVALID'
  }

  const address = normalizeText(body.address)
  if (!address) fields.address = 'ADDRESS_REQUIRED'
  else if (address.length < 5 || address.length > 255) fields.address = 'ADDRESS_INVALID'

  const email = normalizeEmail(body.email)
  if (!email) fields.email = 'EMAIL_REQUIRED'
  else if (!isValidEmail(email)) fields.email = 'EMAIL_INVALID'

  const password = typeof body.password === 'string' ? body.password : ''
  if (!password) fields.password = 'PASSWORD_REQUIRED'
  else if (!isStrongPassword(password)) fields.password = 'PASSWORD_WEAK'

  const confirmPassword = typeof body.confirmPassword === 'string' ? body.confirmPassword : ''
  if (!confirmPassword) fields.confirmPassword = 'PASSWORD_CONFIRM_REQUIRED'
  else if (password !== confirmPassword) fields.confirmPassword = 'PASSWORD_MISMATCH'

  return {
    fields,
    values: { fullName, phone, address, email, password },
  }
}

export function validateLogin(body = {}) {
  const fields = {}

  const email = normalizeEmail(body.email)
  if (!email) fields.email = 'EMAIL_REQUIRED'
  else if (!isValidEmail(email)) fields.email = 'EMAIL_INVALID'

  const password = typeof body.password === 'string' ? body.password : ''
  if (!password) fields.password = 'PASSWORD_REQUIRED'
  else if (password.length > 200) fields.password = 'PASSWORD_INVALID'

  return { fields, values: { email, password } }
}

export function isValidVerificationToken(token) {
  return typeof token === 'string' && /^[a-f0-9]{64}$/.test(token)
}

export function validateResetPassword(body = {}) {
  const fields = {}

  const token = normalizeText(body.token)
  if (!token) fields.token = 'TOKEN_REQUIRED'
  else if (!isValidVerificationToken(token)) fields.token = 'TOKEN_INVALID'

  const password = typeof body.password === 'string' ? body.password : ''
  if (!password) fields.password = 'PASSWORD_REQUIRED'
  else if (!isStrongPassword(password)) fields.password = 'PASSWORD_WEAK'

  const confirmPassword = typeof body.confirmPassword === 'string' ? body.confirmPassword : ''
  if (!confirmPassword) fields.confirmPassword = 'PASSWORD_CONFIRM_REQUIRED'
  else if (password !== confirmPassword) fields.confirmPassword = 'PASSWORD_MISMATCH'

  return { fields, values: { token, password } }
}
