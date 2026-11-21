import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileVideo,
  MonitorPlay,
  Pencil,
  Plus,
  Trash2,
  Users,
} from 'lucide-react'
import { useLanguage } from '../../i18n/LanguageContext'
import { adminApi } from '../../lib/adminApi'
import { CourseFields, EMPTY_COURSE_FORM } from './CourseFields'
import {
  Badge,
  EmptyBlock,
  LoadingBlock,
  Modal,
  PageHeader,
  Panel,
  StatusBanner,
  Toggle,
  adminErrorText,
} from './adminUi'

export default function AdminOnlineCourses() {
  const { t } = useLanguage()
  const navigate = useNavigate()

  const [courses, setCourses] = useState([])
  const [videosConfigured, setVideosConfigured] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pageStatus, setPageStatus] = useState(null)
  const [busyId, setBusyId] = useState(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_COURSE_FORM)
  const [createStatus, setCreateStatus] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    adminApi
      .onlineCourses()
      .then((data) => {
        setCourses(data?.courses ?? [])
        setVideosConfigured(data?.videosConfigured !== false)
        setError(null)
      })
      .catch((requestError) => setError(requestError))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const openCreate = () => {
    setForm(EMPTY_COURSE_FORM)
    setCreateStatus(null)
    setCreateOpen(true)
  }

  const closeCreate = () => {
    if (saving) return
    setCreateOpen(false)
    setCreateStatus(null)
  }

  const updateField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleCreate = async (event) => {
    event.preventDefault()
    setSaving(true)
    setCreateStatus(null)
    try {
      const data = await adminApi.createCourse({
        ...form,
        isOnline: true,
        price: form.price === '' ? null : Number(form.price),
        durationMonths: form.durationMonths === '' ? null : Number(form.durationMonths),
        sortOrder: form.sortOrder === '' ? undefined : Number(form.sortOrder),
      })
      setCreateOpen(false)
      if (data?.course?.id) {
        navigate(`/admin/online-courses/${data.course.id}`)
      } else {
        load()
      }
    } catch (requestError) {
      setCreateStatus({ type: 'error', message: adminErrorText(requestError, t) })
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (course) => {
    setBusyId(course.id)
    setPageStatus(null)
    try {
      const data = await adminApi.setCourseStatus(course.id, !course.isActive)
      setCourses((current) =>
        current.map((row) =>
          row.id === course.id ? { ...row, isActive: data.course.isActive } : row
        )
      )
    } catch (requestError) {
      setPageStatus({ type: 'error', message: adminErrorText(requestError, t) })
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (course) => {
    if (!window.confirm(t('admin.online.deleteConfirm', { name: course.nameFr }))) return
    setBusyId(course.id)
    setPageStatus(null)
    try {
      await adminApi.deleteCourse(course.id)
      setCourses((current) => current.filter((row) => row.id !== course.id))
      setPageStatus({ type: 'success', message: t('admin.common.deleted') })
    } catch (requestError) {
      setPageStatus({ type: 'error', message: adminErrorText(requestError, t) })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('admin.online.title')}
        description={t('admin.online.description')}
        actions={
          <button type="button" onClick={openCreate} className="btn-primary">
            <Plus size={17} />
            {t('admin.online.add')}
          </button>
        }
      />

      {pageStatus && (
        <StatusBanner status={pageStatus} onClose={() => setPageStatus(null)} />
      )}
      {error && <StatusBanner status={{ type: 'error', message: adminErrorText(error, t) }} />}
      {!videosConfigured && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm font-semibold text-amber-800">
          {t('admin.online.videoDirMissing')}
        </div>
      )}

      {loading ? (
        <LoadingBlock label={t('admin.common.loading')} />
      ) : courses.length === 0 ? (
        <EmptyBlock
          icon={MonitorPlay}
          title={t('admin.online.empty')}
          description={t('admin.online.emptyHint')}
        />
      ) : (
        <Panel padded={false}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-start">{t('admin.online.name')}</th>
                  <th className="px-4 py-3 text-start">{t('admin.online.status')}</th>
                  <th className="px-4 py-3 text-start">{t('admin.online.lessons')}</th>
                  <th className="px-4 py-3 text-start">{t('admin.online.videos')}</th>
                  <th className="px-4 py-3 text-start">{t('admin.online.subscribers')}</th>
                  <th className="px-4 py-3 text-end">{t('admin.common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {courses.map((course) => (
                  <tr key={course.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <p className="font-bold text-navy-900">{course.nameFr}</p>
                      <p className="text-xs text-slate-500">{course.nameAr}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Toggle
                          checked={course.isActive}
                          disabled={busyId === course.id}
                          onChange={() => toggleActive(course)}
                          label={t('admin.online.toggleStatus')}
                        />
                        <Badge tone={course.isActive ? 'green' : 'slate'}>
                          {course.isActive
                            ? t('admin.common.published')
                            : t('admin.online.draft')}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-700">
                      {course.lessonCount}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                        <span className="inline-flex items-center gap-1 text-green-700">
                          <FileVideo size={13} />
                          {t('admin.online.videosFound', { count: course.videosFound })}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 ${
                            course.videosMissing > 0 ? 'text-red-600' : 'text-slate-400'
                          }`}
                        >
                          {t('admin.online.videosMissing', { count: course.videosMissing })}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
                        <Users size={14} className="text-slate-400" />
                        {course.subscribersCount}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/online-courses/${course.id}`)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-navy-900 transition-colors hover:border-accent-400 hover:text-accent-600"
                        >
                          <Pencil size={14} />
                          {t('admin.online.openEditor')}
                        </button>
                        <button
                          type="button"
                          disabled={busyId === course.id}
                          onClick={() => handleDelete(course)}
                          className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-red-300 hover:text-red-600 disabled:opacity-50"
                          aria-label={t('admin.common.delete')}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      <Modal
        open={createOpen}
        onClose={closeCreate}
        title={t('admin.online.newTitle')}
        wide
        footer={
          <>
            <button type="button" onClick={closeCreate} className="btn-outline" disabled={saving}>
              {t('admin.common.cancel')}
            </button>
            <button
              type="submit"
              form="online-course-create-form"
              className="btn-primary disabled:cursor-wait disabled:opacity-60"
              disabled={saving}
            >
              {saving ? t('admin.common.saving') : t('admin.common.save')}
            </button>
          </>
        }
      >
        <form id="online-course-create-form" onSubmit={handleCreate} className="space-y-4">
          <CourseFields
            form={form}
            onChange={updateField}
            idPrefix="online-course-create"
          />
          {createStatus && <StatusBanner status={createStatus} />}
        </form>
      </Modal>
    </div>
  )
}
