import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import PageBanner from '../components/PageBanner'
import ServiceCard from '../components/ServiceCard'
import { serviceCategories } from '../data/content'
import { useCatalog } from '../context/CatalogContext'
import { useLanguage } from '../i18n/LanguageContext'

export default function Services() {
  const { t } = useLanguage()
  const { services } = useCatalog()
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [category, setCategory] = useState('all')

  // Keep the search box in sync with the header search (?q=…)
  useEffect(() => {
    setQuery(searchParams.get('q') || '')
  }, [searchParams])

  // Filter services by active category + search query (localized text)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return services.filter((service) => {
      const haystack = `${service.title} ${service.details}`.toLowerCase()
      const matchesCategory = category === 'all' || service.category === category
      const matchesQuery = q === '' || haystack.includes(q)
      return matchesCategory && matchesQuery
    })
  }, [query, category, services])

  return (
    <>
      <PageBanner
        crumbs={[t('nav.home'), t('servicesPage.title')]}
        title={t('servicesPage.title')}
        eyebrow={t('servicesPage.eyebrow')}
        description={t('servicesPage.description')}
      />

      <section className="bg-slate-50 py-16 md:py-20">
        <div className="container-x">
          {/* Search + category filter */}
          <div className="flex flex-col gap-5 rounded-2xl border border-slate-100 bg-white p-5 shadow-card lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 rtl:left-auto rtl:right-4" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('servicesPage.search')}
                aria-label={t('servicesPage.search')}
                className="input-field pl-11 rtl:pl-4 rtl:pr-11"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {serviceCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                    category === cat
                      ? 'bg-accent-600 text-white shadow-lg shadow-accent-600/25'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t(`categories.${cat}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Result count */}
          <p className="mt-6 text-sm text-slate-500">
            {t('servicesPage.results', { count: filtered.length })}
            {query.trim() && <> {t('servicesPage.foundFor', { query: query.trim() })}</>}
          </p>

          {/* Cards grid */}
          {filtered.length > 0 ? (
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border-2 border-dashed border-slate-300 bg-white p-14 text-center">
              <Search size={40} className="mx-auto text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-navy-900">{t('servicesPage.emptyTitle')}</p>
              <p className="mt-1 text-sm text-slate-500">{t('servicesPage.emptyDesc')}</p>
            </div>
          )}
        </div>
      </section>
    </>
  )
}