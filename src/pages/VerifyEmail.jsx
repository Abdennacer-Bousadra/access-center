import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  LogIn,
  Mail,
  MailCheck,
  Send,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../i18n/LanguageContext'
import { errorMessage, fieldErrorMessage } from '../lib/authErrors'
import { validateEmail } from '../lib/validation'

export default function VerifyEmail() {
  const { t } = useLanguage()
  const { verifyEmail } = useAuth()
  const [searchParams] = useSearchParams()
  const token = (searchParams.get('token') || '').trim()
  const [state, setState] = useState(token ? 'checking' : 'missing')
  const attempted = useRef(false)

  useEffect(() => {
    if (!token) {
      setState('missing')
      return
    }
    if (attempted.current) return

    attempted.current = true
    verifyEmail(token)
      .then(() => setState('success'))
      .catch(() => setState('invalid'))
  }, [token, verifyEmail])

  const isSuccess = state === 'success'

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-accent-50 via-white to-slate-50">
      <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-accent-400/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-accent-400/10 blur-3xl" />

      <div className="container-x flex min-h-[calc(100vh-5rem)] items-center justify-center py-16">
        <div className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200/60">
          <div className="border-b border-slate-100 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-700 px-7 py-8 text-white md:px-10">
            <div className="flex items-center gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-accent-300 ring-1 ring-white/15">
                <MailCheck size={24} />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-300">
                  ACCESS CENTER
                </p>
                <h1 className="mt-1 text-2xl font-extrabold">{t('login.verifyEmailTitle')}</h1>
              </div>
            </div>
          </div>

          <div className="p-7 md:p-10">
            {state === 'checking' && (
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm font-semibold text-slate-600">
                <Loader2 size={20} className="shrink-0 animate-spin text-accent-600" />
                {t('login.verifyChecking')}
              </div>
            )}

            {isSuccess && (
              <div className="space-y-5">
                <div className="flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-5">
                  <CheckCircle2 size={22} className="mt-0.5 shrink-0 text-green-600" />
                  <div>
                    <h2 className="font-bold text-green-900">{t('login.verifySuccessTitle')}</h2>
                    <p className="mt-1 text-sm leading-relaxed text-green-800">
                      {t('login.verifySuccessDesc')}
                    </p>
                  </div>
                </div>

                <Link to="/login" className="btn-primary w-full">
                  <LogIn size={17} />
                  {t('login.backToLogin')}
                </Link>
              </div>
            )}

            {(state === 'invalid' || state === 'missing') && (
              <div className="space-y-5">
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={20} className="mt-0.5 shrink-0 text-amber-600" />
                    <div>
                      <h2 className="font-bold text-amber-900">
                        {t('login.verifyInvalidTitle')}
                      </h2>
                      <p className="mt-1 text-sm leading-relaxed text-amber-800">
                        {state === 'missing'
                          ? t('login.verifyMissingToken')
                          : t('login.verifyInvalidDesc')}
                      </p>
                    </div>
                  </div>
                </div>

                <ResendVerificationForm />

                <Link to="/login" className="btn-outline w-full">
                  <LogIn size={17} />
                  {t('login.backToLogin')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function ResendVerificationForm() {
  const { t } = useLanguage()
  const { resendVerification } = useAuth()
  const [email, setEmail] = useState('')
  const [fieldError, setFieldError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState(null)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setStatus(null)

    const fields = validateEmail(email)
    if (fields.email) {
      setFieldError(fieldErrorMessage(fields.email, t))
      return
    }

    setFieldError(null)
    setBusy(true)
    try {
      await resendVerification(email.trim())
      setStatus({ type: 'success', message: t('login.resendVerificationSent') })
    } catch (error) {
      setStatus({ type: 'error', message: errorMessage(error, t) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      <div>
        <label htmlFor="resend-email" className="input-label">
          {t('login.resendVerificationTitle')}
        </label>
        <div className="relative">
          <Mail
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 rtl:left-auto rtl:right-4"
          />
          <input
            id="resend-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              if (fieldError) setFieldError(null)
            }}
            placeholder={t('login.emailPlaceholder')}
            aria-invalid={Boolean(fieldError)}
            className={`input-field pl-11 rtl:pl-4 rtl:pr-11 ${
              fieldError ? 'border-red-300 focus:border-red-400' : ''
            }`}
          />
        </div>
        {fieldError && <p className="mt-1.5 text-xs font-semibold text-red-600">{fieldError}</p>}
      </div>

      {status && (
        <div
          role="status"
          aria-live="polite"
          className={`flex items-start gap-3 rounded-xl border p-4 ${
            status.type === 'error'
              ? 'border-red-200 bg-red-50'
              : 'border-green-200 bg-green-50'
          }`}
        >
          {status.type === 'error' ? (
            <AlertCircle size={20} className="mt-0.5 shrink-0 text-red-600" />
          ) : (
            <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-green-600" />
          )}
          <p
            className={`text-sm font-semibold ${
              status.type === 'error' ? 'text-red-700' : 'text-green-700'
            }`}
          >
            {status.message}
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={busy}
        className="btn-primary w-full disabled:cursor-wait disabled:opacity-60"
      >
        <Send size={17} />
        {t('login.resendVerification')}
      </button>
    </form>
  )
}
