import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Loader2,
  Lock,
  MessageCircle,
  PlayCircle,
} from 'lucide-react'
import PageBanner from '../components/PageBanner'
import { useAuth } from '../context/AuthContext'
import { useCatalog } from '../context/CatalogContext'
import { useLanguage } from '../i18n/LanguageContext'
import { useEnrollments } from '../hooks/useEnrollments'
import { api } from '../lib/api'
import { waLink } from '../utils/whatsapp'

/**
 * Public online-course preview. Shows the description, axes and lesson titles
 * only. Video data is never fetched here; the full course stays protected.
 */
export default function OnlineCoursePreview() {
  const { t, locale } = useLanguage()
  const { user, loading: authLoading } = useAuth()
  const { courses } = useCatalog()
  const { isEnrolled, loading: enrollmentsLoading } = useEnrollments()
  const { courseId } = useParams()

  const numericId = Number(courseId)
  const validId = Number.isSafeInteger(numericId) && numericId > 0
  const catalogCourse =
    courses.find(
      (item) => Number(item.databaseId) === numericId && item.isOnline
    ) ?? null
  const enrolled = validId && isEnrolled(numericId)

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!validId) {
      setData(null)
      setLoading(false)
      setError('COURSE_NOT_FOUND')
      return undefined
    }

    let active = true
    setLoading(true)
    setError(null)

    api
      .onlineCoursePreview(numericId)
      .then((payload) => {
        if (active) setData(payload)
      })
      .catch((requestError) => {
        if (!active) return
        setError(requestError?.code || 'COURSE_UNAVAILABLE')
        setData(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [numericId, validId])

  const localized = (fr, ar) => (locale === 'ar' ? ar || fr : fr)
  const apiCourse = data?.course ?? null
  const title =
    catalogCourse?.title ??
    (apiCourse
      ? localized(apiCourse.nameFr, apiCourse.nameAr)
      : t('onlineCoursesPage.title'))
  const description =
    catalogCourse?.description ??
    (apiCourse
      ? localized(apiCourse.descriptionFr, apiCourse.descriptionAr)
      : t('onlineCoursesPage.description'))
  const lessonCount = data?.lessonCount ?? 0

  const previewPath = `/online-courses/${numericId}/preview`
  const loginHref = `/login?next=${encodeURIComponent(previewPath)}`
  const whatsappHref = waLink(
    t('whatsapp.enrollOnline', {
      course: title,
      name: user?.fullName ?? '',
      email: user?.email ?? '',
    })
  )

  let action
  if (authLoading || enrollmentsLoading) {
    action = (
      <button
        type="button"
        disabled
        className="btn-primary w-full disabled:cursor-wait disabled:opacity-60 sm:w-auto"
      >
        <Loader2 size={17} className="animate-spin" />
        {t('onlineCoursesPage.loading')}
      </button>
    )
  } else if (enrolled) {
    action = (
      <Link to={`/online-courses/${numericId}`} className="btn-primary w-full sm:w-auto">
        <PlayCircle size={17} />
        {t('onlineCoursesPage.openCta')}
      </Link>
    )
  } else if (user) {
    action = (
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-whatsapp w-full sm:w-auto"
      >
        <MessageCircle size={17} />
        {t('onlineCoursePage.requestAccess')}
      </a>
    )
  } else {
    action = (
      <Link to={loginHref} className="btn-primary w-full sm:w-auto">
        <Lock size={17} />
        {t('onlineCoursePage.requestAccess')}
      </Link>
    )
  }

  return (
    <>
      <PageBanner
        crumbs={[t('nav.home'), t('onlineCoursesPage.title'), title]}
        title={title}
        eyebrow={t('onlineCoursesPage.eyebrow')}
        description={description}
      />

      <section className="bg-slate-50 py-16 md:py-20">
        <div className="container-x">
          <div className="mx-auto max-w-4xl">
            <Link
              to="/online-courses"
              className="inline-flex items-center gap-2 text-sm font-semibold text-navy-900 transition-colors hover:text-accent-600"
            >
              <ArrowLeft size={17} className="rtl:-scale-x-100" />
              {t('onlineCoursePage.back')}
            </Link>

            {loading ? (
              <div className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-6 text-sm font-semibold text-slate-600 shadow-card">
                <Loader2 size={20} className="shrink-0 animate-spin text-accent-600" />
                {t('onlineCoursePage.loading')}
              </div>
            ) : error ? (
              <div className="mt-6 rounded-2xl border-2 border-dashed border-slate-300 bg-white p-14 text-center">
                <AlertCircle size={40} className="mx-auto text-slate-300" />
                <p className="mt-3 text-sm font-semibold text-navy-900">
                  {error === 'COURSE_NOT_FOUND'
                    ? t('onlineCoursePage.notFound')
                    : t('onlineCoursePage.error')}
                </p>
              </div>
            ) : data ? (
              <div className="mt-8">
                <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-navy-900 text-white">
                      <BookOpen size={20} />
                    </span>
                    <div>
                      <p className="text-sm font-extrabold text-navy-900">
                        {t('onlineCoursePage.previewEyebrow')}
                      </p>
                      <p className="text-xs font-semibold text-slate-500">
                        {t('onlineCoursePage.lessonCount', { count: lessonCount })}
                      </p>
                    </div>
                  </div>
                  {action}
                </div>

                <h2 className="mt-8 text-2xl font-extrabold tracking-tight text-navy-900">
                  {t('onlineCoursePage.curriculum')}
                </h2>

                {data.axes.length > 0 ? (
                  <div className="mt-5 space-y-5">
                    {data.axes.map((axis, axisIndex) => (
                      <article
                        key={axis.id}
                        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card"
                      >
                        <header className="flex items-start gap-3 border-b border-slate-100 p-5">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-navy-900 text-sm font-black text-white">
                            {axisIndex + 1}
                          </span>
                          <h3 className="min-w-0 flex-1 pt-1 text-lg font-extrabold leading-snug text-navy-900">
                            {localized(axis.titleFr, axis.titleAr)}
                          </h3>
                        </header>

                        {axis.lessons.length > 0 ? (
                          <ol className="divide-y divide-slate-100">
                            {axis.lessons.map((lesson, lessonIndex) => (
                              <li
                                key={lesson.id}
                                className="flex items-start gap-3 p-4 sm:px-5"
                              >
                                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
                                  {lessonIndex + 1}
                                </span>
                                <p className="min-w-0 flex-1 text-sm font-semibold text-slate-700">
                                  {localized(lesson.titleFr, lesson.titleAr)}
                                </p>
                              </li>
                            ))}
                          </ol>
                        ) : (
                          <p className="p-5 text-sm text-slate-500">
                            {t('onlineCoursePage.noLessons')}
                          </p>
                        )}
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="mt-6 rounded-2xl border-2 border-dashed border-slate-300 bg-white p-14 text-center">
                    <BookOpen size={40} className="mx-auto text-slate-300" />
                    <p className="mt-3 text-sm font-semibold text-navy-900">
                      {t('onlineCoursePage.noLessons')}
                    </p>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </>
  )
}
