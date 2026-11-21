import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  courses as fallbackCourses,
  services as fallbackServices,
} from '../data/content'
import { apiRequest } from '../lib/api'
import { useLanguage } from '../i18n/LanguageContext'

const CatalogContext = createContext(null)

// One request per page load, shared across mounts (React StrictMode mounts
// effects twice in development). On failure the promise is cleared so a later
// mount can retry.
let catalogRequest = null

function loadCatalog() {
  if (!catalogRequest) {
    catalogRequest = Promise.all([apiRequest('/services'), apiRequest('/courses')])
      .then(([servicesData, coursesData]) => {
        if (!Array.isArray(servicesData?.services) || !Array.isArray(coursesData?.courses)) {
          throw new Error('INVALID_CATALOG_RESPONSE')
        }
        return { services: servicesData.services, courses: coursesData.courses }
      })
      .catch((error) => {
        catalogRequest = null
        throw error
      })
  }
  return catalogRequest
}

/**
 * The seed rows mirror src/data/content.js. Match on the image (stable across
 * reordering) so each API row keeps its existing i18nKey/id, then fall back to
 * the seed position for safety.
 */
function matchFallback(row, list, index) {
  const byImage = row.image ? list.find((item) => item.image === row.image) : null
  return byImage || list[index] || null
}

function localizedText(fr, ar, fallback, locale, t, key) {
  const fallbackKey = fallback?.i18nKey
  // EN has no dedicated DB column yet: keep the existing English dictionary.
  if (locale === 'en' && fallbackKey) return t(`${fallbackKey}.${key}`)
  if (locale === 'ar') return ar || fr || (fallbackKey ? t(`${fallbackKey}.${key}`) : '')
  return fr || (fallbackKey ? t(`${fallbackKey}.${key}`) : '')
}

function normalizeFallbackServices(t) {
  return fallbackServices.map((service) => ({
    ...service,
    title: t(`${service.i18nKey}.title`),
    details: t(`${service.i18nKey}.details`),
  }))
}

function normalizeFallbackCourses(t) {
  return fallbackCourses.map((course) => ({
    ...course,
    databaseId: null,
    isOnline: false,
    title: t(`${course.i18nKey}.title`),
    description: t(`${course.i18nKey}.description`),
  }))
}

function normalizeApiServices(rows, locale, t) {
  return rows.map((row, index) => {
    const fallback = matchFallback(row, fallbackServices, index)
    const price = row.price === null || row.price === undefined ? null : Number(row.price)

    return {
      id: fallback?.id ?? `service-${row.id}`,
      icon: row.icon ?? fallback?.icon,
      category: row.category ?? fallback?.category,
      image: row.image ?? fallback?.image,
      price,
      onRequest: price === null,
      i18nKey: fallback?.i18nKey,
      title: localizedText(row.nameFr, row.nameAr, fallback, locale, t, 'title'),
      details: localizedText(row.descriptionFr, row.descriptionAr, fallback, locale, t, 'details'),
    }
  })
}

function normalizeApiCourses(rows, locale, t) {
  return rows.map((row, index) => {
    const fallback = matchFallback(row, fallbackCourses, index)
    const fee = row.price === null || row.price === undefined ? null : Number(row.price)

    return {
      id: fallback?.id ?? `course-${row.id}`,
      databaseId: row.id,
      isOnline: Boolean(row.isOnline),
      icon: row.icon ?? fallback?.icon,
      category: row.category ?? fallback?.category,
      image: row.image ?? fallback?.image,
      durationMonths: row.durationMonths ?? fallback?.durationMonths ?? null,
      fee: fee ?? fallback?.fee ?? 0,
      i18nKey: fallback?.i18nKey,
      title: localizedText(row.nameFr, row.nameAr, fallback, locale, t, 'title'),
      description: localizedText(
        row.descriptionFr,
        row.descriptionAr,
        fallback,
        locale,
        t,
        'description'
      ),
    }
  })
}

export function CatalogProvider({ children }) {
  const { locale, t } = useLanguage()
  const [rows, setRows] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true

    loadCatalog()
      .then((data) => {
        if (!active) return
        setRows(data)
        setError(null)
      })
      .catch((requestError) => {
        if (!active) return
        // Silent fallback: the site must look identical and keep working when
        // the API is not reachable.
        console.warn(
          '[catalog] API unavailable — using local fallback data:',
          requestError?.code || requestError?.message
        )
        setError(requestError?.code || requestError?.message || 'CATALOG_UNAVAILABLE')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const value = useMemo(() => {
    const usingApi = Array.isArray(rows?.services) && Array.isArray(rows?.courses)

    return {
      services: usingApi
        ? normalizeApiServices(rows.services, locale, t)
        : normalizeFallbackServices(t),
      courses: usingApi
        ? normalizeApiCourses(rows.courses, locale, t)
        : normalizeFallbackCourses(t),
      loading,
      error,
      source: usingApi ? 'api' : 'fallback',
    }
  }, [rows, locale, t, loading, error])

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
}

export function useCatalog() {
  const ctx = useContext(CatalogContext)
  if (!ctx) throw new Error('useCatalog must be used inside <CatalogProvider>')
  return ctx
}
