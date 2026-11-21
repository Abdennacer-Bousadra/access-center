import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Ban,
  CalendarClock,
  CheckCircle2,
  Infinity as InfinityIcon,
  Search,
  Users as UsersIcon,
} from 'lucide-react'
import { useLanguage } from '../../i18n/LanguageContext'
import { adminApi } from '../../lib/adminApi'
import {
  Badge,
  EmptyBlock,
  LoadingBlock,
  Panel,
  StatusBanner,
  adminErrorText,
  inputClass,
} from './adminUi'

const DAY_MS = 24 * 60 * 60 * 1000

function formatDate(value, locale) {
  if (!value) return '—'
  try {
    const localeCode = locale === 'ar' ? 'ar-MA' : locale === 'fr' ? 'fr-FR' : 'en-GB'
    return new Intl.DateTimeFormat(localeCode, { dateStyle: 'medium' }).format(new Date(value))
  } catch {
    return '—'
  }
}

function expiryAfter(months, from = null) {
  if (!months) return null
  const now = Date.now()
  let base = from ? new Date(from).getTime() : now
  if (!Number.isFinite(base) || base < now) base = now
  const date = new Date(base)
  date.setMonth(date.getMonth() + months)
  return date.toISOString()
}

function remainingDays(expiresAt) {
  if (!expiresAt) return null
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (Number.isNaN(diff)) return null
  return Math.ceil(diff / DAY_MS)
}

/**
 * Per-course subscriber management: search, bulk grant/revoke and access
 * expiry (no expiry, +1 month, +3 months). Rendered in the online-course
 * editor "Subscribers" tab.
 */
export default function AdminOnlineCourseSubscribers({ courseId }) {
  const { t, locale } = useLanguage()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [pageStatus, setPageStatus] = useState(null)
  const [busyKey, setBusyKey] = useState(null)
  const [selected, setSelected] = useState(() => new Set())
  const [bulkExpiry, setBulkExpiry] = useState('none')

  useEffect(() => {
    let active = true
    setLoading(true)
    const timer = setTimeout(
      () => {
        adminApi
          .onlineCourseSubscribers(courseId, { search: search.trim() })
          .then((result) => {
            if (!active) return
            setData(result)
            setError(null)
          })
          .catch((requestError) => {
            if (active) setError(requestError)
          })
          .finally(() => {
            if (active) setLoading(false)
          })
      },
      search.trim() ? 250 : 0
    )

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [courseId, search, refreshKey])

  const refresh = useCallback(() => setRefreshKey((key) => key + 1), [])

  const subscribers = data?.subscribers ?? []
  const totalLessons = data?.totalLessons ?? 0

  const selectedIds = useMemo(() => [...selected], [selected])
  const allSelected =
    subscribers.length > 0 && subscribers.every((row) => selected.has(row.id))

  const toggleSelected = (userId) => {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
  }

  const toggleAll = () => {
    setSelected((current) => {
      if (allSelected) return new Set()
      const next = new Set(current)
      for (const row of subscribers) next.add(row.id)
      return next
    })
  }

  const saveOne = async (subscriber, approved, months) => {
    setBusyKey(`user-${subscriber.id}`)
    setPageStatus(null)
    try {
      await adminApi.setOnlineCourseSubscriber(courseId, subscriber.id, {
        approved,
        expiresAt: approved ? expiryAfter(months, subscriber.expiresAt) : null,
      })
      refresh()
      setPageStatus({
        type: 'success',
        message: approved ? t('admin.online.accessGranted') : t('admin.online.accessRevoked'),
      })
    } catch (requestError) {
      setPageStatus({ type: 'error', message: adminErrorText(requestError, t) })
    } finally {
      setBusyKey(null)
    }
  }

  const bulkUpdate = async (approved) => {
    if (selectedIds.length === 0) return
    setBusyKey('bulk')
    setPageStatus(null)
    try {
      const months = bulkExpiry === '1m' ? 1 : bulkExpiry === '3m' ? 3 : null
      const result = await adminApi.bulkOnlineCourseSubscribers(courseId, {
        userIds: selectedIds,
        approved,
        expiresAt: approved ? expiryAfter(months) : null,
      })
      setSelected(new Set())
      refresh()
      setPageStatus({
        type: 'success',
        message: approved
          ? t('admin.online.bulkGrantSuccess', { count: result?.updated ?? selectedIds.length })
          : t('admin.online.bulkRevokeSuccess', { count: result?.updated ?? selectedIds.length }),
      })
    } catch (requestError) {
      setPageStatus({ type: 'error', message: adminErrorText(requestError, t) })
    } finally {
      setBusyKey(null)
    }
  }

  const accessCount = subscribers.filter((row) => row.hasAccess).length

  return (
    <Panel className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-navy-900">
            {t('admin.online.subscribersTitle')}
          </h2>
          <p className="mt-1 text-sm text-slate-600">{t('admin.online.subscribersDescription')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="navy">
            <UsersIcon size={12} />
            {t('admin.online.accessCount', { count: accessCount })}
          </Badge>
          <Badge tone="slate">
            {t('admin.online.lessonsCount', { count: totalLessons })}
          </Badge>
        </div>
      </div>

      {pageStatus && (
        <StatusBanner status={pageStatus} onClose={() => setPageStatus(null)} />
      )}
      {error && <StatusBanner status={{ type: 'error', message: adminErrorText(error, t) }} />}

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_200px_auto]">
        <div className="relative">
          <Search
            size={17}
            className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setSelected(new Set())
            }}
            placeholder={t('admin.online.searchSubscribers')}
            className={`${inputClass} ps-10`}
            aria-label={t('admin.online.searchSubscribers')}
          />
        </div>

        <select
          value={bulkExpiry}
          onChange={(event) => setBulkExpiry(event.target.value)}
          className={inputClass}
          aria-label={t('admin.online.expiry')}
        >
          <option value="none">{t('admin.online.noExpiry')}</option>
          <option value="1m">{t('admin.online.oneMonth')}</option>
          <option value="3m">{t('admin.online.threeMonths')}</option>
        </select>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={selectedIds.length === 0 || busyKey === 'bulk'}
            onClick={() => bulkUpdate(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-bold text-green-700 transition-colors hover:bg-green-100 disabled:opacity-50"
          >
            <CheckCircle2 size={14} />
            {t('admin.online.grantSelected', { count: selectedIds.length })}
          </button>
          <button
            type="button"
            disabled={selectedIds.length === 0 || busyKey === 'bulk'}
            onClick={() => bulkUpdate(false)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
          >
            <Ban size={14} />
            {t('admin.online.revokeSelected', { count: selectedIds.length })}
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingBlock label={t('admin.common.loading')} />
      ) : subscribers.length === 0 ? (
        <EmptyBlock
          icon={UsersIcon}
          title={t('admin.online.noSubscribers')}
          description={t('admin.common.noResults')}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-slate-300 text-accent-600 focus:ring-accent-500"
                    aria-label={t('admin.online.selectAll')}
                  />
                </th>
                <th className="px-4 py-3 text-start">{t('admin.online.subscriber')}</th>
                <th className="px-4 py-3 text-start">{t('admin.online.access')}</th>
                <th className="px-4 py-3 text-start">{t('admin.online.expiry')}</th>
                <th className="px-4 py-3 text-start">{t('admin.online.progress')}</th>
                <th className="px-4 py-3 text-start">{t('admin.online.lastActivity')}</th>
                <th className="px-4 py-3 text-end">{t('admin.common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {subscribers.map((subscriber) => {
                const days = remainingDays(subscriber.expiresAt)
                const busy = busyKey === `user-${subscriber.id}`
                const percent =
                  totalLessons > 0
                    ? Math.min(100, Math.round((subscriber.completedLessons / totalLessons) * 100))
                    : 0

                return (
                  <tr key={subscriber.id} className="hover:bg-slate-50/70">
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(subscriber.id)}
                        onChange={() => toggleSelected(subscriber.id)}
                        className="h-4 w-4 rounded border-slate-300 text-accent-600 focus:ring-accent-500"
                        aria-label={subscriber.fullName}
                      />
                    </td>

                    <td className="px-4 py-3">
                      <p className="font-bold text-navy-900">{subscriber.fullName}</p>
                      <p className="text-xs text-slate-500">{subscriber.email}</p>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge tone={subscriber.hasAccess ? 'green' : subscriber.isExpired ? 'red' : 'slate'}>
                          {subscriber.hasAccess
                            ? t('admin.status.approved')
                            : subscriber.isExpired
                              ? t('admin.online.expired')
                              : subscriber.status === 'pending'
                                ? t('admin.status.pending')
                                : subscriber.status === 'rejected'
                                  ? t('admin.status.rejected')
                                  : t('admin.status.notGranted')}
                        </Badge>
                        {!subscriber.emailVerified && (
                          <Badge tone="amber">{t('admin.status.unverified')}</Badge>
                        )}
                        {!subscriber.isActive && (
                          <Badge tone="red">{t('admin.status.blocked')}</Badge>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <p className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600">
                        <CalendarClock size={13} className="text-slate-400" />
                        {subscriber.expiresAt
                          ? formatDate(subscriber.expiresAt, locale)
                          : t('admin.online.noExpiry')}
                      </p>
                      {subscriber.hasAccess && days !== null && (
                        <p className="mt-1 text-[11px] font-semibold text-slate-500">
                          {t('admin.online.daysLeft', { count: Math.max(0, days) })}
                        </p>
                      )}
                      {subscriber.isExpired && (
                        <p className="mt-1 text-[11px] font-semibold text-red-600">
                          {t('admin.online.expired')}
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <p className="text-xs font-semibold text-slate-600">
                        {t('admin.online.completedOf', {
                          done: subscriber.completedLessons,
                          total: totalLessons,
                        })}
                      </p>
                      <div className="mt-1.5 h-1.5 w-32 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-accent-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </td>

                    <td className="px-4 py-3 text-xs text-slate-500">
                      {subscriber.lastActivity
                        ? formatDate(subscriber.lastActivity, locale)
                        : t('admin.online.never')}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center justify-end gap-1">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => saveOne(subscriber, true, 1)}
                          className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-bold text-slate-600 transition-colors hover:border-accent-400 hover:text-accent-600 disabled:opacity-50"
                          title={t('admin.online.oneMonth')}
                        >
                          +1
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => saveOne(subscriber, true, 3)}
                          className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-bold text-slate-600 transition-colors hover:border-accent-400 hover:text-accent-600 disabled:opacity-50"
                          title={t('admin.online.threeMonths')}
                        >
                          +3
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => saveOne(subscriber, true, null)}
                          className="grid h-7 w-7 place-items-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:border-accent-400 hover:text-accent-600 disabled:opacity-50"
                          title={t('admin.online.grantNoExpiry')}
                          aria-label={t('admin.online.grantNoExpiry')}
                        >
                          <InfinityIcon size={13} />
                        </button>
                        <button
                          type="button"
                          disabled={busy || !subscriber.hasAccess}
                          onClick={() => saveOne(subscriber, false, null)}
                          className="grid h-7 w-7 place-items-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-red-300 hover:text-red-600 disabled:opacity-40"
                          title={t('admin.online.revoke')}
                          aria-label={t('admin.online.revoke')}
                        >
                          <Ban size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  )
}
