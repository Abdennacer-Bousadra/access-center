import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  Check,
  ChevronDown,
  Globe,
  GraduationCap,
  Home,
  Layers,
  LogIn,
  LogOut,
  Mail,
  Menu,
  MonitorPlay,
  Search,
  Users,
  X,
} from 'lucide-react'
import Logo from './Logo'
import { useLanguage } from '../i18n/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { LANG_NAMES } from '../i18n/translations'

const NAV_LINKS = [
  { labelKey: 'nav.home', to: '/', icon: Home },
  { labelKey: 'nav.courses', to: '/courses', icon: GraduationCap },
  { labelKey: 'nav.onlineCourses', to: '/online-courses', icon: MonitorPlay },
  { labelKey: 'nav.services', to: '/services', icon: Layers },
  { labelKey: 'nav.about', to: '/about', icon: Users },
  { labelKey: 'nav.contact', to: '/contact', icon: Mail },
]

/* --------------------------- Language selector --------------------------- */
function LanguageSwitcher() {
  const { locale, setLocale, LOCALES, t } = useLanguage()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('nav.language')}
        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-navy-900 shadow-sm transition-colors hover:border-accent-300 hover:text-accent-600"
      >
        <Globe size={16} className="text-slate-400" />
        {locale.toUpperCase()}
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute end-0 top-full z-50 mt-2 w-max min-w-[10rem] overflow-hidden rounded-xl border border-slate-100 bg-white py-1 shadow-xl ring-1 ring-slate-200/50"
        >
          {LOCALES.map((lang) => (
            <button
              key={lang}
              type="button"
              role="option"
              aria-selected={locale === lang}
              onClick={() => {
                setLocale(lang)
                setOpen(false)
              }}
              className={`flex w-full items-center justify-between gap-5 px-4 py-2.5 text-sm font-semibold transition-colors ${
                locale === lang
                  ? 'bg-accent-600/10 text-accent-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-navy-900'
              }`}
            >
              <span>{LANG_NAMES[lang]}</span>
              {locale === lang && <Check size={15} />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ------------------------- Header search button ------------------------- */
function HeaderSearch({ compact = false, onNavigate }) {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [q, setQ] = useState('')

  const submit = (e) => {
    e.preventDefault()
    const query = q.trim()
    navigate(query ? `/services?q=${encodeURIComponent(query)}` : '/services')
    setQ('')
    onNavigate?.()
  }

  return (
    <form
      onSubmit={submit}
      role="search"
      className={`relative ${compact ? 'w-full' : 'hidden w-40 xl:block xl:w-56'}`}
    >
      <Search
        size={16}
        className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400"
      />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t('servicesPage.search')}
        aria-label={t('servicesPage.search')}
        className="w-full rounded-full border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-accent-400 focus:bg-white focus:ring-2 focus:ring-accent-500/25"
      />
    </form>
  )
}

/* -------------------------------- Header -------------------------------- */
export default function Header() {
  const { t, isRTL } = useLanguage()
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { pathname } = useLocation()

  // Close the mobile drawer whenever the route changes
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Add a shadow + border once the page is scrolled
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Lock body scroll while the drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <header
      className={`sticky top-0 z-40 bg-[#2B2B68] transition-shadow duration-300 ${
        scrolled ? 'border-b border-white/15 shadow-[0_8px_30px_rgba(43,43,104,0.35)]' : 'border-b border-white/10'
      }`}
    >
      <div className="container-x flex h-16 items-center justify-between gap-3 md:h-20 lg:gap-6">
        <Logo />

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-5 lg:flex xl:gap-8" aria-label="Navigation">
          {NAV_LINKS.map(({ labelKey, to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `group relative inline-flex items-center gap-1.5 text-sm font-semibold transition-colors ${
                  isActive ? 'text-white' : 'text-slate-200 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={16}
                    className={
                      isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'
                    }
                  />
                  {t(labelKey)}
                  <span
                    className={`absolute -bottom-2 left-0 h-0.5 rounded-full bg-white transition-all duration-300 ${
                      isActive ? 'w-full' : 'w-0 group-hover:w-full'
                    }`}
                  />
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-2.5 lg:flex lg:gap-3">
          <HeaderSearch />
          <LanguageSwitcher />
          {user ? (
            <button
              type="button"
              onClick={signOut}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-navy-900 shadow-sm transition-colors hover:border-red-300 hover:text-red-600"
            >
              <LogOut size={17} />
              {t('login.signOut')}
            </button>
          ) : (
            <NavLink
              to="/login"
              className={({ isActive }) =>
                `inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-lg transition-all duration-200 hover:-translate-y-0.5 ${
                  isActive
                    ? 'bg-[#E20F1E] text-white shadow-[#E20F1E]/25 hover:bg-[#C50D1B]'
                    : 'bg-white text-navy-900 shadow-black/10 hover:bg-slate-100'
                }`
              }
            >
              <LogIn size={17} />
              {t('nav.signIn')}
            </NavLink>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 bg-white text-navy-900 shadow-sm transition-colors hover:border-accent-300 lg:hidden"
          aria-label={t('nav.openMenu')}
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Mobile drawer — portaled to <body> so the header's backdrop-blur can't
          make it translucent, and rendered above every fixed element (z-60) */}
      {createPortal(
        <div
          className={`fixed inset-0 z-[60] lg:hidden ${
            open ? 'pointer-events-auto' : 'pointer-events-none'
          }`}
          aria-hidden={!open}
        >
          <div
            className={`absolute inset-0 bg-navy-950/75 backdrop-blur-sm transition-opacity duration-300 ${
              open ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={() => setOpen(false)}
          />
          <aside
            role="dialog"
            aria-label="Menu"
            className={`absolute top-0 flex h-full w-80 max-w-[85vw] flex-col overflow-y-auto overscroll-contain bg-white shadow-2xl transition-transform duration-300 ${
              isRTL ? 'left-0' : 'right-0'
            } ${open ? 'translate-x-0' : isRTL ? '-translate-x-full' : 'translate-x-full'}`}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 p-4">
              <Logo chip onClick={() => setOpen(false)} />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 text-navy-900 transition-colors hover:bg-slate-50"
                aria-label={t('nav.closeMenu')}
              >
                <X size={20} />
              </button>
            </div>

            <div className="shrink-0 border-b border-slate-100 p-4">
              <HeaderSearch compact onNavigate={() => setOpen(false)} />
            </div>

            <nav className="flex shrink-0 flex-col gap-1 p-4" aria-label="Navigation">
              {NAV_LINKS.map(({ labelKey, to, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                      isActive
                        ? 'bg-accent-600/10 text-accent-700'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-navy-900'
                    }`
                  }
                >
                  <Icon size={18} />
                  {t(labelKey)}
                </NavLink>
              ))}
            </nav>

            <div className="shrink-0 px-4 pt-1">
              <LanguageSwitcher />
            </div>

            <div className="mt-auto shrink-0 space-y-3 border-t border-slate-100 bg-white p-4">
              {user ? (
                <button type="button" onClick={signOut} className="btn-primary w-full">
                  <LogOut size={17} />
                  {t('login.signOut')}
                </button>
              ) : (
                <NavLink to="/login" className="btn-primary w-full">
                  <LogIn size={17} />
                  {t('nav.signIn')}
                </NavLink>
              )}
            </div>
          </aside>
        </div>,
        document.body
      )}
    </header>
  )
}