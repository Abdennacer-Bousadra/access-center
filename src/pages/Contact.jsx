import { useState } from 'react'
import {
  AlertCircle,
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  Facebook,
  HelpCircle,
  Instagram,
  LifeBuoy,
  Phone,
  Send,
  Tag,
  User,
  Wallet,
  Youtube,
} from 'lucide-react'
import PageBanner from '../components/PageBanner'
import { site } from '../data/content'
import { useLanguage } from '../i18n/LanguageContext'
import { waLink } from '../utils/whatsapp'

const OPTIONS = [
  { key: 'freeSessions', icon: CalendarCheck },
  { key: 'fairPrice', icon: Wallet },
  { key: 'promoCode', icon: Tag },
  { key: 'freeConsultation', icon: LifeBuoy },
]

const REASONS = ['enroll', 'service', 'general', 'promo']

function OptionsGrid() {
  const { t } = useLanguage()
  return (
    <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
      {OPTIONS.map(({ key, icon: Icon }) => (
        <div
          key={key}
          className="group relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 text-center shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-accent-200 hover:shadow-card-hover"
        >
          <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-accent-400/10 blur-2xl" />
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-accent-600/10 text-accent-600 transition-colors duration-300 group-hover:bg-accent-600 group-hover:text-white">
            <Icon size={22} />
          </span>
          <p className="mt-4 text-sm font-bold text-navy-900 sm:text-base">
            {t(`contact.options.${key}`)}
          </p>
        </div>
      ))}
    </div>
  )
}

function ContactForm() {
  const { t } = useLanguage()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [reason, setReason] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    setError('')

    const trimmedName = name.trim()
    const trimmedPhone = phone.trim()
    if (!trimmedName || !trimmedPhone || !reason) {
      setError(t('contact.form.validationRequired'))
      return
    }

    // Pre-fill a clear WhatsApp message with the collected details
    const message = [
      `${t('contact.form.name')}: ${trimmedName}`,
      `${t('contact.form.phone')}: ${trimmedPhone}`,
      `${t('contact.form.reason')}: ${t(`contact.form.reasons.${reason}`)}`,
    ].join('\n')

    window.open(waLink(message), '_blank', 'noopener,noreferrer')
    setSubmitted(true)
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="rounded-3xl border border-slate-100 bg-white p-7 shadow-card sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <label htmlFor="contact-name" className="input-label">
              {t('contact.form.name')}
            </label>
            <div className="relative">
              <User size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-accent-600" />
              <input
                id="contact-name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={t('contact.form.namePlaceholder')}
                className="input-field pl-11"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="contact-phone" className="input-label">
              {t('contact.form.phone')}
            </label>
            <div className="relative">
              <Phone size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-accent-600" />
              <input
                id="contact-phone"
                type="tel"
                dir="ltr"
                inputMode="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder={t('contact.form.phonePlaceholder')}
                className="input-field pl-11 text-left"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="contact-reason" className="input-label">
              {t('contact.form.reason')}
            </label>
            <div className="relative">
              <HelpCircle
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-accent-600 rtl:left-auto rtl:right-4"
              />
              <ChevronDown
                size={18}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 rtl:left-4 rtl:right-auto"
              />
              <select
                id="contact-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                className="input-field appearance-none pl-11 pr-10 rtl:pl-10 rtl:pr-11"
                required
              >
                <option value="" disabled>
                  {t('contact.form.reasonPlaceholder')}
                </option>
                {REASONS.map((key) => (
                  <option key={key} value={key}>
                    {t(`contact.form.reasons.${key}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button type="submit" className="btn-primary w-full">
            <Send size={18} />
            {t('contact.form.submit')}
          </button>

          {error && (
            <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <AlertCircle size={20} className="mt-0.5 shrink-0 text-red-600" />
              <p>{error}</p>
            </div>
          )}
        </form>

        {submitted && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-green-600" />
            <p>{t('contact.form.success')}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function FollowSection() {
  const { t } = useLanguage()
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 py-16 md:py-20">
      <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-accent-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-accent-400/20 blur-3xl" />

      <div className="container-x relative text-center">
        <h2 className="mx-auto max-w-2xl text-2xl font-extrabold tracking-tight text-white md:text-3xl">
          {t('contact.followCta')}
        </h2>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href={site.socials.instagram}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 px-7 text-sm font-bold text-white shadow-lg shadow-rose-500/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl sm:w-auto"
          >
            <Instagram size={19} />
            @societe_access_center
          </a>
          <a
            href={site.socials.facebook}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1877F2] px-7 text-sm font-bold text-white shadow-lg shadow-[#1877F2]/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl sm:w-auto"
          >
            <Facebook size={19} />
            @societe_access_center
          </a>
          <a
            href={site.socials.youtube}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#FF0000] px-7 text-sm font-bold text-white shadow-lg shadow-[#FF0000]/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl sm:w-auto"
          >
            <Youtube size={19} />
            @AccessCenter
          </a>
        </div>
      </div>
    </section>
  )
}

export default function Contact() {
  const { t } = useLanguage()

  return (
    <>
      <PageBanner
        crumbs={[t('nav.home'), t('nav.contact')]}
        title={t('contact.heading')}
        eyebrow={site.name}
        description={t('contact.subtitle')}
      />

      <section className="bg-slate-50 py-16 md:py-20">
        <div className="container-x">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-navy-900 md:text-4xl">
              {t('contact.optionsHeading')}
            </h2>
          </div>

          <OptionsGrid />

          <div className="mt-14">
            <ContactForm />
          </div>
        </div>
      </section>

      <FollowSection />
    </>
  )
}