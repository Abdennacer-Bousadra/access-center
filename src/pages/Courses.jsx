import { useMemo, useState } from 'react'
import { GraduationCap, Info } from 'lucide-react'
import PageBanner from '../components/PageBanner'
import CourseCard from '../components/CourseCard'
import { courseCategories } from '../data/content'
import { useCatalog } from '../context/CatalogContext'
import { useLanguage } from '../i18n/LanguageContext'

export default function Courses() {
  const { t } = useLanguage()
  const { courses } = useCatalog()
  const [category, setCategory] = useState('all')

  // Public catalogue: formations only (online courses live in /online-courses)
  const filtered = useMemo(
    () =>
      courses.filter(
        (course) =>
          !course.isOnline && (category === 'all' || course.category === category)
      ),
    [category, courses]
  )

  return (
    <>
      <PageBanner
        crumbs={[t('nav.home'), t('coursesPage.title')]}
        title={t('coursesPage.title')}
        eyebrow={t('coursesPage.eyebrow')}
        description={t('coursesPage.description')}
      />

      <section className="bg-slate-50 py-16 md:py-20">
        <div className="container-x">
          {/* Category tabs */}
          <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-100 bg-white p-3 shadow-card">
            {courseCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  category === cat
                    ? 'bg-accent-600 text-white shadow-lg shadow-accent-600/25'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {t(`categories.${cat}`)}
              </button>
            ))}
          </div>

          {/* Info strip */}
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-accent-600/20 bg-accent-50 p-5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-600/10 text-accent-600">
              <Info size={20} />
            </span>
            <div>
              <p className="text-sm font-bold text-navy-900">{t('coursesPage.infoTitle')}</p>
              <p className="mt-0.5 text-sm text-slate-600">{t('coursesPage.infoDesc')}</p>
            </div>
          </div>

          {/* Cards grid */}
          {filtered.length > 0 ? (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border-2 border-dashed border-slate-300 bg-white p-14 text-center">
              <GraduationCap size={40} className="mx-auto text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-navy-900">{t('coursesPage.empty')}</p>
            </div>
          )}
        </div>
      </section>
    </>
  )
}