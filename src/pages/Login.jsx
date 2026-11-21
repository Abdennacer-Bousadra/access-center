import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  AlertCircle,
  BadgeCheck,
  CheckCircle2,
  Eye,
  EyeOff,
  Facebook,
  Home,
  Instagram,
  KeyRound,
  Lock,
  LogIn,
  LogOut,
  Mail,
  MailCheck,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  User,
  X,
} from 'lucide-react'
import Logo from '../components/Logo'
import { useAuth } from '../context/AuthContext'
import { site } from '../data/content'
import { useLanguage } from '../i18n/LanguageContext'
import { errorMessage, fieldErrorMessage, translatedFieldErrors } from '../lib/authErrors'
import { validateRegistration } from '../lib/validation'
import { waLink } from '../utils/whatsapp'

const AFTER_AUTH_KEY = 'ac-after-auth'

/**
 * Only allow same-site paths as a post-login destination (no open redirects).
 */
function safeNextPath(value) {
  if (!value || typeof value !== 'string') return null
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return null
  if (value === '/login' || value.startsWith('/login?') || value.startsWith('/login/')) return null
  return value
}

function readAfterAuth() {
  try {
    return safeNextPath(sessionStorage.getItem(AFTER_AUTH_KEY))
  } catch {
    return null
  }
}

function clearAfterAuth() {
  try {
    sessionStorage.removeItem(AFTER_AUTH_KEY)
  } catch {
    /* ignore storage errors (private mode) */
  }
}

export default function Login() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [tab, setTab] = useState('login')
  const [notice, setNotice] = useState(null)
  const [searchParams] = useSearchParams()
  const nextParam = safeNextPath(searchParams.get('next'))

  // Keep the destination across the register → verify-email → login flow.
  useEffect(() => {
    if (!nextParam) return
    try {
      sessionStorage.setItem(AFTER_AUTH_KEY, nextParam)
    } catch {
      /* ignore storage errors (private mode) */
    }
  }, [nextParam])

  const tabs = [
    { key: 'login', label: t('login.tabLogin') },
    { key: 'register', label: t('login.tabRegister') },
  ]

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-accent-50 via-white to-slate-50">
      {/* Decorative glows */}
            <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-accent-400/15 blur-3xl" />
            <div className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-accent-400/10 blur-3xl" />

      <div className="container-x flex min-h-[calc(100vh-5rem)] items-center justify-center py-16">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200/60 lg:grid-cols-2">
          {/* ------------------------ Brand panel ------------------------ */}
          <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-navy-950 via-navy-900 to-navy-700 p-10 lg:flex">
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-accent-300/25 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-accent-400/10 blur-3xl" />

            <Logo />

            <div className="relative">
              <h2 className="text-3xl font-extrabold leading-tight text-white">
                {t('login.pageTitle')}
              </h2>
              <ul className="mt-8 space-y-3.5">
                {t('login.perks').map((perk) => (
                  <li key={perk} className="flex items-center gap-3 text-sm text-slate-300">
                    <BadgeCheck size={20} className="shrink-0 text-accent-300" />
                    {perk}
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative flex items-center gap-3">
              <a
                href={site.socials.instagram}
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 text-slate-300 ring-1 ring-white/10 transition-colors hover:bg-accent-600 hover:text-white"
              >
                <Instagram size={18} />
              </a>
              <a
                href={site.socials.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 text-slate-300 ring-1 ring-white/10 transition-colors hover:bg-accent-600 hover:text-white"
              >
                <Facebook size={18} />
              </a>
              <a
                href={waLink(t('whatsapp.general'))}
                target="_blank"
                rel="noreferrer"
                aria-label="WhatsApp"
                className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 text-slate-300 ring-1 ring-white/10 transition-colors hover:bg-green-500 hover:text-white"
              >
                <MessageCircle size={18} />
              </a>
            </div>
          </div>

          {/* ------------------------- Form panel ------------------------- */}
          <div className="p-7 md:p-12">
            <div className="lg:hidden">
<Logo chip />
            </div>

            {user ? (
              <AccountPanel notice={notice} next={nextParam} />
            ) : (
              <>
                {/* Tabs */}
                <div className="mt-2 grid grid-cols-2 rounded-xl bg-slate-100 p-1 lg:mt-0">
                  {tabs.map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setTab(key)}
                      className={`rounded-lg px-4 py-2.5 text-sm font-bold transition-all duration-200 ${
                        tab === key
                          ? 'bg-navy-900 text-white shadow-lg shadow-navy-900/25'
                          : 'text-slate-600 hover:text-navy-900'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {tab === 'login' ? (
                  <LoginForm onNotice={() => setNotice(t('login.loginSuccess'))} />
                ) : (
                  <RegisterForm onSwitchToLogin={() => setTab('login')} />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------ Login form ------------------------------ */
function LoginForm({ onNotice }) {
  const { t } = useLanguage()
  const { signIn, resendVerification } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState(null)
  const [forgotOpen, setForgotOpen] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendStatus, setResendStatus] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus(null)
    setResendStatus(null)
    setBusy(true)
    try {
      await signIn(email.trim(), password)
      onNotice?.()
    } catch (error) {
      setStatus({
        type: 'error',
        message: errorMessage(error, t),
        canResend: error?.code === 'EMAIL_NOT_VERIFIED',
      })
    } finally {
      setBusy(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    setResendStatus(null)
    try {
      await resendVerification(email.trim())
      setResendStatus({ type: 'success', message: t('login.resendVerificationSent') })
    } catch (error) {
      setResendStatus({ type: 'error', message: errorMessage(error, t) })
    } finally {
      setResending(false)
    }
  }

  return (
    <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
      <div>
        <label htmlFor="login-email" className="input-label">
          {t('login.email')}
        </label>
        <div className="relative">
          <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 rtl:left-auto rtl:right-4" />
          <input
            id="login-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('login.emailPlaceholder')}
            className="input-field pl-11 rtl:pl-4 rtl:pr-11"
          />
        </div>
      </div>

      <div>
        <label htmlFor="login-password" className="input-label">
          {t('login.password')}
        </label>
        <div className="relative">
          <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 rtl:left-auto rtl:right-4" />
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="input-field pl-11 pr-12 rtl:pl-12 rtl:pr-11"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-navy-900 rtl:left-3.5 rtl:right-auto"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <div className="text-sm text-end">
        <button
          type="button"
          onClick={() => setForgotOpen(true)}
          className="font-semibold text-accent-600 transition-colors hover:text-accent-700"
        >
          {t('login.forgot')}
        </button>
      </div>

      <button
        type="submit"
        disabled={busy}
        className="btn-primary w-full disabled:cursor-wait disabled:opacity-60"
      >
        {t('login.loginBtn')}
      </button>

      <StatusBox status={status} />

      {status?.canResend && (
        <button
          type="button"
          onClick={handleResend}
          disabled={resending || !email.trim()}
          className="btn-outline w-full disabled:cursor-wait disabled:opacity-60"
        >
          <Send size={17} />
          {t('login.resendVerification')}
        </button>
      )}

      <StatusBox status={resendStatus} />

      <ForgotPasswordModal open={forgotOpen} onClose={() => setForgotOpen(false)} />
    </form>
  )
}

/* ------------------------ Forgot password modal ------------------------- */
function ForgotPasswordModal({ open, onClose }) {
  const { t } = useLanguage()
  const { requestPasswordReset } = useAuth()
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState(null)

  // Reset the form and lock body scroll while the modal is open
  useEffect(() => {
    if (!open) return undefined
    setEmail('')
    setBusy(false)
    setStatus(null)
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus(null)
    setBusy(true)
    try {
      await requestPasswordReset(email.trim())
      setStatus({ type: 'success', message: t('login.forgotSent') })
    } catch (error) {
      setStatus({ type: 'error', message: errorMessage(error, t) })
    } finally {
      setBusy(false)
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Click-away backdrop */}
      <button
        type="button"
        aria-label={t('login.forgotCancel')}
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-navy-950/70 backdrop-blur-sm"
      />
      <div className="animate-fade-up relative w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200 sm:p-7">
        <header className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent-600/10 text-accent-600">
              <KeyRound size={20} />
            </span>
            <h3 className="text-lg font-extrabold text-navy-900">{t('login.forgotPromptTitle')}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('login.forgotCancel')}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-400 transition-colors hover:bg-slate-50 hover:text-navy-900"
          >
            <X size={18} />
          </button>
        </header>

        <p className="mt-4 text-sm leading-relaxed text-slate-600">{t('login.forgotPromptDesc')}</p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="forgot-email" className="input-label">
              {t('login.email')}
            </label>
            <div className="relative">
              <Mail
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 rtl:left-auto rtl:right-4"
              />
              <input
                id="forgot-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('login.emailPlaceholder')}
                className="input-field pl-11 rtl:pl-4 rtl:pr-11"
              />
            </div>
          </div>

          <StatusBox status={status} />

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-outline flex-1">
              {t('login.forgotCancel')}
            </button>
            <button
              type="submit"
              disabled={busy}
              className="btn-primary flex-1 disabled:cursor-wait disabled:opacity-60"
            >
              <Send size={17} />
              {t('login.forgotSend')}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

/* ---------------------------- Register form ----------------------------- */
const EMPTY_REGISTRATION = {
  fullName: '',
  email: '',
  phone: '',
  address: '',
  password: '',
  confirmPassword: '',
}

function RegisterForm({ onSwitchToLogin }) {
  const { t } = useLanguage()
  const { register, resendVerification } = useAuth()
  const [values, setValues] = useState(EMPTY_REGISTRATION)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState(null)
  const [registeredEmail, setRegisteredEmail] = useState('')
  const [resending, setResending] = useState(false)
  const [resendStatus, setResendStatus] = useState(null)

  const updateField = (name, value) => {
    const next = { ...values, [name]: value }
    setValues(next)

    // Keep validation live once a field has been visited (or the form submitted).
    if (!touched[name] && Object.keys(errors).length === 0) return

    const nextErrors = translateFieldCodes(validateRegistration(next), t)
    setErrors((current) => {
      const result = { ...current }
      if (nextErrors[name]) result[name] = nextErrors[name]
      else delete result[name]

      // The confirmation field depends on the password value.
      if (name === 'password' && touched.confirmPassword) {
        if (nextErrors.confirmPassword) result.confirmPassword = nextErrors.confirmPassword
        else delete result.confirmPassword
      }
      return result
    })
  }

  const handleBlur = (name) => {
    setTouched((current) => ({ ...current, [name]: true }))
    const nextErrors = translateFieldCodes(validateRegistration(values), t)
    setErrors((current) => {
      const result = { ...current }
      if (nextErrors[name]) result[name] = nextErrors[name]
      else delete result[name]
      return result
    })
  }

  const fieldError = (name) => (touched[name] ? errors[name] : undefined)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus(null)

    const nextErrors = translateFieldCodes(validateRegistration(values), t)
    setErrors(nextErrors)
    setTouched({
      fullName: true,
      email: true,
      phone: true,
      address: true,
      password: true,
      confirmPassword: true,
    })

    if (Object.keys(nextErrors).length > 0) return

    setBusy(true)
    try {
      const data = await register({
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        address: values.address.trim(),
        password: values.password,
        confirmPassword: values.confirmPassword,
      })
      setRegisteredEmail(data?.email ?? values.email.trim())
      setValues(EMPTY_REGISTRATION)
      setTouched({})
      setErrors({})
    } catch (error) {
      const fieldErrors = translatedFieldErrors(error, t)
      if (error?.code === 'EMAIL_TAKEN') {
        fieldErrors.email = errorMessage(error, t)
      }
      setErrors((current) => ({ ...current, ...fieldErrors }))
      if (Object.keys(fieldErrors).length > 0) {
        setTouched((current) => ({
          ...current,
          ...Object.fromEntries(Object.keys(fieldErrors).map((key) => [key, true])),
        }))
      } else {
        setStatus({ type: 'error', message: errorMessage(error, t) })
      }
    } finally {
      setBusy(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    setResendStatus(null)
    try {
      await resendVerification(registeredEmail)
      setResendStatus({ type: 'success', message: t('login.resendVerificationSent') })
    } catch (error) {
      setResendStatus({ type: 'error', message: errorMessage(error, t) })
    } finally {
      setResending(false)
    }
  }

  if (registeredEmail) {
    return (
      <div className="mt-7 space-y-5">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-green-600/10 text-green-600">
            <MailCheck size={22} />
          </span>
          <div>
            <h3 className="text-lg font-extrabold text-navy-900">{t('login.checkInboxTitle')}</h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              {t('login.checkInboxDesc', { email: registeredEmail })}
            </p>
          </div>
        </div>

        <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-600">
          {t('login.checkInboxHint')}
        </p>

        <StatusBox status={resendStatus} />

        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="btn-primary w-full disabled:cursor-wait disabled:opacity-60"
        >
          <Send size={17} />
          {t('login.resendVerification')}
        </button>

        <button type="button" onClick={onSwitchToLogin} className="btn-outline w-full">
          <LogIn size={17} />
          {t('login.backToLogin')}
        </button>
      </div>
    )
  }

  return (
    <form className="mt-7 space-y-5" onSubmit={handleSubmit} noValidate>
      <div>
        <label htmlFor="register-name" className="input-label">
          {t('login.fullName')}
        </label>
        <div className="relative">
          <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 rtl:left-auto rtl:right-4" />
          <input
            id="register-name"
            type="text"
            required
            autoComplete="name"
            value={values.fullName}
            onChange={(e) => updateField('fullName', e.target.value)}
            onBlur={() => handleBlur('fullName')}
            placeholder={t('login.fullName')}
            maxLength={100}
            aria-invalid={Boolean(fieldError('fullName'))}
            className={`input-field pl-11 rtl:pl-4 rtl:pr-11 ${
              fieldError('fullName') ? 'border-red-300 focus:border-red-400' : ''
            }`}
          />
        </div>
        <FieldError message={fieldError('fullName')} />
      </div>

      <div>
        <label htmlFor="register-email" className="input-label">
          {t('login.email')}
        </label>
        <div className="relative">
          <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 rtl:left-auto rtl:right-4" />
          <input
            id="register-email"
            type="email"
            required
            autoComplete="email"
            value={values.email}
            onChange={(e) => updateField('email', e.target.value)}
            onBlur={() => handleBlur('email')}
            placeholder={t('login.emailPlaceholder')}
            aria-invalid={Boolean(fieldError('email'))}
            className={`input-field pl-11 rtl:pl-4 rtl:pr-11 ${
              fieldError('email') ? 'border-red-300 focus:border-red-400' : ''
            }`}
          />
        </div>
        <FieldError message={fieldError('email')} />
      </div>

      <div>
        <label htmlFor="register-phone" className="input-label">
          {t('login.phone')}
        </label>
        <div className="relative">
          <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 rtl:left-auto rtl:right-4" />
          <input
            id="register-phone"
            type="tel"
            dir="ltr"
            inputMode="tel"
            required
            autoComplete="tel"
            value={values.phone}
            onChange={(e) => updateField('phone', e.target.value)}
            onBlur={() => handleBlur('phone')}
            placeholder={t('login.phonePlaceholder')}
            maxLength={30}
            aria-invalid={Boolean(fieldError('phone'))}
            className={`input-field pl-11 rtl:pl-4 rtl:pr-11 ${
              fieldError('phone') ? 'border-red-300 focus:border-red-400' : ''
            }`}
          />
        </div>
        <FieldError message={fieldError('phone')} />
      </div>

      <div>
        <label htmlFor="register-address" className="input-label">
          {t('login.address')}
        </label>
        <div className="relative">
          <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 rtl:left-auto rtl:right-4" />
          <input
            id="register-address"
            type="text"
            required
            autoComplete="street-address"
            value={values.address}
            onChange={(e) => updateField('address', e.target.value)}
            onBlur={() => handleBlur('address')}
            placeholder={t('login.addressPlaceholder')}
            maxLength={255}
            aria-invalid={Boolean(fieldError('address'))}
            className={`input-field pl-11 rtl:pl-4 rtl:pr-11 ${
              fieldError('address') ? 'border-red-300 focus:border-red-400' : ''
            }`}
          />
        </div>
        <FieldError message={fieldError('address')} />
      </div>

      <div>
        <label htmlFor="register-password" className="input-label">
          {t('login.password')}
        </label>
        <div className="relative">
          <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 rtl:left-auto rtl:right-4" />
          <input
            id="register-password"
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete="new-password"
            minLength={8}
            value={values.password}
            onChange={(e) => updateField('password', e.target.value)}
            onBlur={() => handleBlur('password')}
            placeholder={t('login.passwordMin')}
            aria-invalid={Boolean(fieldError('password'))}
            className={`input-field pl-11 pr-12 rtl:pl-12 rtl:pr-11 ${
              fieldError('password') ? 'border-red-300 focus:border-red-400' : ''
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-navy-900 rtl:left-3.5 rtl:right-auto"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <FieldError message={fieldError('password')} />
        <p className="mt-1.5 text-xs text-slate-500">{t('login.passwordRules')}</p>
      </div>

      <div>
        <label htmlFor="register-confirm-password" className="input-label">
          {t('login.confirmPassword')}
        </label>
        <div className="relative">
          <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 rtl:left-auto rtl:right-4" />
          <input
            id="register-confirm-password"
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete="new-password"
            value={values.confirmPassword}
            onChange={(e) => updateField('confirmPassword', e.target.value)}
            onBlur={() => handleBlur('confirmPassword')}
            placeholder={t('login.confirmPassword')}
            aria-invalid={Boolean(fieldError('confirmPassword'))}
            className={`input-field pl-11 pr-12 rtl:pl-12 rtl:pr-11 ${
              fieldError('confirmPassword') ? 'border-red-300 focus:border-red-400' : ''
            }`}
          />
        </div>
        <FieldError message={fieldError('confirmPassword')} />
      </div>

      <button
        type="submit"
        disabled={busy}
        className="btn-primary w-full disabled:cursor-wait disabled:opacity-60"
      >
        {t('login.registerBtn')}
      </button>

      <StatusBox status={status} />
    </form>
  )
}

/* -------------------------- Signed-in account panel ----------------------- */
function AccountPanel({ notice, next }) {
  const { t } = useLanguage()
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const afterAuth = next ?? readAfterAuth() ?? '/'
  const hasDestination = afterAuth !== '/'

  // Auto-redirect shortly after a successful login. When the visitor came from
  // a locked course, return there instead of the homepage.
  useEffect(() => {
    if (!notice) return
    const id = setTimeout(() => {
      clearAfterAuth()
      navigate(afterAuth)
    }, 2500)
    return () => clearTimeout(id)
  }, [notice, navigate, afterAuth])

  const continueToDestination = () => {
    clearAfterAuth()
    navigate(afterAuth)
  }

  return (
    <div className="mt-7 space-y-4">
      {notice && (
        <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
          <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-green-600" />
          <p className="text-sm font-semibold text-green-700">{notice}</p>
        </div>
      )}

      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <User size={18} className="shrink-0 text-slate-500" />
        <p className="text-sm text-slate-700">{t('login.signedInAs', { email: user.email })}</p>
      </div>

      <button
        type="button"
        onClick={continueToDestination}
        className="btn-primary w-full"
      >
        <Home size={17} />
        {hasDestination ? t('login.continue') : t('login.goHome')}
      </button>

      <button type="button" onClick={signOut} className="btn-dark w-full">
        <LogOut size={17} />
        {t('login.signOut')}
      </button>
    </div>
  )
}

/* ------------------------------- Shared UI -------------------------------- */
function translateFieldCodes(codes, t) {
  const result = {}
  for (const [field, code] of Object.entries(codes)) {
    result[field] = fieldErrorMessage(code, t)
  }
  return result
}

function FieldError({ message }) {
  if (!message) return null
  return <p className="mt-1.5 text-xs font-semibold text-red-600">{message}</p>
}

function StatusBox({ status }) {
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
