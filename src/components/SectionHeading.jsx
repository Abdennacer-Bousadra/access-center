import { Sparkles } from 'lucide-react'

/**
 * Consistent section heading (eyebrow + title + optional description).
 * `light` adapts colors for dark (navy) backgrounds.
 */
export default function SectionHeading({ eyebrow, title, description, light = false }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      {eyebrow && (
        <span
          className={`eyebrow-pill ${
            light
              ? 'border border-white/20 bg-white/10 text-accent-300'
              : 'border border-accent-600/20 bg-accent-600/10 text-accent-700'
          }`}
        >
          <Sparkles size={14} />
          {eyebrow}
        </span>
      )}
      <h2
        className={`mt-4 text-3xl font-extrabold tracking-tight md:text-4xl ${
          light ? 'text-white' : 'text-navy-900'
        }`}
      >
        {title}
      </h2>
      {description && (
        <p
          className={`mt-4 text-sm leading-relaxed md:text-base ${
            light ? 'text-slate-300' : 'text-slate-600'
          }`}
        >
          {description}
        </p>
      )}
    </div>
  )
}