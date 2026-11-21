/**
 * Client-side mirror of the server validation rules.
 * The server remains the source of truth; this only gives instant feedback.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export const PASSWORD_MIN_LENGTH = 8

export function isValidEmail(value) {
  const email = typeof value === 'string' ? value.trim() : ''
  return email.length <= 191 && EMAIL_RE.test(email)
}

export function isStrongPassword(value) {
  if (typeof value !== 'string') return false
  const bytes = typeof TextEncoder === 'undefined' ? value.length : new TextEncoder().encode(value).length
  return (
    value.length >= 8 &&
    value.length <= 72 &&
    bytes <= 72 &&
    /[a-z]/.test(value) &&
    /[A-Z]/.test(value) &&
    /\d/.test(value) &&
    /[^A-Za-z0-9]/.test(value)
  )
}

export function validateRegistration(values) {
  const fields = {}

  const fullName = String(values.fullName ?? '').trim()
  if (!fullName) fields.fullName = 'FULL_NAME_REQUIRED'
  else if (fullName.length < 2 || fullName.length > 100 || !/\p{L}/u.test(fullName)) {
    fields.fullName = 'FULL_NAME_INVALID'
  }

  const phone = String(values.phone ?? '').trim()
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

  const address = String(values.address ?? '').trim()
  if (!address) fields.address = 'ADDRESS_REQUIRED'
  else if (address.length < 5 || address.length > 255) fields.address = 'ADDRESS_INVALID'

  const email = String(values.email ?? '').trim()
  if (!email) fields.email = 'EMAIL_REQUIRED'
  else if (!isValidEmail(email)) fields.email = 'EMAIL_INVALID'

  if (!values.password) fields.password = 'PASSWORD_REQUIRED'
  else if (!isStrongPassword(values.password)) fields.password = 'PASSWORD_WEAK'

  if (!values.confirmPassword) fields.confirmPassword = 'PASSWORD_CONFIRM_REQUIRED'
  else if (values.password !== values.confirmPassword) {
    fields.confirmPassword = 'PASSWORD_MISMATCH'
  }

  return fields
}

export function validatePasswordReset(values) {
  const fields = {}

  if (!values.password) fields.password = 'PASSWORD_REQUIRED'
  else if (!isStrongPassword(values.password)) fields.password = 'PASSWORD_WEAK'

  if (!values.confirmPassword) fields.confirmPassword = 'PASSWORD_CONFIRM_REQUIRED'
  else if (values.password !== values.confirmPassword) {
    fields.confirmPassword = 'PASSWORD_MISMATCH'
  }

  return fields
}

export function validateEmail(value) {
  const email = String(value ?? '').trim()
  if (!email) return { email: 'EMAIL_REQUIRED' }
  if (!isValidEmail(email)) return { email: 'EMAIL_INVALID' }
  return {}
}
