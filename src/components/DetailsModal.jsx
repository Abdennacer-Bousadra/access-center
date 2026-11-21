import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

/**
 * Clean full-details modal rendered through a portal (document.body)
 * so the card's overflow-hidden / transforms can never clip it.
 * Props: open, onClose, tag, title, details, footer (optional node).
 */
export default function DetailsModal({ open, onClose, tag, title, details, footer = null }) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      {/* Click-away backdrop */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-black/70 backdrop-blur-sm"
      />
      <div className="animate-fade-up relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-slate-900 text-white shadow-2xl">
        <header className="flex items-center justify-between gap-3 px-6 pb-0 pt-6">
          <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-white backdrop-blur-sm">
            {tag}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 transition-colors hover:bg-[#dc2626]"
          >
            <X size={18} />
          </button>
        </header>

        <div className="px-6 pb-6 pt-4">
          <h3 className="text-xl font-extrabold leading-snug text-white">{title}</h3>
          <p className="mt-3 text-sm leading-relaxed text-slate-200">{details}</p>
          {footer && <div className="mt-5">{footer}</div>}
        </div>
      </div>
    </div>,
    document.body
  )
}