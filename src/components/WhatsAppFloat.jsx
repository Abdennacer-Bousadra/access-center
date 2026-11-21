import { MessageCircle } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'
import { waLink } from '../utils/whatsapp'

/**
 * Fixed WhatsApp button, visible on every page.
 * Anchored bottom-right for LTR, bottom-left for RTL (Arabic).
 */
export default function WhatsAppFloat() {
  const { t, isRTL } = useLanguage()

  return (
    <a
      href={waLink(t('whatsapp.general'))}
      target="_blank"
      rel="noreferrer"
      aria-label={t('whatsapp.float')}
      className={`group fixed bottom-5 z-40 flex items-center gap-3 ${isRTL ? 'left-5' : 'right-5'}`}
    >
      <span className="hidden translate-x-2 rounded-full bg-navy-900 px-4 py-2 text-sm font-semibold text-white opacity-0 shadow-xl transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 sm:block rtl:-translate-x-2 rtl:group-hover:translate-x-0">
        {t('whatsapp.float')}
      </span>
      <span className="relative grid h-14 w-14 place-items-center rounded-full bg-green-500 text-white shadow-xl shadow-green-500/40 transition-transform duration-300 hover:scale-110">
        <span className="absolute inset-0 animate-pulse-ring rounded-full bg-green-500" />
        <MessageCircle size={26} className="relative" />
      </span>
    </a>
  )
}