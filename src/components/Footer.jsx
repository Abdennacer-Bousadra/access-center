import { Link } from 'react-router-dom'
import { Clock, Facebook, Globe, Instagram, Mail, MapPin, MessageCircle, Phone, Youtube } from 'lucide-react'
import Logo from './Logo'
import { site } from '../data/content'
import { useCatalog } from '../context/CatalogContext'
import { useLanguage } from '../i18n/LanguageContext'
import { waLink } from '../utils/whatsapp'

export default function Footer() {
  const { t } = useLanguage()
  const { services } = useCatalog()
  const year = new Date().getFullYear()

  const NAV_LINKS = [
    { label: t('nav.home'), to: '/' },
    { label: t('nav.services'), to: '/services' },
    { label: t('nav.courses'), to: '/courses' },
    { label: t('nav.signIn'), to: '/login' },
  ]

  const SOCIALS = [
    { label: 'Instagram', href: site.socials.instagram, icon: Instagram },
    { label: 'Facebook', href: site.socials.facebook, icon: Facebook },
    { label: 'YouTube', href: site.socials.youtube, icon: Youtube },
    { label: 'WhatsApp', href: waLink(t('whatsapp.general')), icon: MessageCircle },
  ]

  return (
    <footer className="relative overflow-hidden bg-navy-950 text-slate-300">
      {/* Accent divider */}
      <div className="h-1 w-full bg-accent-300" />

      <div className="pointer-events-none absolute -right-40 top-40 h-96 w-96 rounded-full bg-accent-300/15 blur-3xl" />

      <div className="container-x relative grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1.2fr_1.4fr]">
        {/* Brand */}
        <div>
          <Logo />
          <p className="mt-5 max-w-xs text-sm leading-relaxed whitespace-pre-line text-slate-400">
            {t('footer.blurb')}
          </p>
          <div className="mt-6 flex gap-3">
            {SOCIALS.map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 text-slate-300 ring-1 ring-white/10 transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent-600 hover:text-white"
              >
                <Icon size={18} />
              </a>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-white">{t('footer.navigation')}</h4>
          <ul className="mt-5 space-y-3">
            {NAV_LINKS.map(({ label, to }) => (
              <li key={to}>
                <Link
                  to={to}
                  className="inline-flex text-sm text-slate-400 transition-colors hover:text-accent-300"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Services */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-white">{t('footer.ourServices')}</h4>
          <ul className="mt-5 space-y-3">
            {services.slice(0, 5).map((s) => (
              <li key={s.id}>
                <Link
                  to="/services"
                  className="inline-block text-sm text-slate-400 transition-colors hover:text-accent-300"
                >
                  {s.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-white">{t('footer.contact')}</h4>
          <ul className="mt-5 space-y-4 text-sm">
            <li className="flex gap-3">
              <MapPin size={18} className="mt-0.5 shrink-0 text-accent-400" />
              <span>
                {site.city}
                <span className="block text-xs text-slate-500">{site.country}</span>
              </span>
            </li>
            <li className="flex gap-3">
              <Phone size={18} className="mt-0.5 shrink-0 text-accent-400" />
              <a href="tel:+212762934592" className="transition-colors hover:text-accent-300">
                <span dir="ltr" className="inline-block [unicode-bidi:isolate]">
                  {site.phone}
                </span>
              </a>
            </li>
            <li className="flex gap-3">
              <Mail size={18} className="mt-0.5 shrink-0 text-accent-400" />
              <a
                href={`mailto:${site.email}`}
                onClick={(e) => {
                  e.preventDefault()
                  window.location.href = `mailto:${site.email}`
                }}
                className="break-all cursor-pointer transition-colors hover:text-accent-300"
              >
                {site.email}
              </a>
            </li>
            <li className="flex gap-3">
              <Globe size={18} className="mt-0.5 shrink-0 text-accent-400" />
              <a
                href={site.url}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-accent-300"
              >
                {site.website}
              </a>
            </li>
            <li className="flex gap-3">
              <Clock size={18} className="mt-0.5 shrink-0 text-accent-400" />
              <span>
                <span className="block text-xs text-slate-500">{t('footer.hours')}</span>
                <span className="block text-slate-300">{t('footer.monSat')}</span>
                <span className="block text-slate-400">{t('footer.sun')}</span>
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="relative border-t border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-3 py-6 text-xs text-slate-500 sm:flex-row">
          <p>
            © {year} {site.name}. {t('footer.rights')}
          </p>
          <p>
            {t('footer.location')} · {t('footer.builtWith')}
          </p>
        </div>
      </div>
    </footer>
  )
}