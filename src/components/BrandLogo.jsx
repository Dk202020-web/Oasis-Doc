import { Link } from 'react-router-dom'

export default function BrandLogo({ compact = false }) {
  return (
    <Link to="/" className="group flex items-center" aria-label="Oasis-Doc — Home">
      <img
        src="/logo.png"
        alt="Oasis-Doc logo"
        className={`${compact ? 'h-14' : 'h-16 md:h-20'} w-auto shrink-0 object-contain`}
      />
    </Link>
  )
}
