import { useState } from 'react'
import { ArrowRight, Clock, GraduationCap, Info } from 'lucide-react'
import AppIcon from './AppIcon'
import DetailsModal from './DetailsModal'
import { useLanguage } from '../i18n/LanguageContext'
import { courseRegistrationFee } from '../data/content'
import { waLink } from '../utils/whatsapp'

/**
 * Training program card with a WhatsApp registration CTA.
 * Focuses on learnings + price + duration + registration fee.
 */
export default function CourseCard({ course }) {
  const { t, isRTL } = useLanguage()
  const [showDetails, setShowDetails] = useState(false)
  const title = course.title ?? t(`${course.i18nKey}.title`)
  const description = course.description ?? t(`${course.i18nKey}.description`)
  const months = `${course.durationMonths} ${t(
    course.durationMonths === 1 ? 'common.month' : 'common.months'
  )}`
  const badge = course.badge ? t(`common.badges.${course.badge}`) : null

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-900/20 bg-slate-900 shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card-hover">
      <img
        src={course.image}
        alt={title}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />
      <span className="pointer-events-none absolute inset-x-0 top-0 z-20 h-1 scale-x-0 bg-[#dc2626] transition-transform duration-300 group-hover:scale-x-100" />

      <div className="relative z-10 flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl border border-white/25 bg-white/15 text-white shadow-lg shadow-black/20 backdrop-blur-xl transition-transform duration-300 group-hover:scale-110">
            <AppIcon name={course.icon} size={22} />
          </span>
          {badge && (
            <span className="inline-flex items-center rounded-full border border-white/25 bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white backdrop-blur-xl">
              {badge}
            </span>
          )}
        </div>

        <div className="mt-5 flex items-start justify-between gap-3">
          <h3 className="min-w-0 flex-1 text-lg font-bold leading-snug text-white drop-shadow-md md:text-xl">
            {title}
          </h3>
          {/* Compact details trigger — discreet, keeps the card scannable */}
          <button
            type="button"
            onClick={() => setShowDetails(true)}
            aria-label={t('common.moreDetails')}
            title={t('common.moreDetails')}
            className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur-sm transition-colors hover:bg-black/50"
          >
            <Info size={15} />
          </button>
        </div>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/80 drop-shadow-sm">
          {description}
        </p>

        <div className="flex-1" />

        <div className="mt-5 space-y-3 rounded-xl border border-white/15 bg-slate-900/40 px-5 py-3 shadow-lg shadow-black/10 backdrop-blur-md">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-white/60">
              {t('common.price')}
            </span>
            <div className="text-end">
              <span className="text-xl font-black leading-none text-white md:text-2xl">
                {course.fee}{' '}
                <span className="text-[#dc2626]">{t('common.dh')}</span>
                <span className="ms-1.5 align-middle text-xs font-semibold text-white/70">
                  {t('common.perMonth')}
                </span>
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-3 py-1.5">
              <Clock size={14} className="text-[#dc2626]" />
              <span className="text-xs font-semibold text-white/90">
                {t('common.duration')}: {months}
              </span>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/10 px-3 py-1.5 text-end sm:text-start">
              <span className="text-xs font-semibold text-white/90">
                {t('common.registrationFee')}: {courseRegistrationFee} {t('common.dh')}
              </span>
            </div>
          </div>
        </div>

        <a
          href={waLink(t('whatsapp.enroll', { course: title }))}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-whatsapp mt-4 w-full"
        >
          <GraduationCap size={18} />
          {t('coursesPage.enroll')}
          <ArrowRight size={18} className={isRTL ? '-scale-x-100' : ''} />
        </a>
      </div>

      <DetailsModal
        open={showDetails}
        onClose={() => setShowDetails(false)}
        tag={t(`categories.${course.category}`)}
        title={title}
        details={description}
        footer={
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-white/15 bg-white/10 px-5 py-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-white/60">
                {t('common.price')}
              </span>
              <span className="text-lg font-black leading-none text-white">
                {course.fee} <span className="text-[#dc2626]">{t('common.dh')}</span>
                <span className="ms-1.5 align-middle text-xs font-semibold text-white/70">
                  {t('common.perMonth')}
                </span>
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-white/60">
                  {t('common.duration')}
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-sm font-bold text-white">
                  <Clock size={13} className="text-[#dc2626]" />
                  {months}
                </p>
              </div>
              <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-white/60">
                  {t('common.registrationFee')}
                </p>
                <p className="mt-0.5 text-sm font-bold text-white">
                  {courseRegistrationFee} {t('common.dh')}
                </p>
              </div>
            </div>
          </div>
        }
      />
    </article>
  )
}