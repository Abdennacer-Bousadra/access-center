import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  ConciergeBell,
  MonitorPlay,
  UserX,
  Users,
} from 'lucide-react'
import { useLanguage } from '../../i18n/LanguageContext'
import { adminApi } from '../../lib/adminApi'
import {
  Badge,
  LoadingBlock,
  PageHeader,
  Panel,
  StatusBanner,
  adminErrorText,
} from './adminUi'

export default function AdminOverview() {
  const { t } = useLanguage()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    adminApi
      .overview()
      .then((result) => {
        if (active) {
          setData(result)
          setError(null)
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  if (loading) return <LoadingBlock label={t('admin.common.loading')} />

  if (error) {
    return (
      <div className="space-y-4">
        <PageHeader title={t('admin.overview.title')} description={t('admin.overview.description')} />
        <StatusBanner status={{ type: 'error', message: adminErrorText(error, t) }} />
      </div>
    )
  }

  const stats = data?.stats ?? {}

  const cards = [
    { key: 'users', label: t('admin.overview.users'), value: stats.users, icon: Users, tone: 'text-navy-700 bg-navy-50' },
    { key: 'verified', label: t('admin.overview.verifiedUsers'), value: stats.verifiedUsers, icon: BadgeCheck, tone: 'text-green-700 bg-green-50' },
    { key: 'courses', label: t('admin.overview.courses'), value: stats.courses, icon: BookOpen, tone: 'text-navy-700 bg-navy-50' },
    { key: 'onlineCourses', label: t('admin.overview.onlineCourses'), value: stats.onlineCourses, icon: MonitorPlay, tone: 'text-accent-700 bg-accent-50' },
    { key: 'services', label: t('admin.overview.services'), value: stats.services, icon: ConciergeBell, tone: 'text-slate-700 bg-slate-100' },
    { key: 'blocked', label: t('admin.overview.blockedUsers'), value: stats.blockedUsers, icon: UserX, tone: 'text-red-700 bg-red-50' },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('admin.overview.title')}
        description={t('admin.overview.description')}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {cards.map(({ key, label, value, icon: Icon, tone }) => (
          <div
            key={key}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5"
          >
            <span className={`grid h-10 w-10 place-items-center rounded-xl ${tone}`}>
              <Icon size={19} />
            </span>
            <p className="mt-3 text-2xl font-extrabold tracking-tight text-navy-900">
              {Number(value ?? 0)}
            </p>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      <Panel padded={false}>
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-navy-900">
            {t('admin.overview.recentUsers')}
          </h2>
          <Link
            to="/admin/users"
            className="inline-flex items-center gap-1 text-xs font-bold text-accent-600 hover:text-accent-700"
          >
            {t('admin.overview.viewAll')}
            <ArrowRight size={14} className="rtl:rotate-180" />
          </Link>
        </div>

        {data?.recentUsers?.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {data.recentUsers.map((user) => (
              <li key={user.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-navy-50 text-sm font-extrabold text-navy-700">
                  {user.fullName.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-navy-900">{user.fullName}</p>
                  <p className="truncate text-xs text-slate-500">{user.email}</p>
                </div>
                <Badge tone={user.emailVerified ? 'green' : 'amber'}>
                  {user.emailVerified
                    ? t('admin.status.verified')
                    : t('admin.status.unverified')}
                </Badge>
                {!user.isActive && <Badge tone="red">{t('admin.status.blocked')}</Badge>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 py-8 text-center text-sm text-slate-500">{t('admin.overview.empty')}</p>
        )}
      </Panel>
    </div>
  )
}
