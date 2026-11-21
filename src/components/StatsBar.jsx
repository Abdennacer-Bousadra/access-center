import { useEffect, useRef, useState } from 'react'

/**
 * Animated counter — counts up from 0 to `value` when scrolled into view.
 */
function Counter({ value, suffix = '', label }) {
  const ref = useRef(null)
  const started = useRef(false)
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return
        started.current = true
        const duration = 1600
        const start = performance.now()
        const tick = (now) => {
          const p = Math.min((now - start) / duration, 1)
          const eased = 1 - Math.pow(1 - p, 3)
          setDisplay(Math.round(eased * value))
          if (p < 1) requestAnimationFrame(tick)
          else setDisplay(value)
        }
        requestAnimationFrame(tick)
      },
      { threshold: 0.4 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [value])

  return (
    <div ref={ref} className="text-center">
      <p className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
        {display.toLocaleString()}
        {suffix}
      </p>
      <p className="mt-1.5 text-xs font-semibold uppercase tracking-widest text-white/70 md:text-sm">
        {label}
      </p>
    </div>
  )
}

/**
 * Blue gradient stats band with animated counters.
 * `items` = [{ value, suffix, label }]
 */
export default function StatsBar({ items }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-navy-950 via-navy-800 to-navy-600">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.07)_1px,transparent_1px)] bg-[size:24px_24px]" />
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent-300/25 blur-3xl" />
      <div className="container-x relative grid grid-cols-2 gap-x-4 gap-y-10 py-12 md:grid-cols-4 md:py-14">
        {items.map((item) => (
          <Counter key={item.label} {...item} />
        ))}
      </div>
    </section>
  )
}