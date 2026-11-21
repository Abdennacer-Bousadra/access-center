import { useCallback, useEffect, useMemo, useState } from 'react'
import { Ban, CheckCircle2, Search, ShieldCheck, UserCheck, Users as UsersIcon } from 'lucide-react'
import { useLanguage } from '../../i18n/LanguageContext'
import { adminApi } from '../../lib/adminApi'
import {
  Badge,
  EmptyBlock,
  Field,
  LoadingBlock,
  Modal,
  PageHeader,
  Panel,
  StatusBanner,
  adminErrorText,
  inputClass,
} from './adminUi'

function formatDate(value, locale) {
  if (!value) return '—'
  try {
    const localeCode = locale === 'ar' ? 'ar-MA' : locale === 'fr' ? 'fr-FR' : 'en-GB'
    return new Intl.DateTimeFormat(localeCode, { dateStyle: 'medium' }).format(new Date(value))
  } catch {
    return '—'
  }
}

export default function AdminUsers() {
  const { t, locale } = useLanguage()
  const [users, setUsers] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [courseFilter, setCourseFilter] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [pageStatus, setPageStatus] = useState(null)

  const [selected, setSelected] = useState(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailStatus, setDetailStatus] = useState(null)
  const [busyKey, setBusyKey] = useState(null)

  useEffect(() => {
    adminApi
      .courses()
      .then((data) =>
        setCourses((data?.courses ?? []).filter((course) => course.isOnline))
      )
      .catch(() => setCourses([]))
  }, [])

  useEffect(() => {
    let active = true
    setLoading(true)
    const timer = setTimeout(
      () => {
        adminApi
          .users({
            search: search.trim(),
            status: statusFilter,
            courseId: courseFilter,
          })
          .then((data) => {
            if (!active) return
            setUsers(data?.users ?? [])
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
  }, [search, statusFilter, courseFilter, refreshKey])

  const loadDetail = useCallback(async (userId) => {
    setDetailLoading(true)
    setDetailStatus(null)
    try {
      const data = await adminApi.user(userId)
      setSelected(data)
    } catch (requestError) {
      setDetailStatus({ type: 'error', message: adminErrorText(requestError, t) })
    } finally {
      setDetailLoading(false)
    }
  }, [t])

  const openDetail = (userId) => {
    setSelected(null)
    setDetailOpen(true)
    loadDetail(userId)
  }

  const closeDetail = () => {
    setDetailOpen(false)
    setSelected(null)
    setDetailStatus(null)
  }

  const patchUserActive = async (targetUser, isActive) => {
    setBusyKey(`user-${targetUser.id}`)
    try {
      const data = await adminApi.updateUser(targetUser.id, { isActive })
      const updated = data?.user
      setUsers((current) =>
        current.map((row) => (row.id === targetUser.id ? { ...row, ...updated } : row))
      )
      setSelected((current) =>
        current?.user?.id === targetUser.id
          ? { ...current, user: { ...current.user, ...updated } }
          : current
      )
      setPageStatus({
        type: 'success',
        message: isActive ? t('admin.users.unblockSuccess') : t('admin.users.blockSuccess'),
      })
      setDetailStatus({
        type: 'success',
        message: isActive ? t('admin.users.unblockSuccess') : t('admin.users.blockSuccess'),
      })
    } catch (requestError) {
      const status = { type: 'error', message: adminErrorText(requestError, t) }
      setPageStatus(status)
      setDetailStatus(status)
    } finally {
      setBusyKey(null)
    }
  }

  const toggleEnrollment = async (courseId, approved) => {
    if (!selected?.user) return
    setBusyKey(`course-${courseId}`)
    try {
      await adminApi.setEnrollment(selected.user.id, courseId, approved)
      await loadDetail(selected.user.id)
      setDetailStatus({
        type: 'success',
        message: approved ? t('admin.users.grantSuccess') : t('admin.users.revokeSuccess'),
      })
      setRefreshKey((key) => key + 1)
    } catch (requestError) {
      setDetailStatus({ type: 'error', message: adminErrorText(requestError, t) })
    } finally {
      setBusyKey(null)
    }
  }

  const enrollmentMap = useMemo(() => {
    const map = new Map()
    for (const enrollment of selected?.enrollments ?? []) {
      map.set(Number(enrollment.courseId), enrollment.status)
    }
    return map
  }, [selected])

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('admin.users.title')}
        description={t('admin.users.description')}
      />

      {pageStatus && (
        <StatusBanner status={pageStatus} onClose={() => setPageStatus(null)} />
      )}
      {error && <StatusBanner status={{ type: 'error', message: adminErrorText(error, t) }} />}

      <Panel className="space-y-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_220px]">
          <div className="relative">
            <Search
              size={17}
              className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('admin.users.searchPlaceholder')}
              className={`${inputClass} ps-10`}
              aria-label={t('admin.users.searchPlaceholder')}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className={inputClass}
            aria-label={t('admin.users.filterStatus')}
          >
            <option value="all">{t('admin.users.filters.all')}</option>
            <option value="verified">{t('admin.users.filters.verified')}</option>
            <option value="unverified">{t('admin.users.filters.unverified')}</option>
            <option value="active">{t('admin.users.filters.active')}</option>
            <option value="blocked">{t('admin.users.filters.blocked')}</option>
          </select>

          <select
            value={courseFilter}
            onChange={(event) => setCourseFilter(event.target.value)}
            className={inputClass}
            aria-label={t('admin.users.filterCourse')}
          >
            <option value="">{t('admin.users.filters.allCourses')}</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.nameFr}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <LoadingBlock label={t('admin.common.loading')} />
        ) : users.length === 0 ? (
          <EmptyBlock
            icon={UsersIcon}
            title={t('admin.users.noUsers')}
            description={t('admin.common.noResults')}
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[840px] text-start text-sm">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-start">{t('admin.users.subscriber')}</th>
                  <th className="px-4 py-3 text-start">{t('admin.users.verified')}</th>
                  <th className="px-4 py-3 text-start">{t('admin.users.account')}</th>
                  <th className="px-4 py-3 text-start">{t('admin.users.access')}</th>
                  <th className="px-4 py-3 text-start">{t('admin.users.joined')}</th>
                  <th className="px-4 py-3 text-end">{t('admin.common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <p className="font-bold text-navy-900">{user.fullName}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={user.emailVerified ? 'green' : 'amber'}>
                        {user.emailVerified
                          ? t('admin.status.verified')
                          : t('admin.status.unverified')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={user.isActive ? 'green' : 'red'}>
                        {user.isActive ? t('admin.status.active') : t('admin.status.blocked')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-semibold text-slate-600">
                        {t('admin.users.approvedCount', { count: user.approvedCount ?? 0 })}
                      </p>
                      {(user.pendingCount ?? 0) > 0 && (
                        <p className="text-xs font-semibold text-amber-600">
                          {t('admin.users.pendingCount', { count: user.pendingCount })}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {formatDate(user.createdAt, locale)}
                    </td>
                    <td className="px-4 py-3 text-end">
                      <button
                        type="button"
                        onClick={() => openDetail(user.id)}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-navy-900 transition-colors hover:border-accent-400 hover:text-accent-600"
                      >
                        {t('admin.users.details')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Modal
        open={detailOpen}
        onClose={closeDetail}
        title={t('admin.users.detailTitle')}
        wide
        footer={
          <button type="button" onClick={closeDetail} className="btn-outline">
            {t('admin.common.close')}
          </button>
        }
      >
        {detailStatus && (
          <div className="mb-4">
            <StatusBanner status={detailStatus} onClose={() => setDetailStatus(null)} />
          </div>
        )}

        {detailLoading ? (
          <LoadingBlock label={t('admin.common.loading')} />
        ) : !selected ? (
          <p className="rounded-xl border border-slate-200 p-6 text-center text-sm text-slate-500">
            {t('admin.common.noResults')}
          </p>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <div>
                <h3 className="text-lg font-extrabold text-navy-900">{selected.user.fullName}</h3>
                <p className="text-sm text-slate-600">{selected.user.email}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge tone={selected.user.emailVerified ? 'green' : 'amber'}>
                    {selected.user.emailVerified
                      ? t('admin.status.verified')
                      : t('admin.status.unverified')}
                  </Badge>
                  <Badge tone={selected.user.isActive ? 'green' : 'red'}>
                    {selected.user.isActive
                      ? t('admin.status.active')
                      : t('admin.status.blocked')}
                  </Badge>
                  <Badge tone="navy">
                    {t('admin.users.completedLessons', {
                      count: selected.user.completedLessons ?? 0,
                    })}
                  </Badge>
                </div>
              </div>

              <button
                type="button"
                disabled={busyKey === `user-${selected.user.id}`}
                onClick={() => patchUserActive(selected.user, !selected.user.isActive)}
                className={
                  selected.user.isActive
                    ? 'inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-60'
                    : 'inline-flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-bold text-green-700 transition-colors hover:bg-green-100 disabled:opacity-60'
                }
              >
                {selected.user.isActive ? <Ban size={16} /> : <UserCheck size={16} />}
                {selected.user.isActive ? t('admin.users.block') : t('admin.users.unblock')}
              </button>
            </div>

            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 p-3">
                <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  {t('admin.users.phone')}
                </dt>
                <dd className="mt-1 font-semibold text-navy-900">{selected.user.phone || '—'}</dd>
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  {t('admin.users.joined')}
                </dt>
                <dd className="mt-1 font-semibold text-navy-900">
                  {formatDate(selected.user.createdAt, locale)}
                </dd>
              </div>
              <div className="rounded-xl border border-slate-200 p-3 sm:col-span-2">
                <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  {t('admin.users.address')}
                </dt>
                <dd className="mt-1 font-semibold text-navy-900">
                  {selected.user.address || '—'}
                </dd>
              </div>
            </dl>

            <div>
              <div className="mb-2 flex items-center gap-2">
                <ShieldCheck size={17} className="text-accent-600" />
                <h4 className="text-sm font-extrabold uppercase tracking-wide text-navy-900">
                  {t('admin.users.coursesTitle')}
                </h4>
              </div>

              {courses.length === 0 ? (
                <p className="rounded-xl border border-slate-200 p-4 text-sm text-slate-500">
                  {t('admin.users.noCourses')}
                </p>
              ) : (
                <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                  {courses.map((course) => {
                    const status = enrollmentMap.get(Number(course.id))
                    const approved = status === 'approved'
                    const busy = busyKey === `course-${course.id}`
                    return (
                      <li
                        key={course.id}
                        className="flex flex-wrap items-center gap-3 px-4 py-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-navy-900">
                            {course.nameFr}
                          </p>
                          <p className="truncate text-xs text-slate-500">{course.nameAr}</p>
                        </div>

                        <Badge
                          tone={
                            approved
                              ? 'green'
                              : status === 'pending'
                                ? 'amber'
                                : status === 'rejected'
                                  ? 'red'
                                  : 'slate'
                          }
                        >
                          {approved
                            ? t('admin.status.approved')
                            : status === 'pending'
                              ? t('admin.status.pending')
                              : status === 'rejected'
                                ? t('admin.status.rejected')
                                : t('admin.status.notGranted')}
                        </Badge>

                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => toggleEnrollment(course.id, !approved)}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors disabled:opacity-60 ${
                            approved
                              ? 'border border-red-200 text-red-700 hover:bg-red-50'
                              : 'border border-green-200 text-green-700 hover:bg-green-50'
                          }`}
                        >
                          {approved ? <Ban size={14} /> : <CheckCircle2 size={14} />}
                          {approved ? t('admin.users.revoke') : t('admin.users.grant')}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            <Field
              label={t('admin.users.role')}
              hint={t('admin.users.roleHint')}
            >
              <input value={selected.user.role} readOnly className={`${inputClass} bg-slate-50`} />
            </Field>
          </div>
        )}
      </Modal>
    </div>
  )
}
