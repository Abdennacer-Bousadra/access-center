import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Pencil, Plus, Trash2 } from 'lucide-react'
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

export default function AdminCourses() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pageStatus, setPageStatus] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_COURSE_FORM)
  const [formStatus, setFormStatus] = useState(null)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState(null)

  const load = () => {
    setLoading(true)
    adminApi
      .courses()
      .then((data) => {
        setCourses((data?.courses ?? []).filter((course) => !course.isOnline))
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
    setFormStatus(null)
    setModalOpen(true)
  }

  const closeModal = () => {
    if (saving) return
    setModalOpen(false)
    setFormStatus(null)
  }

  const updateField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleCreate = async (event) => {
    event.preventDefault()
    setSaving(true)
    setFormStatus(null)
    try {
      const data = await adminApi.createCourse({
        ...form,
        isOnline: false,
        price: form.price === '' ? null : Number(form.price),
        durationMonths: form.durationMonths === '' ? null : Number(form.durationMonths),
        sortOrder: form.sortOrder === '' ? undefined : Number(form.sortOrder),
      })
      setModalOpen(false)
      if (data?.course?.id) {
        navigate(`/admin/courses/${data.course.id}`)
      } else {
        load()
      }
    } catch (requestError) {
      setFormStatus({ type: 'error', message: adminErrorText(requestError, t) })
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
        current.map((row) => (row.id === course.id ? data.course : row))
      )
    } catch (requestError) {
      setPageStatus({ type: 'error', message: adminErrorText(requestError, t) })
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (course) => {
    if (!window.confirm(t('admin.courses.deleteConfirm', { name: course.nameFr }))) return
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
        title={t('admin.courses.title')}
        description={t('admin.courses.description')}
        actions={
          <button type="button" onClick={openCreate} className="btn-primary">
            <Plus size={17} />
            {t('admin.courses.add')}
          </button>
        }
      />

      {pageStatus && (
        <StatusBanner status={pageStatus} onClose={() => setPageStatus(null)} />
      )}
      {error && <StatusBanner status={{ type: 'error', message: adminErrorText(error, t) }} />}

      {loading ? (
        <LoadingBlock label={t('admin.common.loading')} />
      ) : courses.length === 0 ? (
        <EmptyBlock
          icon={BookOpen}
          title={t('admin.courses.empty')}
          description={t('admin.courses.emptyHint')}
        />
      ) : (
        <Panel padded={false}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-start">{t('admin.courses.name')}</th>
                  <th className="px-4 py-3 text-start">{t('admin.courses.price')}</th>
                  <th className="px-4 py-3 text-start">{t('admin.common.published')}</th>
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
                    <td className="px-4 py-3 font-semibold text-slate-700">
                      {course.price === null
                        ? t('admin.common.priceOnRequest')
                        : `${course.price} ${course.currency}`}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Toggle
                          checked={course.isActive}
                          disabled={busyId === course.id}
                          onChange={() => toggleActive(course)}
                          label={t('admin.courses.toggleActive')}
                        />
                        <Badge tone={course.isActive ? 'green' : 'slate'}>
                          {course.isActive
                            ? t('admin.common.published')
                            : t('admin.common.hidden')}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/courses/${course.id}`)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-navy-900 transition-colors hover:border-accent-400 hover:text-accent-600"
                        >
                          <Pencil size={14} />
                          {t('admin.courses.openEditor')}
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
        open={modalOpen}
        onClose={closeModal}
        title={t('admin.courses.newTitle')}
        wide
        footer={
          <>
            <button type="button" onClick={closeModal} className="btn-outline" disabled={saving}>
              {t('admin.common.cancel')}
            </button>
            <button
              type="submit"
              form="course-create-form"
              className="btn-primary disabled:cursor-wait disabled:opacity-60"
              disabled={saving}
            >
              {saving ? t('admin.common.saving') : t('admin.common.save')}
            </button>
          </>
        }
      >
        <form id="course-create-form" onSubmit={handleCreate} className="space-y-4">
          <CourseFields
            form={form}
            onChange={updateField}
            idPrefix="course-create"
          />

          {formStatus && <StatusBanner status={formStatus} />}
        </form>
      </Modal>
    </div>
  )
}
