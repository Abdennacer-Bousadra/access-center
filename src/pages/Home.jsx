import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import {
  ArrowRight,
  Clock,
  Facebook,
  GraduationCap,
  Instagram,
  Layers,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Youtube,
} from 'lucide-react'
import heroBg from '../assets/HeroAccesscenter.png'
import SectionHeading from '../components/SectionHeading'
import ServiceCard from '../components/ServiceCard'
import CourseCard from '../components/CourseCard'
import { site } from '../data/content'
import { useCatalog } from '../context/CatalogContext'
import { useLanguage } from '../i18n/LanguageContext'
import { waLink } from '../utils/whatsapp'

/* Featured ids keep the exact same items/order as the original static data. */
const FEATURED_SERVICE_IDS = [
  'shooting',
  'logo-design',
  'graphic-design',
  'montage-video',
  'marketing',
  'site-web',
]
const FEATURED_COURSE_IDS = ['formation-3d', 'photographie', 'cuisine-patisserie']

/* "Access Center" brand wordmark — "Access" stays in brand navy (#2B2B68) and
   "Center" in brand red (#E31B23). Each word carries the .shimmer-word
   gradient (currentColor sides + a white band) clipped to the glyphs; the
   background-position animation sweeps the bright white highlight across the
   letters continuously (~2.5s loop) while the navy/red fill stays fully
   visible. Kept on one logical line (LTR, no reversal) so it never breaks in
   either direction. */
function BrandLogotype() {
  return (
    <span
      dir="ltr"
      className="relative mx-1.5 inline-block whitespace-nowrap align-baseline"
    >
      <span className="shimmer-word relative inline-block text-navy-600">Access</span>{' '}
      <span className="shimmer-word relative inline-block text-[#E31B23]">Center</span>
    </span>
  )
}

/* The brand may appear case-insensitively as "Access Center" (spaced, FR/AR) or
   "AccessCenter" (EN). Find it with a regex and splice the wordmark in between,
   preserving the exact surrounding text (spaces, punctuation, newlines) so the
   component always renders and never gets dropped in any language. */
function highlightBrand(title) {
  const matches = title.match(/Access\s?Center/i)
  if (!matches) return title
  const brand = matches[0]
  return (
    <>
      {title.slice(0, matches.index)}
      <BrandLogotype />
      {title.slice(matches.index + brand.length)}
    </>
  )
}

/* Continuously scrolling announcement bar pinned under the navigation bar.
   The scroll direction follows the active language: Arabic streams right → left,
   while English / French stream left → right. The track's own dir is flipped
   relative to the document so each language overflows toward the edge the text
   comes from — that keeps the ±50% translate loop perfectly seamless. Six
   copies keep the track covered on mobile while the extra width is clipped by
   the bar. Each span keeps dir="auto" so the message always renders in its own
   writing direction; extra copies are hidden from screen readers. */
function Ticker() {
  const { t, isRTL } = useLanguage()
  const copies = 6

  return (
    <section
      className="ticker relative overflow-hidden border-b border-white/10 bg-[#E20F1E] py-1.5"
      dir={isRTL ? 'rtl' : 'ltr'}
      aria-label={t('hero.ticker')}
    >
      <div className="ticker-track flex w-max will-change-transform" dir={isRTL ? 'ltr' : 'rtl'}>
        {Array.from({ length: copies }).map((_, i) => (
          <span
            key={i}
            dir="auto"
            aria-hidden={i > 0}
            className="shrink-0 whitespace-nowrap px-6 text-sm font-bold tracking-[0.12em] text-white"
          >
            {t('hero.ticker')}
          </span>
        ))}
      </div>
    </section>
  )
}

export default function Home() {
  const { t, isRTL } = useLanguage()
  const { services, courses } = useCatalog()

  const featuredServices = useMemo(
    () => services.filter((s) => FEATURED_SERVICE_IDS.includes(s.id)).slice(0, 3),
    [services]
  )
  const featuredCourses = useMemo(
    () => courses.filter((c) => FEATURED_COURSE_IDS.includes(c.id)).slice(0, 3),
    [courses]
  )

  return (
    <>
      {/* ------------------------- ANNOUNCEMENT STRIP ------------------------- */}
      {/* Pinned directly under the navigation bar, above the hero section */}
      <Ticker />

      {/* ------------------------------ HERO ------------------------------ */}
      {/* Direction is bound to the active locale: RTL for Arabic, LTR for
          French/English. In RTL the copy sits on the right and the image on
          the left; in LTR the layout mirrors automatically. */}
      <section
        className="relative isolate overflow-hidden bg-accent-50"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Decorative ambient glows — behind the content, never over the image */}
        <div
          className="pointer-events-none absolute -start-24 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-accent-300/30 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -end-24 bottom-0 h-80 w-80 rounded-full bg-navy-300/25 blur-3xl"
          aria-hidden="true"
        />

        {/* Two-column layout — text and image are fully separated (no overlay) */}
        <div className="container-x relative z-10">
          <div className="grid gap-10 py-16 md:py-20 lg:grid-cols-2 lg:gap-14 lg:py-24">
            {/* Copy column — first in source order: right side in RTL, left in LTR */}
            <div className="animate-fade-up flex max-w-xl flex-col justify-center text-start">
              <h1 className="whitespace-pre-line text-3xl font-extrabold leading-loose tracking-tight text-navy-900 sm:text-4xl lg:text-5xl">
                {highlightBrand(t('hero.title'))}
              </h1>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link to="/courses" className="btn-primary">
                  <GraduationCap size={18} />
                  {t('hero.ctaBrowse')}
                  <ArrowRight size={18} className="rtl:rotate-180" />
                </Link>
                <Link to="/services" className="btn-red">
                  <Layers size={18} />
                  {t('hero.ctaExplore')}
                </Link>
              </div>

              <div className="mt-8 flex items-center gap-3">
                <a
                  href={site.socials.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-navy-900 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent-600 hover:text-white"
                >
                  <Facebook size={18} />
                </a>
                <a
                  href={site.socials.instagram}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-navy-900 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent-600 hover:text-white"
                >
                  <Instagram size={18} />
                </a>
                <a
                  href={site.socials.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-navy-900 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent-600 hover:text-white"
                >
                  <Youtube size={18} />
                </a>
                <a
                  href={waLink(t('whatsapp.general'))}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="WhatsApp"
                  className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-navy-900 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-green-500 hover:text-white"
                >
                  <MessageCircle size={18} />
                </a>
              </div>
            </div>

            {/* Image column — last in source order: left side in RTL, right in LTR */}
            {/* No borders, white box frames, or drop shadows: the PNG is now a
                true transparent RGBA asset (the baked-in checkerboard grid was
                removed), so the subject composites directly onto the hero
                background through a fully transparent, frameless container. */}
            <div className="animate-fade-up h-full w-full bg-transparent min-h-[16rem] sm:min-h-[20rem]">
              <div className="relative h-full w-full bg-transparent">
                <img
                  src={heroBg}
                  alt={`${site.name} — ${site.city}`}
                  className="hero-img"
                  loading="eager"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------ FEATURED COURSES ------------------------ */}
      <section className="relative overflow-hidden bg-white py-20 md:py-24">
        <div className="pointer-events-none absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-accent-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 right-1/4 h-96 w-96 rounded-full bg-navy-400/10 blur-3xl" />
        <div className="container-x relative">
          <SectionHeading
            title={t('coursesPage.title')}
            description={t('coursesPage.description')}
          />

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredCourses.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link to="/courses" className="btn-primary">
              {t('common.viewAllCourses')}
              <ArrowRight size={18} className="rtl:rotate-180" />
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------ FEATURED SERVICES ------------------------ */}
      <section className="bg-slate-50 py-20 md:py-24">
        <div className="container-x">
          <SectionHeading
            title={t('servicesPage.title')}
            description={t('servicesPage.description')}
          />

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredServices.map((s) => (
              <ServiceCard key={s.id} service={s} learnMore="/services" />
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link to="/services" className="btn-dark">
              {t('common.viewAllServices')}
              <ArrowRight size={18} className="rtl:rotate-180" />
            </Link>
          </div>
        </div>
      </section>

      {/* --------------------- LOCATION & CONTACT BANNER --------------------- */}
      <section className="bg-white py-20 md:py-24">
        <div className="container-x text-center">
          <div className="animate-fade-up">
            <span className="eyebrow-pill border border-accent-600/20 bg-accent-600/10 text-accent-700">
              <MapPin size={14} />
              {t('contact.location')}
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-navy-900 md:text-4xl">
              {t('contact.title')} {site.city}
            </h2>
            <ul className="mx-auto mt-8 max-w-md space-y-4 text-start text-sm">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="mt-0.5 shrink-0 text-accent-600" />
                <span>
                  <span className="font-semibold text-navy-900">{t('contact.address')}</span>
                  <span className="block text-slate-500">
                    {site.city}, {site.country}
                  </span>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Clock size={18} className="mt-0.5 shrink-0 text-accent-600" />
                <span>
                  <span className="font-semibold text-navy-900">{t('contact.hours')}</span>
                  <span className="block text-slate-500">{t('footer.monSat')}</span>
                  <span className="block text-slate-500">{t('footer.sun')}</span>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Phone size={18} className="mt-0.5 shrink-0 text-accent-600" />
                <span>
                  <span className="font-semibold text-navy-900">{t('contact.phoneWhatsapp')}</span>
                  <a
                    href="tel:+212762934592"
                    className="block text-slate-500 transition-colors hover:text-accent-600"
                  >
                    <span dir="ltr" className="inline-block [unicode-bidi:isolate]">
                      {site.phone}
                    </span>
                  </a>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Mail size={18} className="mt-0.5 shrink-0 text-accent-600" />
                <a
                  href={`mailto:${site.email}`}
                  onClick={(e) => {
                    e.preventDefault()
                    window.location.href = `mailto:${site.email}`
                  }}
                  className="font-semibold cursor-pointer text-navy-900 transition-colors hover:text-accent-600"
                >
                  {site.email}
                </a>
              </li>
            </ul>

            <div className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
              <a
                href={waLink(t('whatsapp.visit'))}
                target="_blank"
                rel="noreferrer"
                className="btn-whatsapp"
              >
                <MessageCircle size={18} />
                {t('contact.contactUs')}
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}