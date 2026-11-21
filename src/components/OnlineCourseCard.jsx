import { Link } from 'react-router-dom'
import { ArrowRight, Clock, Eye, Lock, LogIn, MessageCircle, PlayCircle } from 'lucide-react'
import AppIcon from './AppIcon'
import { useLanguage } from '../i18n/LanguageContext'
import { waLink } from '../utils/whatsapp'

/**
 * Locked card for the online-courses catalogue. The whole card is the action:
 * - enrolled → open the full course
 * - locked → open the public preview first
 * - no database id (fallback data) → previous login / WhatsApp fallback
 */
export default function OnlineCourseCard({ course, user, enrolled, busy }) {
  const { t } = useLanguage()

  const months = course.durationMonths
    ? `${course.durationMonths} ${t(
        course.durationMonths === 1 ? 'common.month' : 'common.months'
      )}`
    : null

  const whatsappHref = waLink(
    t('whatsapp.enrollOnline', {
      course: course.title,
      name: user?.fullName ?? '',
      email: user?.email ?? '',
    })
  )

  const cta = busy
    ? { label: t('onlineCoursesPage.loading'), icon: Clock }
    : enrolled && course.databaseId
      ? { label: t('onlineCoursesPage.openCta'), icon: PlayCircle }
      : course.databaseId
        ? { label: t('onlineCoursesPage.previewCta'), icon: Eye }
        : !user
          ? { label: t('onlineCoursesPage.signInCta'), icon: LogIn }
          : { label: t('onlineCoursesPage.enrollCta'), icon: MessageCircle }

  const CtaIcon = cta.icon

  const content = (
    <>
      <img
        src={course.image}
        alt={course.title}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/25" />
      <span className="pointer-events-none absolute inset-x-0 top-0 z-20 h-1 scale-x-0 bg-[#dc2626] transition-transform duration-300 group-hover:scale-x-100" />

      <div className="relative z-10 flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/25 bg-white/15 text-white shadow-lg shadow-black/20 backdrop-blur-xl transition-transform duration-300 group-hover:scale-110">
            <AppIcon name={course.icon} size={22} />
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-[#dc2626]/90 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-lg shadow-[#dc2626]/40 backdrop-blur-md">
            <Lock size={12} />
            {t('onlineCoursesPage.locked')}
          </span>
        </div>

        <h3 className="mt-5 text-lg font-bold leading-snug text-white drop-shadow-md md:text-xl">
          {course.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/80 drop-shadow-sm">
          {course.description}
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

          {months && (
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-3 py-1.5">
              <Clock size={14} className="text-[#dc2626]" />
              <span className="text-xs font-semibold text-white/90">
                {t('common.duration')}: {months}
              </span>
            </div>
          )}
        </div>

        <span className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-navy-900 shadow-lg shadow-black/10 transition-colors group-hover:bg-[#E20F1E] group-hover:text-white">
          <CtaIcon size={17} />
          {cta.label}
          <ArrowRight size={17} className="rtl:-scale-x-100" />
        </span>
      </div>
    </>
  )

  const className =
    'group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-900/20 bg-slate-900 text-start shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card-hover'

  if (busy) {
    return (
      <article className={className} aria-busy="true">
        {content}
      </article>
    )
  }

  if (enrolled && course.databaseId) {
    return (
      <Link to={`/online-courses/${course.databaseId}`} className={className}>
        {content}
      </Link>
    )
  }

  if (course.databaseId) {
    return (
      <Link to={`/online-courses/${course.databaseId}/preview`} className={className}>
        {content}
      </Link>
    )
  }

  if (!user) {
    return (
      <Link to="/login?next=%2Fonline-courses" className={className}>
        {content}
      </Link>
    )
  }

  return (
    <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className={className}>
      {content}
    </a>
  )
}
