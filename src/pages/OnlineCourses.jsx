import { MonitorPlay } from 'lucide-react'
import PageBanner from '../components/PageBanner'
import OnlineCourseCard from '../components/OnlineCourseCard'
import { useAuth } from '../context/AuthContext'
import { useCatalog } from '../context/CatalogContext'
import { useLanguage } from '../i18n/LanguageContext'
import { useEnrollments } from '../hooks/useEnrollments'

export default function OnlineCourses() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const { courses } = useCatalog()
  const { isEnrolled, loading: enrollmentsLoading } = useEnrollments()

  const onlineCourses = courses.filter((course) => course.isOnline)

  return (
    <>
      <PageBanner
        crumbs={[t('nav.home'), t('onlineCoursesPage.title')]}
        title={t('onlineCoursesPage.title')}
        eyebrow={t('onlineCoursesPage.eyebrow')}
        description={t('onlineCoursesPage.description')}
      />

      <section className="bg-slate-50 py-16 md:py-20">
        <div className="container-x">
          {onlineCourses.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {onlineCourses.map((course) => (
                <OnlineCourseCard
                  key={course.id}
                  course={course}
                  user={user}
                  enrolled={isEnrolled(course.databaseId)}
                  busy={enrollmentsLoading}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-14 text-center">
              <MonitorPlay size={40} className="mx-auto text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-navy-900">
                {t('onlineCoursesPage.empty')}
              </p>
              <p className="mt-1 text-sm text-slate-500">{t('onlineCoursesPage.emptyHint')}</p>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
