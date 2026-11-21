const FIELD_ERROR_KEYS = {
  FULL_NAME_REQUIRED: 'login.errors.fullNameRequired',
  FULL_NAME_INVALID: 'login.errors.fullNameInvalid',
  PHONE_REQUIRED: 'login.errors.phoneRequired',
  PHONE_INVALID: 'login.errors.phoneInvalid',
  ADDRESS_REQUIRED: 'login.errors.addressRequired',
  ADDRESS_INVALID: 'login.errors.addressInvalid',
  EMAIL_REQUIRED: 'login.errors.emailRequired',
  EMAIL_INVALID: 'login.errors.emailInvalid',
  PASSWORD_REQUIRED: 'login.errors.passwordRequired',
  PASSWORD_WEAK: 'login.errors.weakPassword',
  PASSWORD_INVALID: 'login.errors.weakPassword',
  PASSWORD_CONFIRM_REQUIRED: 'login.errors.passwordConfirmRequired',
  PASSWORD_MISMATCH: 'login.errors.passwordMismatch',
  TOKEN_REQUIRED: 'login.errors.invalidLink',
  TOKEN_INVALID: 'login.errors.invalidLink',
}

const ERROR_KEYS = {
  NETWORK_ERROR: 'login.errors.network',
  EMAIL_TAKEN: 'login.errors.emailExists',
  INVALID_CREDENTIALS: 'login.errors.invalidCredentials',
  EMAIL_NOT_VERIFIED: 'login.errors.emailNotConfirmed',
  ACCOUNT_DISABLED: 'login.errors.accountDisabled',
  RATE_LIMITED: 'login.errors.rateLimit',
  TOKEN_INVALID: 'login.errors.invalidLink',
}

export function fieldErrorMessage(code, t) {
  return t(FIELD_ERROR_KEYS[code] || 'login.errors.generic')
}

/** Converts the `fields` object returned by the API into translated messages. */
export function translatedFieldErrors(error, t) {
  const fields = error?.fields
  if (!fields || typeof fields !== 'object') return {}

  const result = {}
  for (const [field, code] of Object.entries(fields)) {
    result[field] = fieldErrorMessage(code, t)
  }
  return result
}

export function errorMessage(error, t) {
  if (!error) return t('login.errors.generic')
  const key = ERROR_KEYS[error.code]
  return key ? t(key) : t('login.errors.generic')
}
