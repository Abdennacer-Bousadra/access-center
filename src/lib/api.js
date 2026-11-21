/**
 * Small fetch wrapper for the Express API.
 * - Relative `/api` URLs (Vite proxies them in development).
 * - Sends the session cookie on every request.
 * - Fetches and attaches the CSRF token required by unsafe methods.
 */

export class ApiError extends Error {
  constructor(status, code, details = {}) {
    super(code)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.fields = details?.fields ?? null
  }
}

let csrfToken = null
let csrfRequest = null

async function readJson(response) {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

async function requestCsrfToken(force = false) {
  if (!force && csrfToken) return csrfToken
  if (csrfRequest) return csrfRequest

  csrfRequest = (async () => {
    let response
    try {
      response = await fetch('/api/csrf', {
        credentials: 'include',
        headers: { Accept: 'application/json' },
      })
    } catch {
      throw new ApiError(0, 'NETWORK_ERROR')
    }

    const data = await readJson(response)
    if (!response.ok || !data?.csrfToken) {
      throw new ApiError(response.status || 0, data?.error || 'CSRF_FAILED')
    }

    csrfToken = data.csrfToken
    return csrfToken
  })()

  try {
    return await csrfRequest
  } finally {
    csrfRequest = null
  }
}

async function send(path, { method, body, token }) {
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (method !== 'GET' && method !== 'HEAD') headers['X-CSRF-Token'] = token

  try {
    return await fetch(`/api${path}`, {
      method,
      credentials: 'include',
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR')
  }
}

export async function apiRequest(path, { method = 'GET', body } = {}) {
  const needsCsrf = method !== 'GET' && method !== 'HEAD'
  let token = needsCsrf ? await requestCsrfToken() : null

  let response = await send(path, { method, body, token })
  let data = await readJson(response)

  // The CSRF cookie may have expired or the server may have restarted.
  // Fetch a fresh token once, then replay the request.
  if (needsCsrf && response.status === 403 && data?.error === 'CSRF_INVALID') {
    csrfToken = null
    token = await requestCsrfToken(true)
    response = await send(path, { method, body, token })
    data = await readJson(response)
  }

  if (!response.ok) {
    throw new ApiError(response.status, data?.error || 'REQUEST_FAILED', data ?? {})
  }

  return data
}

export const api = {
  csrf: () => requestCsrfToken(true),
  me: () => apiRequest('/me'),
  enrollments: () => apiRequest('/me/enrollments'),
  onlineCourse: (courseId) => apiRequest(`/online-courses/${courseId}`),
  onlineCoursePreview: (courseId) => apiRequest(`/online-courses/${courseId}/preview`),
  lessonStreamUrl: (courseId, lessonId) =>
    `/api/online-courses/${courseId}/lessons/${lessonId}/stream`,
  lessonProgress: (courseId, lessonId, values) =>
    apiRequest(`/online-courses/${courseId}/lessons/${lessonId}/progress`, {
      method: 'POST',
      body: values,
    }),
  login: (email, password) =>
    apiRequest('/auth/login', { method: 'POST', body: { email, password } }),
  register: (values) =>
    apiRequest('/auth/register', { method: 'POST', body: values }),
  logout: () => apiRequest('/auth/logout', { method: 'POST' }),
  verifyEmail: (token) =>
    apiRequest('/auth/verify-email', { method: 'POST', body: { token } }),
  resendVerification: (email) =>
    apiRequest('/auth/resend-verification', { method: 'POST', body: { email } }),
  forgotPassword: (email) =>
    apiRequest('/auth/forgot-password', { method: 'POST', body: { email } }),
  resetPassword: (values) =>
    apiRequest('/auth/reset-password', { method: 'POST', body: values }),
}
