import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { DEFAULT_LOCALE, LOCALES, translations } from './translations'

const STORAGE_KEY = 'ac-locale'

const LanguageContext = createContext(null)

/**
 * Reads the persisted locale (safe against SSR / private browsing).
 */
function getInitialLocale() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return LOCALES.includes(saved) ? saved : DEFAULT_LOCALE
  } catch {
    return DEFAULT_LOCALE
  }
}

export function LanguageProvider({ children }) {
  const [locale, setLocale] = useState(getInitialLocale)

  // Reflect the locale on <html> (lang + dir → enables RTL for Arabic)
  useEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'
    try {
      localStorage.setItem(STORAGE_KEY, locale)
    } catch {
      /* ignore storage errors (private mode) */
    }
  }, [locale])

  // Keep the browser tab title in sync with the active locale
  useEffect(() => {
    const title = translations[locale]?.meta?.title ?? translations[DEFAULT_LOCALE].meta.title
    if (title) document.title = title
  }, [locale])

  const value = useMemo(() => {
    const dict = translations[locale] ?? translations[DEFAULT_LOCALE]
    const t = (key, vars) => {
      const text = String(key)
        .split('.')
        .reduce((obj, k) => (obj ? obj[k] : undefined), dict)
      if (text === undefined || text === null) return key
      if (!vars) return text
      return Object.entries(vars).reduce(
        (acc, [k, v]) => acc.replaceAll(`{${k}}`, String(v)),
        text
      )
    }
    return {
      locale,
      setLocale,
      t,
      isRTL: locale === 'ar',
      LOCALES,
    }
  }, [locale])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>')
  return ctx
}