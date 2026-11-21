export class ApiError extends Error {
  constructor(status, code, details) {
    super(code)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    if (details) this.details = details
  }
}
