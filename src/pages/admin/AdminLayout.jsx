import { useState } from 'react'
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  BookOpen,
  ConciergeBell,
  ExternalLink,
  LayoutDashboard,
  Loader2,
  LogOut,
  MonitorPlay,
  ShieldAlert,
  Users,
} from 'lucide-react'
import Logo from '../../components/Logo'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../i18n/LanguageContext'
import { AdminLanguageSwitcher } from './adminUi'

const NAV_ITEMS = [
  { to: '/admin', end: true, labelKey: 'admin.nav.dashboard', icon: LayoutDashboard },
  { to: '/admin/users', labelKey: 'admin.nav.users', icon: Users },
  { to: '/admin/services', labelKey: 'admin.nav.services', icon: ConciergeBell },
  { to: '/admin/courses', labelKey: 'admin.nav.courses', icon: BookOpen },
  { to: '/admin/online-courses', labelKey: 'admin.nav.onlineCourses', icon: MonitorPlay },
]

function navClass({ isActive }) {
  return `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
    isActive
      ? 'bg-accent-600 text-white shadow-lg shadow-accent-600/20'
      : 'text-slate-600 hover:bg-slate-100 hover:text-navy-900'
  }`
}

export default function AdminLayout() {
  const { t } = useLanguage()
  const { user, loading, signOut } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50">
        <span className="inline-flex items-center gap-3 text-sm font-semibold text-slate-500">
          <Loader2 size={20} className="animate-spin text-accent-600" />
          {t('admin.common.loading')}
        </span>
      </div>
    )
  }

  if (!user) {
    return <Navigate to={`/login?next=${encodeURIComponent(pathname)}`} replace />
  }

  if (user.role !== 'admin') {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-card">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-50 text-red-600">
            <ShieldAlert size={26} />
          </span>
          <h1 className="mt-4 text-xl font-extrabold text-navy-900">{t('admin.forbidden.title')}</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {t('admin.forbidden.description')}
          </p>
          <Link to="/" className="btn-primary mt-6 w-full">
            {t('admin.forbidden.back')}
          </Link>
        </div>
      </div>
    )
  }

  const handleSignOut = async () => {
    setSigningOut(true)
    await signOut()
    setSigningOut(false)
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#2B2B68] shadow-[0_8px_30px_rgba(43,43,104,0.28)]">
        <div className="mx-auto flex h-16 w-full max-w-[1500px] items-center gap-3 px-4 sm:px-6">
          <Logo />
          <span className="hidden rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white/90 ring-1 ring-white/20 sm:inline">
            {t('admin.badge')}
          </span>

          <div className="ms-auto flex items-center gap-2">
            <AdminLanguageSwitcher />
            <Link
              to="/"
              className="hidden items-center gap-1.5 rounded-xl border border-white/20 px-3 py-2 text-xs font-semibold text-white/90 transition-colors hover:bg-white/10 sm:inline-flex"
            >
              <ExternalLink size={14} />
              {t('admin.nav.viewSite')}
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-bold text-navy-900 shadow-sm transition-colors hover:bg-slate-100 disabled:opacity-60"
            >
              {signingOut ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <LogOut size={14} />
              )}
              <span className="hidden sm:inline">{t('admin.nav.signOut')}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-5 px-4 py-5 sm:px-6 lg:flex-row lg:py-7">
        <aside className="hidden w-60 shrink-0 lg:block">
          <div className="sticky top-24 space-y-4">
            <nav className="space-y-1 rounded-2xl border border-slate-200 bg-white p-2 shadow-card">
              {NAV_ITEMS.map(({ to, end, labelKey, icon: Icon }) => (
                <NavLink key={to} to={to} end={end} className={navClass}>
                  <Icon size={18} />
                  {t(labelKey)}
                </NavLink>
              ))}
            </nav>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
              <p className="truncate text-sm font-bold text-navy-900">{user.fullName}</p>
              <p className="mt-0.5 truncate text-xs text-slate-500">{user.email}</p>
            </div>
          </div>
        </aside>

        <div className="lg:hidden">
          <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-card">
            {NAV_ITEMS.map(({ to, end, labelKey, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-colors ${
                    isActive
                      ? 'bg-accent-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                <Icon size={15} />
                {t(labelKey)}
              </NavLink>
            ))}
          </nav>
        </div>

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
