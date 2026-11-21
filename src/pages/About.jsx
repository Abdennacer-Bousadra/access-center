import {
  CalendarClock,
  GraduationCap,
  Layers,
  MonitorPlay,
  Sparkles,
  Star,
  Users,
  Wrench,
} from 'lucide-react'
import PageBanner from '../components/PageBanner'
import SectionHeading from '../components/SectionHeading'
import { site } from '../data/content'
import { useLanguage } from '../i18n/LanguageContext'

const STATS = [
  { key: 'students', value: '+500', icon: Users },
  { key: 'courses', value: '+20', icon: GraduationCap },
  { key: 'services', value: '+15', icon: Layers },
  { key: 'rating', value: '5.0', icon: Star, starred: true },
]

const VALUES = [
  { icon: MonitorPlay, titleKey: 'about.values.freePlatform.title', descKey: 'about.values.freePlatform.desc' },
  { icon: Wrench, titleKey: 'about.values.practical.title', descKey: 'about.values.practical.desc' },
  {
    icon: CalendarClock,
    titleKey: 'about.values.privateSessions.title',
    descKey: 'about.values.privateSessions.desc',
  },
]

function StatsSection() {
  const { t } = useLanguage()
  return (
    <section className="relative overflow-hidden bg-slate-50 py-16 md:py-20">
      <div className="pointer-events-none absolute -top-24 left-1/4 h-80 w-80 rounded-full bg-accent-400/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 right-1/4 h-80 w-80 rounded-full bg-navy-400/10 blur-3xl" />

      <div className="container-x relative">
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {STATS.map(({ key, value, icon: Icon, starred }) => (
            <div
              key={key}
              className="group relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 text-center shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover sm:p-8"
            >
              <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-accent-400/10 blur-2xl transition-opacity duration-300 group-hover:opacity-100 sm:opacity-0" />
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-accent-600/10 text-accent-600">
                <Icon size={22} className={starred ? 'fill-current' : ''} />
              </span>
              <p className="mt-4 text-3xl font-extrabold tracking-tight text-navy-900 sm:text-4xl">
                {value}
              </p>
              <p className="mt-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 sm:text-sm">
                {t(`about.stats.${key}`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ValuesSection() {
  const { t } = useLanguage()
  return (
    <section className="relative overflow-hidden bg-white py-16 md:py-20">
      <div className="pointer-events-none absolute -top-32 right-1/3 h-96 w-96 rounded-full bg-navy-400/10 blur-3xl" />

      <div className="container-x relative">
        <SectionHeading title={t('about.values.title')} />

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {VALUES.map(({ icon: Icon, titleKey, descKey }) => (
            <div
              key={titleKey}
              className="group relative overflow-hidden rounded-3xl border border-slate-100 bg-slate-50 p-7 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-accent-200 hover:bg-white hover:shadow-card-hover"
            >
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-accent-600 text-white shadow-lg shadow-accent-600/25 transition-transform duration-300 group-hover:scale-105">
                <Icon size={24} />
              </span>
              <h3 className="mt-5 flex items-center gap-2 text-lg font-bold text-navy-900">
                {t(titleKey)}
                <Sparkles size={16} className="text-accent-500" />
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{t(descKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function About() {
  const { t } = useLanguage()

  return (
    <>
      <PageBanner
        crumbs={[t('nav.home'), t('nav.about')]}
        title={t('about.title')}
        eyebrow={site.name}
        description={t('about.desc')}
      />

      <StatsSection />

      <ValuesSection />
    </>
  )
}