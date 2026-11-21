import { Link } from 'react-router-dom'
import { useState } from 'react'
import { ArrowRight, Info, MessageCircle } from 'lucide-react'
import AppIcon from './AppIcon'
import DetailsModal from './DetailsModal'
import { useLanguage } from '../i18n/LanguageContext'
import { waLink } from '../utils/whatsapp'

/**
 * Service card used on /services and in the Home featured grid.
 * Full-bleed cover image; cleaner overlay with value-focused layout.
 * `learnMore` is optional.
 */
export default function ServiceCard({ service, learnMore = null }) {
  const { t, isRTL } = useLanguage()
  const [showDetails, setShowDetails] = useState(false)
  const title = service.title ?? t(`${service.i18nKey}.title`)
  const details = service.details ?? t(`${service.i18nKey}.details`)

  const badge = service.badge ? t(`common.badges.${service.badge}`) : null

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-900/20 bg-slate-900 shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card-hover">
      {/* Full-bleed cover background */}
      <img
        src={service.image}
        alt={title}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      {/* Readability gradient overlay — stronger top fade to keep title readable */}
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20" />

      {/* Top accent bar */}
      <span className="pointer-events-none absolute inset-x-0 top-0 z-20 h-1 scale-x-0 bg-[#dc2626] transition-transform duration-300 group-hover:scale-x-100" />

      {/* Content overlaying the image */}
      <div className="relative z-10 flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/25 bg-white/15 text-white shadow-lg shadow-black/20 backdrop-blur-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
            <AppIcon name={service.icon} size={22} />
          </span>
          {badge && (
            <span className="inline-flex items-center rounded-full border border-white/25 bg-[#dc2626]/90 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-lg shadow-[#dc2626]/40 backdrop-blur-md">
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
          {details}
        </p>

        <div className="flex-1" />

        {/* Price block — clearer "from" phrasing for services */}
        <div className="mt-5 rounded-xl border border-white/15 bg-slate-900/40 px-5 py-3 shadow-lg shadow-black/10 backdrop-blur-md">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-white/60">
              {t('common.price')}
            </span>
            {service.onRequest ? (
              <span className="text-lg font-extrabold leading-none text-white">
                {t('common.onRequest')}
              </span>
            ) : (
              <div className="text-end">
                <span className="block text-[11px] font-semibold uppercase tracking-wide text-white/60">
                  {t('common.from')}
                </span>
                <span className="text-xl font-black leading-none text-white md:text-2xl">
                  {service.price}{' '}
                  <span className="text-[#dc2626]">{t('common.dh')}</span>
                </span>
              </div>
            )}
          </div>
          {!service.onRequest && (
            <p className="mt-1.5 text-xs font-semibold text-white/70">{t('common.customQuote')}</p>
          )}
        </div>

        {learnMore && (
          <Link
            to={learnMore}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-white/90 transition-colors hover:text-[#dc2626]"
          >
            {t('common.learnMore')}
            <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-0.5 rtl:-scale-x-100" />
          </Link>
        )}

        <a
          href={waLink(t('whatsapp.quote', { service: title }))}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-whatsapp mt-4 w-full"
        >
          <MessageCircle size={17} />
          {t('common.requestQuote')}
          <ArrowRight size={18} className={isRTL ? '-scale-x-100' : ''} />
        </a>
      </div>

      <DetailsModal
        open={showDetails}
        onClose={() => setShowDetails(false)}
        tag={t(`categories.${service.category}`)}
        title={title}
        details={details}
        footer={
          <div className="flex items-center justify-between gap-3 rounded-xl border border-white/15 bg-white/10 px-5 py-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-white/60">
              {t('common.price')}
            </span>
            {service.onRequest ? (
              <span className="text-lg font-extrabold leading-none text-white">
                {t('common.onRequest')}
              </span>
            ) : (
              <span className="text-lg font-black leading-none text-white">
                {t('common.from')} {service.price}{' '}
                <span className="text-[#dc2626]">{t('common.dh')}</span>
              </span>
            )}
          </div>
        }
      />
    </article>
  )
}