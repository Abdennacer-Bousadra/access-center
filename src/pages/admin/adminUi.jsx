import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Check, Globe, Loader2, X } from 'lucide-react'
import { LANG_NAMES } from '../../i18n/translations'
import { useLanguage } from '../../i18n/LanguageContext'

export const inputClass =
  'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/25'

export const textareaClass = `${inputClass} min-h-[96px] resize-y`

export function PageHeader({ title, description, actions }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-navy-900 sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-slate-600">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Panel({ children, className = '', padded = true }) {
  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white shadow-card ${
        padded ? 'p-5 sm:p-6' : ''
      } ${className}`}
    >
      {children}
    </section>
  )
}

const TONES = {
  green: 'bg-green-50 text-green-700 ring-green-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  navy: 'bg-navy-50 text-navy-800 ring-navy-200',
  slate: 'bg-slate-100 text-slate-600 ring-slate-200',
}

export function Badge({ tone = 'slate', children }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ${
        TONES[tone] ?? TONES.slate
      }`}
    >
      {children}
    </span>
  )
}

export function Toggle({ checked, onChange, disabled = false, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500/40 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? 'bg-green-500' : 'bg-slate-300'
      }`}
      aria-label={label}
      title={label}
    >
      <span
        className={`absolute start-0.5 top-0.5 inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-[20px] rtl:-translate-x-[20px]' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

export function Field({ label, htmlFor, hint, error, children, className = '' }) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-navy-900">
          {label}
        </label>
      )}
      {children}
      {error && <p className="mt-1.5 text-xs font-semibold text-red-600">{error}</p>}
      {hint && !error && <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{hint}</p>}
    </div>
  )
}

export function StatusBanner({ status, onClose }) {
  if (!status) return null
  const isError = status.type === 'error'
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-start gap-3 rounded-xl border p-3.5 text-sm ${
        isError ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'
      }`}
    >
      <span className="mt-0.5">{isError ? '⚠' : <Check size={17} />}</span>
      <p className="flex-1 font-semibold">{status.message}</p>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 opacity-60 transition-opacity hover:opacity-100"
          aria-label="close"
        >
          <X size={16} />
        </button>
      )}
    </div>
  )
}

export function LoadingBlock({ label }) {
  return (
    <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-12 text-sm font-semibold text-slate-500 shadow-card">
      <Loader2 size={20} className="animate-spin text-accent-600" />
      {label}
    </div>
  )
}

export function EmptyBlock({ title, description, icon: Icon }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-10 text-center">
      {Icon && <Icon size={34} className="mx-auto text-slate-300" />}
      <p className="mt-3 text-sm font-bold text-navy-900">{title}</p>
      {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
    </div>
  )
}

export function Modal({ open, onClose, title, children, footer, wide = false }) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="close"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-navy-950/70 backdrop-blur-sm"
      />
      <div
        className={`animate-fade-up relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 ${
          wide ? 'max-w-4xl' : 'max-w-xl'
        }`}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-extrabold text-navy-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-400 transition-colors hover:bg-slate-50 hover:text-navy-900"
            aria-label="close"
          >
            <X size={18} />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && (
          <footer className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3.5">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body
  )
}

export function AdminLanguageSwitcher() {
  const { locale, setLocale, LOCALES, t } = useLanguage()
  return (
    <div
      className="inline-flex items-center gap-0.5 rounded-xl border border-white/20 bg-white/10 p-0.5"
      aria-label={t('nav.language')}
    >
      <Globe size={14} className="mx-1.5 text-white/60" />
      {LOCALES.map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => setLocale(lang)}
          title={LANG_NAMES[lang]}
          className={`rounded-lg px-2 py-1.5 text-xs font-bold transition-colors ${
            locale === lang ? 'bg-white text-navy-900' : 'text-white/80 hover:bg-white/10'
          }`}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  )
}

export function adminErrorText(error, t) {
  if (!error) return ''
  const code = error.code || 'REQUEST_FAILED'
  const key = `admin.errors.${code}`
  const text = t(key)
  if (text !== key) return text
  return t('admin.errors.generic')
}

export function moveItem(list, index, direction) {
  const target = index + direction
  if (target < 0 || target >= list.length) return list
  const next = [...list]
  const [item] = next.splice(index, 1)
  next.splice(target, 0, item)
  return next
}
