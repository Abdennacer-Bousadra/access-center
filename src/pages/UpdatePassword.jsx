import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  LogIn,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../i18n/LanguageContext'
import { errorMessage, fieldErrorMessage, translatedFieldErrors } from '../lib/authErrors'
import { validatePasswordReset } from '../lib/validation'

const REDIRECT_DELAY = 1200
const TOKEN_RE = /^[a-f0-9]{64}$/

export default function UpdatePassword() {
  const { t } = useLanguage()
  const { resetPassword } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = (searchParams.get('token') || '').trim()

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState(null)
  const [linkInvalid, setLinkInvalid] = useState(!TOKEN_RE.test(token))
  const redirectTimer = useRef(null)

  useEffect(() => {
    return () => {
      if (redirectTimer.current) window.clearTimeout(redirectTimer.current)
    }
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setStatus(null)

    const rawErrors = validatePasswordReset({ password: newPassword, confirmPassword })
    const nextErrors = {}
    for (const [field, code] of Object.entries(rawErrors)) {
      nextErrors[field] = fieldErrorMessage(code, t)
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setBusy(true)
    try {
      await resetPassword({ token, password: newPassword, confirmPassword })
      setStatus({ type: 'success', message: t('login.passwordUpdated') })
      redirectTimer.current = window.setTimeout(() => {
        navigate('/login', { replace: true })
      }, REDIRECT_DELAY)
    } catch (error) {
      if (error?.code === 'TOKEN_INVALID' || error?.fields?.token) {
        setLinkInvalid(true)
        return
      }
      const fieldErrors = translatedFieldErrors(error, t)
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors)
      } else {
        setStatus({ type: 'error', message: errorMessage(error, t) })
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-accent-50 via-white to-slate-50">
      <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-accent-400/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-accent-400/10 blur-3xl" />

      <div className="container-x flex min-h-[calc(100vh-5rem)] items-center justify-center py-16">
        <div className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200/60">
          <div className="border-b border-slate-100 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-700 px-7 py-8 text-white md:px-10">
            <div className="flex items-center gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-accent-300 ring-1 ring-white/15">
                <KeyRound size={24} />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-300">
                  ACCESS CENTER
                </p>
                <h1 className="mt-1 text-2xl font-extrabold">{t('login.newPasswordTitle')}</h1>
              </div>
            </div>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-slate-300">
              {t('login.newPasswordDesc')}
            </p>
          </div>

          <div className="p-7 md:p-10">
            {linkInvalid ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <div className="flex items-start gap-3">
                  <AlertCircle size={20} className="mt-0.5 shrink-0 text-amber-600" />
                  <div>
                    <h2 className="font-bold text-amber-900">{t('login.resetLinkInvalidTitle')}</h2>
                    <p className="mt-1 text-sm leading-relaxed text-amber-800">
                      {t('login.resetLinkInvalidDesc')}
                    </p>
                  </div>
                </div>
                <Link to="/login" className="btn-outline mt-5 w-full">
                  <LogIn size={17} />
                  {t('login.backToLogin')}
                </Link>
              </div>
            ) : (
              <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                <div>
                  <label htmlFor="new-password" className="input-label">
                    {t('login.newPassword')}
                  </label>
                  <div className="relative">
                    <Lock
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 rtl:left-auto rtl:right-4"
                    />
                    <input
                      id="new-password"
                      name="new-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      minLength={8}
                      value={newPassword}
                      onChange={(event) => {
                        setNewPassword(event.target.value)
                        if (errors.password) {
                          setErrors((current) => ({ ...current, password: undefined }))
                        }
                      }}
                      placeholder={t('login.passwordMin')}
                      aria-invalid={Boolean(errors.password)}
                      className={`input-field pl-11 pr-12 rtl:pl-12 rtl:pr-11 ${
                        errors.password ? 'border-red-300 focus:border-red-400' : ''
                      }`}
                    />
                    <PasswordVisibilityButton
                      visible={showPassword}
                      onClick={() => setShowPassword((value) => !value)}
                      label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                    />
                  </div>
                  {errors.password && (
                    <p className="mt-1.5 text-xs font-semibold text-red-600">
                      {errors.password}
                    </p>
                  )}
                  <p className="mt-1.5 text-xs text-slate-500">{t('login.passwordRules')}</p>
                </div>

                <div>
                  <label htmlFor="confirm-new-password" className="input-label">
                    {t('login.confirmNewPassword')}
                  </label>
                  <div className="relative">
                    <Lock
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 rtl:left-auto rtl:right-4"
                    />
                    <input
                      id="confirm-new-password"
                      name="confirm-new-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(event) => {
                        setConfirmPassword(event.target.value)
                        if (errors.confirmPassword) {
                          setErrors((current) => ({ ...current, confirmPassword: undefined }))
                        }
                      }}
                      placeholder={t('login.confirmNewPassword')}
                      aria-invalid={Boolean(errors.confirmPassword)}
                      className={`input-field pl-11 pr-12 rtl:pl-12 rtl:pr-11 ${
                        errors.confirmPassword ? 'border-red-300 focus:border-red-400' : ''
                      }`}
                    />
                    <PasswordVisibilityButton
                      visible={showPassword}
                      onClick={() => setShowPassword((value) => !value)}
                      label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1.5 text-xs font-semibold text-red-600">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                <StatusMessage status={status} />

                <button
                  type="submit"
                  disabled={busy}
                  className="btn-primary w-full disabled:cursor-wait disabled:opacity-60"
                >
                  <KeyRound size={17} />
                  {t('login.saveNewPassword')}
                </button>

                <Link to="/login" className="btn-outline w-full">
                  <LogIn size={17} />
                  {t('login.backToLogin')}
                </Link>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function PasswordVisibilityButton({ visible, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-navy-900 rtl:left-3.5 rtl:right-auto"
    >
      {visible ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  )
}

function StatusMessage({ status }) {
  if (!status) return null

  const isError = status.type === 'error'
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-start gap-3 rounded-xl border p-4 ${
        isError ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'
      }`}
    >
      {isError ? (
        <AlertCircle size={20} className="mt-0.5 shrink-0 text-red-600" />
      ) : (
        <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-green-600" />
      )}
      <p className={`text-sm font-semibold ${isError ? 'text-red-700' : 'text-green-700'}`}>
        {status.message}
      </p>
    </div>
  )
}
