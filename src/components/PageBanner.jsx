import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

/**
 * Inner-page banner used on /services and /courses.
 * Builds a breadcrumb from the `crumbs` array (last item = current page).
 */
export default function PageBanner({ eyebrow, title, description, crumbs = [] }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700">
      {/* Decorative glows */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-accent-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-accent-400/20 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="container-x relative py-16 md:py-20">
        {/* Breadcrumb */}
        {crumbs.length > 0 && (
          <nav className="mb-5 flex flex-wrap items-center gap-1.5 text-xs font-semibold text-slate-400">
            {crumbs.map((crumb, i) => {
              const isLast = i === crumbs.length - 1
              return isLast ? (
                <span key={crumb + i} className="text-accent-300">
                  {crumb}
                </span>
              ) : (
                <span key={crumb + i} className="inline-flex items-center gap-1.5">
                  <Link to="/" className="transition-colors hover:text-white">
                    {crumb}
                  </Link>
                  <ChevronRight size={13} />
                </span>
              )
            })}
          </nav>
        )}

        <span className="eyebrow-pill border border-white/20 bg-white/10 text-accent-300">
          ACCESS CENTER
        </span>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white md:text-5xl">
          {title}
        </h1>
        {description && (
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-300 md:text-base">
            {description}
          </p>
        )}
        {eyebrow && (
          <p className="mt-6 text-sm font-bold uppercase tracking-widest text-accent-300">{eyebrow}</p>
        )}
      </div>
    </section>
  )
}