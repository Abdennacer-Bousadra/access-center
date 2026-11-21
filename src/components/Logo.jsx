import { Link } from 'react-router-dom'
import logo from '../assets/LogoAccesseCenter.jpg'

/**
 * ACCESS CENTER brand logo (official logo image).
 * By default the logo sits directly on the surrounding background inside a
 * transparent wrapper, so it blends seamlessly with the dark navy navbar,
 * footer, and login brand panel. Pass `chip` to keep the soft white rounded
 * box when rendering on a light background (white mobile drawer / form panel).
 * Always links back to the home page (`/`).
 */
export default function Logo({ onClick, chip = false, className = '' }) {
  return (
    <Link
      to="/"
      onClick={onClick}
      className={`group flex shrink-0 items-center ${className}`.trim()}
      aria-label="ACCESS CENTER"
    >
      {chip ? (
        <span className="flex h-11 shrink-0 items-center overflow-hidden rounded-xl bg-white px-2 shadow-sm ring-1 ring-slate-200/70 transition-transform duration-300 group-hover:scale-105">
          <img
            src={logo}
            alt="ACCESS CENTER"
            className="h-9 w-auto max-h-full object-contain md:h-10"
          />
        </span>
      ) : (
        <img
          src={logo}
          alt="ACCESS CENTER"
          className="h-9 w-auto max-h-full object-contain transition-transform duration-300 group-hover:scale-105 md:h-10"
        />
      )}
    </Link>
  )
}