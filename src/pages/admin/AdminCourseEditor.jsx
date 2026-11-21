import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BookOpen,
  Clock3,
  FileVideo,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Users,
  VideoOff,
} from 'lucide-react'
import { useLanguage } from '../../i18n/LanguageContext'
import { adminApi } from '../../lib/adminApi'
import AdminOnlineCourseSubscribers from './AdminOnlineCourseSubscribers'
import { CourseFields, courseToForm } from './CourseFields'
import {
  Badge,
  Field,
  LoadingBlock,
  Modal,
  PageHeader,
  Panel,
  StatusBanner,
  Toggle,
  adminErrorText,
  inputClass,
  moveItem,
  textareaClass,
} from './adminUi'

const EMPTY_AXIS = { titleFr: '', titleAr: '' }

const EMPTY_LESSON = {
  axisId: '',
  titleFr: '',
  titleAr: '',
  descriptionFr: '',
  descriptionAr: '',
  videoRef: '',
  duration: '',
  isActive: true,
}

function lessonToForm(lesson) {
  return {
    axisId: lesson.axisId ? String(lesson.axisId) : '',
    titleFr: lesson.titleFr ?? '',
    titleAr: lesson.titleAr ?? '',
    descriptionFr: lesson.descriptionFr ?? '',
    descriptionAr: lesson.descriptionAr ?? '',
    videoRef: lesson.videoRef ?? '',
    duration:
      lesson.duration === null || lesson.duration === undefined ? '' : String(lesson.duration),
    isActive: Boolean(lesson.isActive),
  }
}

function formatDuration(seconds) {
  if (seconds === null || seconds === undefined) return '—'
  const total = Number(seconds)
  if (!Number.isFinite(total) || total < 0) return '—'
  const minutes = Math.floor(total / 60)
  const rest = Math.floor(total % 60)
  return `${minutes}:${String(rest).padStart(2, '0')}`
}

export default function AdminCourseEditor({ variant = 'formations' }) {
  const { t } = useLanguage()
  const { courseId } = useParams()
  const navigate = useNavigate()
  const isOnlineVariant = variant === 'online'

  const [tab, setTab] = useState('content')
  const [detail, setDetail] = useState(null)
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pageStatus, setPageStatus] = useState(null)
  const [savingCourse, setSavingCourse] = useState(false)
  const [busyKey, setBusyKey] = useState(null)

  const [videoFiles, setVideoFiles] = useState([])
  const [videosLoading, setVideosLoading] = useState(true)
  const [videosConfigured, setVideosConfigured] = useState(true)
  const [videosError, setVideosError] = useState(null)

  const [axisModalOpen, setAxisModalOpen] = useState(false)
  const [editingAxis, setEditingAxis] = useState(null)
  const [axisForm, setAxisForm] = useState(EMPTY_AXIS)
  const [axisStatus, setAxisStatus] = useState(null)

  const [lessonModalOpen, setLessonModalOpen] = useState(false)
  const [editingLesson, setEditingLesson] = useState(null)
  const [lessonAxisId, setLessonAxisId] = useState('')
  const [lessonForm, setLessonForm] = useState(EMPTY_LESSON)
  const [lessonStatus, setLessonStatus] = useState(null)

  const loadCourse = useCallback(
    async ({ syncForm = false } = {}) => {
      const data = await adminApi.course(courseId)
      setDetail(data)
      if (syncForm) setForm(courseToForm(data.course))
      return data
    },
    [courseId]
  )

  const loadVideos = useCallback(async () => {
    setVideosLoading(true)
    setVideosError(null)
    try {
      const data = await adminApi.videos()
      setVideoFiles((data?.files ?? []).map((file) => file.name))
      setVideosConfigured(Boolean(data?.configured))
    } catch (requestError) {
      setVideosError(requestError)
      setVideoFiles([])
    } finally {
      setVideosLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    setDetail(null)
    setForm(null)

    loadCourse({ syncForm: true })
      .catch((requestError) => {
        if (active) setError(requestError)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [loadCourse])

  useEffect(() => {
    if (isOnlineVariant) loadVideos()
  }, [isOnlineVariant, loadVideos])

  const axes = detail?.axes ?? []
  const ungroupedLessons = detail?.ungroupedLessons ?? []

  const fileSet = useMemo(() => new Set(videoFiles), [videoFiles])

  useEffect(() => {
    setTab('content')
  }, [courseId])

  const updateCourseField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSaveCourse = async (event) => {
    event.preventDefault()
    setSavingCourse(true)
    setPageStatus(null)
    try {
      await adminApi.updateCourse(courseId, {
        ...form,
        price: form.price === '' ? null : Number(form.price),
        durationMonths: form.durationMonths === '' ? null : Number(form.durationMonths),
        sortOrder: Number(form.sortOrder) || 0,
      })
      await loadCourse({ syncForm: true })
      setPageStatus({
        type: 'success',
        message: isOnlineVariant
          ? t('admin.online.courseSaved')
          : t('admin.editor.courseSaved'),
      })
    } catch (requestError) {
      setPageStatus({ type: 'error', message: adminErrorText(requestError, t) })
    } finally {
      setSavingCourse(false)
    }
  }

  const toggleCourseStatus = async () => {
    if (!detail?.course) return
    setBusyKey('course-status')
    setPageStatus(null)
    try {
      const data = await adminApi.setCourseStatus(courseId, !detail.course.isActive)
      setDetail((current) => ({ ...current, course: data.course }))
      setForm((current) => ({ ...current, isActive: data.course.isActive }))
      setPageStatus({ type: 'success', message: t('admin.editor.statusUpdated') })
    } catch (requestError) {
      setPageStatus({ type: 'error', message: adminErrorText(requestError, t) })
    } finally {
      setBusyKey(null)
    }
  }

  const deleteCourse = async () => {
    if (!detail?.course) return
    if (
      !window.confirm(
        t('admin.online.deleteCourseConfirm', { name: detail.course.nameFr })
      )
    ) {
      return
    }
    setBusyKey('course-delete')
    setPageStatus(null)
    try {
      await adminApi.deleteCourse(courseId)
      navigate('/admin/online-courses')
    } catch (requestError) {
      setPageStatus({ type: 'error', message: adminErrorText(requestError, t) })
      setBusyKey(null)
    }
  }

  /* --------------------------------- Axes --------------------------------- */
  const openAddAxis = () => {
    setEditingAxis(null)
    setAxisForm(EMPTY_AXIS)
    setAxisStatus(null)
    setAxisModalOpen(true)
  }

  const openEditAxis = (axis) => {
    setEditingAxis(axis)
    setAxisForm({ titleFr: axis.titleFr ?? '', titleAr: axis.titleAr ?? '' })
    setAxisStatus(null)
    setAxisModalOpen(true)
  }

  const saveAxis = async (event) => {
    event.preventDefault()
    setBusyKey('axis-save')
    setAxisStatus(null)
    try {
      if (editingAxis) {
        await adminApi.updateAxis(courseId, editingAxis.id, axisForm)
      } else {
        await adminApi.createAxis(courseId, axisForm)
      }
      await loadCourse()
      setAxisModalOpen(false)
      setPageStatus({ type: 'success', message: t('admin.editor.axisSaved') })
    } catch (requestError) {
      setAxisStatus({ type: 'error', message: adminErrorText(requestError, t) })
    } finally {
      setBusyKey(null)
    }
  }

  const deleteAxis = async (axis) => {
    if (!window.confirm(t('admin.editor.deleteAxisConfirm', { name: axis.titleFr }))) return
    setBusyKey(`axis-${axis.id}`)
    setPageStatus(null)
    try {
      await adminApi.deleteAxis(courseId, axis.id)
      await loadCourse()
      setPageStatus({ type: 'success', message: t('admin.editor.axisDeleted') })
    } catch (requestError) {
      setPageStatus({ type: 'error', message: adminErrorText(requestError, t) })
    } finally {
      setBusyKey(null)
    }
  }

  const moveAxis = async (axisId, direction) => {
    const index = axes.findIndex((axis) => axis.id === axisId)
    if (index < 0) return
    const next = moveItem(axes, index, direction)
    if (next === axes) return
    setBusyKey('axis-order')
    setPageStatus(null)
    try {
      await adminApi.reorderAxes(
        courseId,
        next.map((axis) => axis.id)
      )
      await loadCourse()
    } catch (requestError) {
      setPageStatus({ type: 'error', message: adminErrorText(requestError, t) })
    } finally {
      setBusyKey(null)
    }
  }

  /* -------------------------------- Lessons ------------------------------- */
  const openAddLesson = (axisId) => {
    setEditingLesson(null)
    setLessonAxisId(String(axisId))
    setLessonForm({ ...EMPTY_LESSON, axisId: String(axisId) })
    setLessonStatus(null)
    setLessonModalOpen(true)
  }

  const openEditLesson = (lesson) => {
    setEditingLesson(lesson)
    setLessonAxisId(lesson.axisId ? String(lesson.axisId) : '')
    setLessonForm(lessonToForm(lesson))
    setLessonStatus(null)
    setLessonModalOpen(true)
  }

  const saveLesson = async (event) => {
    event.preventDefault()
    setBusyKey('lesson-save')
    setLessonStatus(null)
    try {
      const payload = {
        ...lessonForm,
        axisId: Number(lessonForm.axisId),
        duration: lessonForm.duration === '' ? null : Number(lessonForm.duration),
        videoRef: lessonForm.videoRef.trim(),
      }

      if (editingLesson) {
        await adminApi.updateLesson(courseId, editingLesson.id, payload)
      } else {
        await adminApi.createLesson(courseId, payload)
      }
      await loadCourse()
      setLessonModalOpen(false)
      setPageStatus({ type: 'success', message: t('admin.editor.lessonSaved') })
    } catch (requestError) {
      setLessonStatus({ type: 'error', message: adminErrorText(requestError, t) })
    } finally {
      setBusyKey(null)
    }
  }

  const deleteLesson = async (lesson) => {
    if (!window.confirm(t('admin.editor.deleteLessonConfirm', { name: lesson.titleFr }))) return
    setBusyKey(`lesson-${lesson.id}`)
    setPageStatus(null)
    try {
      await adminApi.deleteLesson(courseId, lesson.id)
      await loadCourse()
      setPageStatus({ type: 'success', message: t('admin.editor.lessonDeleted') })
    } catch (requestError) {
      setPageStatus({ type: 'error', message: adminErrorText(requestError, t) })
    } finally {
      setBusyKey(null)
    }
  }

  const toggleLessonStatus = async (lesson) => {
    setBusyKey(`lesson-${lesson.id}`)
    setPageStatus(null)
    try {
      const data = await adminApi.setLessonStatus(courseId, lesson.id, !lesson.isActive)
      setDetail((current) => ({
        ...current,
        axes: current.axes.map((axis) => ({
          ...axis,
          lessons: axis.lessons.map((row) => (row.id === lesson.id ? data.lesson : row)),
        })),
      }))
    } catch (requestError) {
      setPageStatus({ type: 'error', message: adminErrorText(requestError, t) })
    } finally {
      setBusyKey(null)
    }
  }

  const moveLesson = async (axis, lessonId, direction) => {
    const index = axis.lessons.findIndex((lesson) => lesson.id === lessonId)
    if (index < 0) return
    const next = moveItem(axis.lessons, index, direction)
    if (next === axis.lessons) return
    setBusyKey('lesson-order')
    setPageStatus(null)
    try {
      await adminApi.reorderLessons(
        courseId,
        axis.id,
        next.map((lesson) => lesson.id)
      )
      await loadCourse()
    } catch (requestError) {
      setPageStatus({ type: 'error', message: adminErrorText(requestError, t) })
    } finally {
      setBusyKey(null)
    }
  }

  /* -------------------------------- Render -------------------------------- */
  if (loading) return <LoadingBlock label={t('admin.common.loading')} />

  const listPath = isOnlineVariant ? '/admin/online-courses' : '/admin/courses'
  const backLabel = isOnlineVariant ? t('admin.online.back') : t('admin.editor.back')
  const wrongType = detail && isOnlineVariant !== Boolean(detail.course.isOnline)

  if (error || !detail || !form || wrongType) {
    return (
      <div className="space-y-4">
        <PageHeader
          title={isOnlineVariant ? t('admin.online.editorTitle') : t('admin.editor.title')}
        />
        <StatusBanner
          status={{
            type: 'error',
            message: wrongType
              ? isOnlineVariant
                ? t('admin.online.notOnlineCourse')
                : t('admin.editor.notFormation')
              : error?.code === 'COURSE_NOT_FOUND'
                ? isOnlineVariant
                  ? t('admin.online.courseNotFound')
                  : t('admin.editor.courseNotFound')
                : adminErrorText(error, t),
          }}
        />
        <Link to={listPath} className="btn-outline">
          <ArrowLeft size={16} className="rtl:rotate-180" />
          {backLabel}
        </Link>
      </div>
    )
  }

  const videoRef = lessonForm.videoRef.trim()
  const videoExists = videoRef !== '' && fileSet.has(videoRef)

  return (
    <div className="space-y-5">
      <PageHeader
        title={detail.course.nameFr}
        description={
          isOnlineVariant ? t('admin.online.editorDescription') : t('admin.editor.description')
        }
        actions={
          <>
            <Link to={listPath} className="btn-outline">
              <ArrowLeft size={16} className="rtl:rotate-180" />
              {backLabel}
            </Link>
            <Badge tone={detail.course.isActive ? 'green' : 'slate'}>
              {detail.course.isActive
                ? t('admin.common.published')
                : t('admin.common.hidden')}
            </Badge>
            <Toggle
              checked={detail.course.isActive}
              onChange={toggleCourseStatus}
              disabled={busyKey === 'course-status'}
              label={
                isOnlineVariant
                  ? t('admin.online.toggleCourse')
                  : t('admin.editor.toggleCourse')
              }
            />
            {isOnlineVariant && (
              <button
                type="button"
                onClick={deleteCourse}
                disabled={busyKey === 'course-delete'}
                className="grid h-10 w-10 place-items-center rounded-xl border border-red-200 text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                aria-label={t('admin.online.deleteCourse')}
                title={t('admin.online.deleteCourse')}
              >
                <Trash2 size={17} />
              </button>
            )}
          </>
        }
      />

      {pageStatus && (
        <StatusBanner status={pageStatus} onClose={() => setPageStatus(null)} />
      )}

      {isOnlineVariant && (
        <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setTab('content')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-bold transition-colors ${
              tab === 'content'
                ? 'bg-navy-900 text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-navy-900'
            }`}
          >
            <BookOpen size={15} />
            {t('admin.online.tabContent')}
          </button>
          <button
            type="button"
            onClick={() => setTab('subscribers')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-bold transition-colors ${
              tab === 'subscribers'
                ? 'bg-navy-900 text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-navy-900'
            }`}
          >
            <Users size={15} />
            {t('admin.online.tabSubscribers')}
          </button>
        </div>
      )}

      {(!isOnlineVariant || tab === 'content') && (
        <>
          <Panel>
            <form onSubmit={handleSaveCourse} className="space-y-4">
              <div className="flex items-center gap-2">
                <BookOpen size={18} className="text-accent-600" />
                <h2 className="text-sm font-extrabold uppercase tracking-wide text-navy-900">
                  {isOnlineVariant ? t('admin.online.details') : t('admin.editor.details')}
                </h2>
              </div>

              <CourseFields
                form={form}
                onChange={updateCourseField}
                idPrefix="course-editor"
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingCourse}
                  className="btn-primary disabled:cursor-wait disabled:opacity-60"
                >
                  {savingCourse
                    ? t('admin.common.saving')
                    : isOnlineVariant
                      ? t('admin.online.saveCourse')
                      : t('admin.editor.saveCourse')}
                </button>
              </div>
            </form>
          </Panel>

          {isOnlineVariant && (
            <Panel>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <BookOpen size={18} className="text-accent-600" />
                  <h2 className="text-sm font-extrabold uppercase tracking-wide text-navy-900">
                    {t('admin.editor.axesTitle')}
                  </h2>
                </div>
                <button type="button" onClick={openAddAxis} className="btn-outline">
                  <Plus size={16} />
                  {t('admin.editor.addAxis')}
                </button>
              </div>

        {axes.length === 0 ? (
          <p className="rounded-xl border-2 border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
            {t('admin.editor.noAxes')}
          </p>
        ) : (
          <div className="space-y-4">
            {axes.map((axis, axisIndex) => (
              <div key={axis.id} className="overflow-hidden rounded-2xl border border-slate-200">
                <div className="flex flex-wrap items-center gap-2 bg-slate-50 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-extrabold text-navy-900">{axis.titleFr}</p>
                    <p className="text-xs text-slate-500" dir="rtl">
                      {axis.titleAr}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveAxis(axis.id, -1)}
                      disabled={axisIndex === 0 || busyKey === 'axis-order'}
                      className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-accent-400 hover:text-accent-600 disabled:opacity-40"
                      aria-label={t('admin.editor.moveUp')}
                    >
                      <ArrowUp size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveAxis(axis.id, 1)}
                      disabled={axisIndex === axes.length - 1 || busyKey === 'axis-order'}
                      className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-accent-400 hover:text-accent-600 disabled:opacity-40"
                      aria-label={t('admin.editor.moveDown')}
                    >
                      <ArrowDown size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditAxis(axis)}
                      className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-accent-400 hover:text-accent-600"
                      aria-label={t('admin.common.edit')}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteAxis(axis)}
                      disabled={busyKey === `axis-${axis.id}`}
                      className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-red-300 hover:text-red-600 disabled:opacity-50"
                      aria-label={t('admin.common.delete')}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 bg-white">
                  {axis.lessons.length === 0 ? (
                    <p className="px-4 py-4 text-xs text-slate-500">
                      {t('admin.editor.noLessons')}
                    </p>
                  ) : (
                    axis.lessons.map((lesson, lessonIndex) => {
                      const missing =
                        lesson.videoRef &&
                        !videosLoading &&
                        !videosError &&
                        !fileSet.has(lesson.videoRef)
                      return (
                        <div
                          key={lesson.id}
                          className="flex flex-wrap items-center gap-3 px-4 py-3"
                        >
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-xs font-extrabold text-slate-500">
                            {lessonIndex + 1}
                          </span>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-navy-900">
                              {lesson.titleFr}
                            </p>
                            <p className="truncate text-xs text-slate-500" dir="rtl">
                              {lesson.titleAr}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                              <span className="inline-flex items-center gap-1">
                                <Clock3 size={12} />
                                {formatDuration(lesson.duration)}
                              </span>
                              {lesson.videoRef ? (
                                <span
                                  className={`inline-flex items-center gap-1 font-semibold ${
                                    missing ? 'text-amber-600' : 'text-green-600'
                                  }`}
                                >
                                  <FileVideo size={12} />
                                  {lesson.videoRef}
                                  {missing && ` · ${t('admin.editor.videoMissing')}`}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-slate-400">
                                  <VideoOff size={12} />
                                  {t('admin.editor.noVideo')}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Badge tone={lesson.isActive ? 'green' : 'slate'}>
                              {lesson.isActive
                                ? t('admin.common.published')
                                : t('admin.common.hidden')}
                            </Badge>
                            <Toggle
                              checked={lesson.isActive}
                              onChange={() => toggleLessonStatus(lesson)}
                              disabled={busyKey === `lesson-${lesson.id}`}
                              label={t('admin.editor.toggleLesson')}
                            />
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => moveLesson(axis, lesson.id, -1)}
                              disabled={lessonIndex === 0 || busyKey === 'lesson-order'}
                              className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-accent-400 hover:text-accent-600 disabled:opacity-40"
                              aria-label={t('admin.editor.moveUp')}
                            >
                              <ArrowUp size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveLesson(axis, lesson.id, 1)}
                              disabled={
                                lessonIndex === axis.lessons.length - 1 ||
                                busyKey === 'lesson-order'
                              }
                              className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-accent-400 hover:text-accent-600 disabled:opacity-40"
                              aria-label={t('admin.editor.moveDown')}
                            >
                              <ArrowDown size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditLesson(lesson)}
                              className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-accent-400 hover:text-accent-600"
                              aria-label={t('admin.common.edit')}
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteLesson(lesson)}
                              disabled={busyKey === `lesson-${lesson.id}`}
                              className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-red-300 hover:text-red-600 disabled:opacity-50"
                              aria-label={t('admin.common.delete')}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      )
                    })
                  )}

                  <div className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => openAddLesson(axis.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs font-bold text-navy-900 transition-colors hover:border-accent-400 hover:text-accent-600"
                    >
                      <Plus size={14} />
                      {t('admin.editor.addLesson')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {ungroupedLessons.length > 0 && (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-extrabold text-amber-800">{t('admin.editor.ungrouped')}</p>
            <p className="mt-1 text-xs text-amber-700">{t('admin.editor.ungroupedHint')}</p>
            <ul className="mt-3 divide-y divide-amber-200">
              {ungroupedLessons.map((lesson) => (
                <li key={lesson.id} className="flex items-center gap-3 py-2">
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-amber-900">
                    {lesson.titleFr}
                  </span>
                  <button
                    type="button"
                    onClick={() => openEditLesson(lesson)}
                    className="rounded-lg border border-amber-300 px-2.5 py-1 text-xs font-bold text-amber-800 hover:bg-amber-100"
                  >
                    {t('admin.common.edit')}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteLesson(lesson)}
                    className="rounded-lg border border-amber-300 px-2.5 py-1 text-xs font-bold text-amber-800 hover:bg-amber-100"
                  >
                    {t('admin.common.delete')}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
            </Panel>
          )}
        </>
      )}

      {isOnlineVariant && tab === 'subscribers' && (
        <AdminOnlineCourseSubscribers courseId={courseId} />
      )}

      {/* Axis modal */}
      <Modal
        open={axisModalOpen}
        onClose={() => setAxisModalOpen(false)}
        title={editingAxis ? t('admin.editor.editAxis') : t('admin.editor.addAxis')}
        footer={
          <>
            <button
              type="button"
              onClick={() => setAxisModalOpen(false)}
              className="btn-outline"
            >
              {t('admin.common.cancel')}
            </button>
            <button
              type="submit"
              form="axis-form"
              disabled={busyKey === 'axis-save'}
              className="btn-primary disabled:cursor-wait disabled:opacity-60"
            >
              {busyKey === 'axis-save' ? t('admin.common.saving') : t('admin.common.save')}
            </button>
          </>
        }
      >
        <form id="axis-form" onSubmit={saveAxis} className="space-y-4">
          <Field label={t('admin.editor.axisTitleFr')} htmlFor="axis-title-fr">
            <input
              id="axis-title-fr"
              required
              maxLength={150}
              value={axisForm.titleFr}
              onChange={(event) =>
                setAxisForm((current) => ({ ...current, titleFr: event.target.value }))
              }
              className={inputClass}
            />
          </Field>
          <Field label={t('admin.editor.axisTitleAr')} htmlFor="axis-title-ar">
            <input
              id="axis-title-ar"
              required
              maxLength={150}
              dir="rtl"
              value={axisForm.titleAr}
              onChange={(event) =>
                setAxisForm((current) => ({ ...current, titleAr: event.target.value }))
              }
              className={inputClass}
            />
          </Field>
          {axisStatus && <StatusBanner status={axisStatus} />}
        </form>
      </Modal>

      {/* Lesson modal */}
      <Modal
        open={lessonModalOpen}
        onClose={() => setLessonModalOpen(false)}
        title={editingLesson ? t('admin.editor.editLesson') : t('admin.editor.addLesson')}
        wide
        footer={
          <>
            <button
              type="button"
              onClick={() => setLessonModalOpen(false)}
              className="btn-outline"
            >
              {t('admin.common.cancel')}
            </button>
            <button
              type="submit"
              form="lesson-form"
              disabled={busyKey === 'lesson-save'}
              className="btn-primary disabled:cursor-wait disabled:opacity-60"
            >
              {busyKey === 'lesson-save' ? t('admin.common.saving') : t('admin.common.save')}
            </button>
          </>
        }
      >
        <form id="lesson-form" onSubmit={saveLesson} className="space-y-4">
          <Field label={t('admin.editor.axis')} htmlFor="lesson-axis">
            <select
              id="lesson-axis"
              required
              value={lessonAxisId}
              onChange={(event) => {
                setLessonAxisId(event.target.value)
                setLessonForm((current) => ({ ...current, axisId: event.target.value }))
              }}
              className={inputClass}
            >
              <option value="">{t('admin.editor.selectAxis')}</option>
              {axes.map((axis) => (
                <option key={axis.id} value={axis.id}>
                  {axis.titleFr}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('admin.editor.titleFr')} htmlFor="lesson-title-fr">
              <input
                id="lesson-title-fr"
                required
                maxLength={200}
                value={lessonForm.titleFr}
                onChange={(event) =>
                  setLessonForm((current) => ({ ...current, titleFr: event.target.value }))
                }
                className={inputClass}
              />
            </Field>
            <Field label={t('admin.editor.titleAr')} htmlFor="lesson-title-ar">
              <input
                id="lesson-title-ar"
                required
                maxLength={200}
                dir="rtl"
                value={lessonForm.titleAr}
                onChange={(event) =>
                  setLessonForm((current) => ({ ...current, titleAr: event.target.value }))
                }
                className={inputClass}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('admin.editor.descriptionFr')} htmlFor="lesson-desc-fr">
              <textarea
                id="lesson-desc-fr"
                value={lessonForm.descriptionFr}
                onChange={(event) =>
                  setLessonForm((current) => ({
                    ...current,
                    descriptionFr: event.target.value,
                  }))
                }
                className={textareaClass}
              />
            </Field>
            <Field label={t('admin.editor.descriptionAr')} htmlFor="lesson-desc-ar">
              <textarea
                id="lesson-desc-ar"
                dir="rtl"
                value={lessonForm.descriptionAr}
                onChange={(event) =>
                  setLessonForm((current) => ({
                    ...current,
                    descriptionAr: event.target.value,
                  }))
                }
                className={textareaClass}
              />
            </Field>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-extrabold text-navy-900">
                {t('admin.editor.videoFile')}
              </h3>
              <button
                type="button"
                onClick={loadVideos}
                disabled={videosLoading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-bold text-slate-600 hover:text-navy-900 disabled:opacity-60"
              >
                <RefreshCw size={12} className={videosLoading ? 'animate-spin' : ''} />
                {t('admin.common.refresh')}
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t('admin.editor.selectVideo')} htmlFor="lesson-video-select">
                <select
                  id="lesson-video-select"
                  value={videoExists ? videoRef : ''}
                  onChange={(event) => {
                    const value = event.target.value
                    if (!value) return
                    setLessonForm((current) => ({ ...current, videoRef: value }))
                  }}
                  className={inputClass}
                  disabled={videosLoading || videoFiles.length === 0}
                >
                  <option value="">
                    {videosLoading
                      ? t('admin.common.loading')
                      : videoFiles.length === 0
                        ? t('admin.editor.noVideos')
                        : t('admin.editor.selectVideoPlaceholder')}
                  </option>
                  {videoFiles.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                label={t('admin.editor.manualVideo')}
                htmlFor="lesson-video-manual"
                hint={t('admin.editor.videoHint')}
              >
                <input
                  id="lesson-video-manual"
                  value={lessonForm.videoRef}
                  onChange={(event) =>
                    setLessonForm((current) => ({ ...current, videoRef: event.target.value }))
                  }
                  className={inputClass}
                  placeholder="lesson-01.mp4"
                  dir="ltr"
                />
              </Field>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {videoRef === '' ? (
                <Badge tone="slate">{t('admin.editor.noVideo')}</Badge>
              ) : videoExists ? (
                <Badge tone="green">{t('admin.editor.videoFound')}</Badge>
              ) : (
                <Badge tone="amber">{t('admin.editor.videoMissing')}</Badge>
              )}
              {!videosConfigured && (
                <span className="text-xs font-semibold text-amber-700">
                  {t('admin.editor.videoDirMissing')}
                </span>
              )}
              {videosError && (
                <span className="text-xs font-semibold text-red-600">
                  {t('admin.editor.videoListError')}
                </span>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={t('admin.editor.durationSeconds')}
              htmlFor="lesson-duration"
              hint={t('admin.editor.durationHint')}
            >
              <input
                id="lesson-duration"
                type="number"
                min="0"
                step="1"
                value={lessonForm.duration}
                onChange={(event) =>
                  setLessonForm((current) => ({ ...current, duration: event.target.value }))
                }
                className={inputClass}
              />
            </Field>

            <div className="flex items-end">
              <label className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <Toggle
                  checked={lessonForm.isActive}
                  onChange={(value) =>
                    setLessonForm((current) => ({ ...current, isActive: value }))
                  }
                  label={t('admin.editor.lessonPublished')}
                />
                <span className="text-sm font-semibold text-navy-900">
                  {t('admin.editor.lessonPublished')}
                </span>
              </label>
            </div>
          </div>

          {lessonStatus && <StatusBanner status={lessonStatus} />}
        </form>
      </Modal>
    </div>
  )
}
