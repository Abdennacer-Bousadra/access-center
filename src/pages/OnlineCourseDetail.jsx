import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Lock,
  MessageCircle,
  VideoOff,
} from 'lucide-react'
import PageBanner from '../components/PageBanner'
import OnlineLessonPlayer from '../components/OnlineLessonPlayer'
import { useAuth } from '../context/AuthContext'
import { useCatalog } from '../context/CatalogContext'
import { useLanguage } from '../i18n/LanguageContext'
import { useEnrollments } from '../hooks/useEnrollments'
import { api } from '../lib/api'
import { waLink } from '../utils/whatsapp'

export default function OnlineCourseDetail() {
  const { t, locale } = useLanguage()
  const { user, loading: authLoading } = useAuth()
  const { courses } = useCatalog()
  const { isEnrolled, loading: enrollmentsLoading } = useEnrollments()
  const { courseId } = useParams()
  const location = useLocation()

  const numericId = Number(courseId)
  const validId = Number.isSafeInteger(numericId) && numericId > 0
  const course = courses.find((item) => Number(item.databaseId) === numericId) ?? null
  const enrolled = validId && isEnrolled(numericId)

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedLessonId, setSelectedLessonId] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const loadedOnceRef = useRef(false)

  useEffect(() => {
    loadedOnceRef.current = false
  }, [numericId])

  useEffect(() => {
    if (authLoading || enrollmentsLoading) return undefined

    if (!user || !validId || !enrolled) {
      setData(null)
      setLoading(false)
      setError(null)
      return undefined
    }

    let active = true
    if (!loadedOnceRef.current) setLoading(true)
    setError(null)

    api
      .onlineCourse(numericId)
      .then((payload) => {
        if (!active) return
        setData(payload)

        const lessons = payload.axes.flatMap((axis) => axis.lessons)
        setSelectedLessonId((current) => {
          const stillUnlocked = lessons.find(
            (lesson) => lesson.id === current && lesson.isUnlocked
          )
          if (stillUnlocked) return stillUnlocked.id

          const next =
            lessons.find((lesson) => lesson.isUnlocked && !lesson.isCompleted) ??
            lessons.find((lesson) => lesson.isUnlocked) ??
            lessons[0] ??
            null
          return next ? next.id : null
        })
      })
      .catch((requestError) => {
        if (!active) return
        setError(requestError?.code || 'COURSE_UNAVAILABLE')
        setData(null)
      })
      .finally(() => {
        loadedOnceRef.current = true
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [authLoading, enrollmentsLoading, user, validId, enrolled, numericId, refreshKey])

  const localized = (fr, ar) => (locale === 'ar' ? ar || fr : fr)
  const title =
    course?.title ??
    (data ? localized(data.course.nameFr, data.course.nameAr) : t('onlineCoursesPage.title'))
  const description =
    course?.description ??
    (data
      ? localized(data.course.descriptionFr, data.course.descriptionAr)
      : t('onlineCoursesPage.description'))

  const allLessons = data?.axes.flatMap((axis) => axis.lessons) ?? []
  const selectedLesson =
    allLessons.find((lesson) => lesson.id === selectedLessonId) ?? null

  if (authLoading) {
    return <LoadingPanel />
  }

  if (!user) {
    const next = encodeURIComponent(location.pathname)
    return <Navigate to={`/login?next=${next}`} replace />
  }

  const whatsappHref = waLink(
    t('whatsapp.enrollOnline', {
      course: title,
      name: user.fullName ?? '',
      email: user.email ?? '',
    })
  )

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

            {enrollmentsLoading || loading ? (
              <div className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-6 text-sm font-semibold text-slate-600 shadow-card">
                <Loader2 size={20} className="shrink-0 animate-spin text-accent-600" />
                {t('onlineCoursePage.loading')}
              </div>
            ) : !enrolled ? (
              <div className="mt-6 overflow-hidden rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-card sm:p-8">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-100 text-amber-700">
                  <Lock size={22} />
                </span>
                <h2 className="mt-4 text-xl font-extrabold text-navy-900">
                  {t('onlineCoursePage.notEnrolledTitle')}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
                  {t('onlineCoursePage.notEnrolledDesc')}
                </p>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-whatsapp mt-5 w-full sm:w-auto"
                >
                  <MessageCircle size={17} />
                  {t('onlineCoursePage.requestEnroll')}
                </a>
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
                <h2 className="text-2xl font-extrabold tracking-tight text-navy-900">
                  {t('onlineCoursePage.curriculum')}
                </h2>

                {selectedLesson && (
                  <OnlineLessonPlayer
                    key={`${numericId}-${selectedLesson.id}`}
                    courseId={numericId}
                    lesson={{
                      id: selectedLesson.id,
                      title: localized(selectedLesson.titleFr, selectedLesson.titleAr),
                      hasVideo: selectedLesson.hasVideo,
                      isCompleted: selectedLesson.isCompleted,
                      positionSeconds: selectedLesson.positionSeconds,
                    }}
                    watermarkName={user.fullName ?? ''}
                    watermarkEmail={user.email ?? ''}
                    onCompleted={() => setRefreshKey((key) => key + 1)}
                  />
                )}

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
                          {axis.lessons.map((lesson, lessonIndex) => {
                            const isLocked = !lesson.isUnlocked
                            const isSelected = lesson.id === selectedLessonId

                            return (
                              <li key={lesson.id}>
                                <button
                                  type="button"
                                  disabled={isLocked}
                                  onClick={() => setSelectedLessonId(lesson.id)}
                                  title={isLocked ? t('onlineCoursePage.lockedHint') : undefined}
                                  className={[
                                    'flex w-full items-start gap-3 p-4 text-start transition-colors sm:px-5',
                                    isLocked
                                      ? 'cursor-not-allowed bg-slate-50/70'
                                      : 'hover:bg-slate-50',
                                    isSelected && !isLocked ? 'bg-navy-50/70' : '',
                                  ].join(' ')}
                                >
                                  <span
                                    className={[
                                      'grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-bold',
                                      isLocked
                                        ? 'bg-slate-100 text-slate-400'
                                        : isSelected
                                          ? 'bg-navy-900 text-white'
                                          : 'bg-slate-100 text-slate-600',
                                    ].join(' ')}
                                  >
                                    {lessonIndex + 1}
                                  </span>
                                  <span className="min-w-0 flex-1">
                                    <span
                                      className={[
                                        'block text-sm font-semibold',
                                        isLocked ? 'text-slate-400' : 'text-slate-700',
                                      ].join(' ')}
                                    >
                                      {localized(lesson.titleFr, lesson.titleAr)}
                                    </span>
                                    <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                      {isLocked && (
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                                          <Lock size={12} />
                                          {t('onlineCoursePage.locked')}
                                        </span>
                                      )}
                                      {lesson.isCompleted && (
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                                          <CheckCircle2 size={12} />
                                          {t('onlineCoursePage.completed')}
                                        </span>
                                      )}
                                      {isSelected && !isLocked && (
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-navy-50 px-2.5 py-1 text-[11px] font-semibold text-navy-900">
                                          {t('onlineCoursePage.current')}
                                        </span>
                                      )}
                                      {!lesson.hasVideo && (
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                                          <VideoOff size={12} />
                                          {t('onlineCoursePage.videoSoon')}
                                        </span>
                                      )}
                                    </span>
                                  </span>
                                </button>
                              </li>
                            )
                          })}
                        </ol>
                      ) : (
                        <p className="p-5 text-sm text-slate-500">
                          {t('onlineCoursePage.noLessons')}
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border-2 border-dashed border-slate-300 bg-white p-14 text-center">
                <AlertCircle size={40} className="mx-auto text-slate-300" />
                <p className="mt-3 text-sm font-semibold text-navy-900">
                  {t('onlineCoursePage.error')}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  )
}

function LoadingPanel() {
  const { t } = useLanguage()
  return (
    <section className="bg-slate-50 py-24">
      <div className="container-x">
        <div className="mx-auto flex max-w-4xl items-center gap-3 rounded-2xl border border-slate-200 bg-white p-6 text-sm font-semibold text-slate-600 shadow-card">
          <Loader2 size={20} className="shrink-0 animate-spin text-accent-600" />
          {t('onlineCoursePage.loading')}
        </div>
      </div>
    </section>
  )
}
